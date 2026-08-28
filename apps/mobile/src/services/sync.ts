import { api, refreshSessionToken } from './api';
import { storage, SyncOperation } from './storage';
import { media, QueuedPhoto, setOnPhotoQueued } from './media';
import { API_BASE_URL } from '../config';

export interface SyncResult {
  success: boolean;
  processedCount: number;
  error?: string;
  /** Photos uploaded to the server during this sync round (additive field). */
  photosUploaded?: number;
  /** Photos still queued locally after this sync round (additive field). */
  photosPending?: number;
}

/**
 * Uploads one queued photo to POST /intervals/:serverIntervalId/media.
 * Uses fetch (NOT the axios client) so React Native handles the multipart
 * body natively without transformRequest interference. Returns the HTTP
 * status so the caller can refresh an expired token and retry.
 */
async function uploadQueuedPhoto(
  photo: QueuedPhoto,
  serverIntervalId: string,
  token: string
): Promise<number> {
  const form = new FormData();
  form.append('file', {
    uri: photo.uri,
    name: photo.fileName,
    type: photo.mimeType,
  } as any);

  // Real GPS stamp captured with the photo (omitted when GPS was unavailable)
  if (photo.gpsLat != null && photo.gpsLng != null) {
    form.append('gpsLat', String(photo.gpsLat));
    form.append('gpsLng', String(photo.gpsLng));
    if (photo.accuracyM != null) form.append('accuracyM', String(photo.accuracyM));
  }
  form.append('purpose', photo.purpose);
  if (photo.takenAt) form.append('takenAt', photo.takenAt);

  // RN fetch has NO default timeout — a stalled 2G socket used to hang this
  // upload forever, and with it the whole sync pipeline (every trigger just
  // joins the in-flight round). 3 minutes covers a 100 MB closure video on
  // a slow connection; a genuinely dead socket gets cut and retried.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180_000);
  try {
    const response = await fetch(`${API_BASE_URL}/intervals/${serverIntervalId}/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
      signal: controller.signal,
    });
    return response.status;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Runs `fn` over items with bounded concurrency. The pull used to fire one
 * request per borehole all at once — on 2G they contend for the same
 * bandwidth and most exceed the 60s timeout (thundering herd, worse after
 * a Render cold start).
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    }
  );
  await Promise.all(workers);
  return results;
}

/**
 * Returns true if this cached item still has an unsynced operation in the
 * queue (matched by entity id, payload id, or intervalNo within a borehole).
 * Such items must NOT be overwritten/dropped when pulling server data.
 */
function isLocallyPending(item: any, queue: SyncOperation[], boreholeId?: string): boolean {
  if (!item) return false;
  return queue.some((op) => {
    if (item.id && op.entityId === item.id) return true;
    const payload = op.payloadJson || {};
    if (item.id && payload.id === item.id) return true;
    if (
      item.intervalNo != null &&
      payload.intervalNo != null &&
      payload.intervalNo === item.intervalNo
    ) {
      // Scope intervalNo matches to the borehole being merged when possible
      if (!boreholeId || !payload.boreholeId || payload.boreholeId === boreholeId) {
        return true;
      }
    }
    return false;
  });
}

// Device-side workflow fields the server doesn't return. A raw server-wins
// overwrite used to wipe them once the queue drained — resetting the live
// depth display and weather/start-date mid-boring (same list as
// BoringListScreen's pull-merge).
const BOREHOLE_LOCAL_ONLY_FIELDS = [
  'currentDepth',
  'rigSetupDone',
  'rigType',
  'diameter',
  'drillingFluid',
  'hammerType',
  'drillerId',
  'startDate',
  'weather',
];

/**
 * Merge server data with the local cache:
 * - server wins for records that have no pending local edits;
 * - local wins for records that still have a queued (unsynced) operation;
 * - local-only records (e.g. created offline) are kept as long as they have
 *   a pending queue operation;
 * - fields in localOnlyFields are carried over from the cached copy when
 *   the server row has nothing for them, even without pending edits.
 */
function mergeServerWithLocal(
  serverItems: any[],
  localItems: any[],
  queue: SyncOperation[],
  boreholeId?: string,
  localOnlyFields: string[] = []
): any[] {
  const serverIds = new Set(serverItems.map((s) => s.id).filter(Boolean));
  const serverIntervalNos = new Set(
    serverItems.map((s) => s.intervalNo).filter((n) => n != null)
  );

  const merged = serverItems.map((serverItem) => {
    const local = localItems.find((l) => l.id != null && l.id === serverItem.id);
    if (local && isLocallyPending(local, queue, boreholeId)) {
      // Still-queued local changes win over the server copy
      return { ...serverItem, ...local };
    }
    if (local && localOnlyFields.length > 0) {
      const keep: any = {};
      for (const k of localOnlyFields) {
        if (
          (serverItem[k] === undefined || serverItem[k] === null) &&
          local[k] !== undefined &&
          local[k] !== null
        ) {
          keep[k] = local[k];
        }
      }
      return { ...serverItem, ...keep };
    }
    return serverItem;
  });

  for (const local of localItems) {
    const existsOnServer =
      (local.id != null && serverIds.has(local.id)) ||
      (local.intervalNo != null && serverIntervalNos.has(local.intervalNo));
    if (!existsOnServer && isLocallyPending(local, queue, boreholeId)) {
      merged.push(local);
    }
  }
  return merged;
}

/**
 * Interval merge keyed by intervalNo. Client ids (`interval-<bh>-<n>`) and
 * server UUIDs for the same SPT used to miss each other, so a later pull
 * could keep a shallower server row and throw away a deeper local one.
 */
function mergeIntervals(
  serverItems: any[],
  localItems: any[],
  queue: SyncOperation[],
  boreholeId: string
): any[] {
  const byNo = new Map<number, any>();

  for (const iv of serverItems) {
    const no = Number(iv?.intervalNo);
    if (!Number.isInteger(no)) continue;
    byNo.set(no, iv);
  }

  for (const iv of localItems) {
    const no = Number(iv?.intervalNo);
    if (!Number.isInteger(no)) continue;
    const existing = byNo.get(no);
    if (!existing) {
      byNo.set(no, iv);
      continue;
    }
    if (isLocallyPending(iv, queue, boreholeId)) {
      byNo.set(no, { ...existing, ...iv });
      continue;
    }
    const localTo = Number(iv?.toDepth);
    const serverTo = Number(existing?.toDepth);
    if (Number.isFinite(localTo) && (!Number.isFinite(serverTo) || localTo > serverTo)) {
      byNo.set(no, iv);
    }
  }

  return [...byNo.values()].sort(
    (a, b) => (Number(a.intervalNo) || 0) - (Number(b.intervalNo) || 0)
  );
}

// Dedupes overlapping sync triggers (15s interval, foreground event, manual
// screen submits): concurrent callers share the same in-flight round instead
// of racing each other's sockets and queue writes.
let syncInFlight: Promise<SyncResult> | null = null;

// Photo uploads have their own in-flight dedupe, separate from the full
// round: a fresh capture triggers an immediate upload without waiting for
// (or double-uploading against) a round that is mid-pull.
let photoSyncInFlight: Promise<{ uploaded: number; pending: number }> | null =
  null;

// Fired after every sync round and photo upload batch so screens (e.g. the
// photo gallery) can refresh without polling or re-navigation.
const syncListeners = new Set<() => void>();
function notifySyncListeners(): void {
  syncListeners.forEach((cb) => {
    try {
      cb();
    } catch {
      // one bad listener must not break the others
    }
  });
}

/**
 * Uploads every queued photo whose interval already has a SERVER id in the
 * local cache. Photos whose interval hasn't reached the server yet simply
 * stay queued — the full sync round retries them after its pull.
 *
 * networkProven: pass true when the caller has just completed successful
 * API calls, so a THROWN upload (not an HTTP reject) can be attributed to
 * the file rather than the network — e.g. Android purged the cached
 * capture. Such hard failures count toward parking (see markPhotoFailure);
 * plain offline failures never do.
 */
async function uploadQueuedPhotos(networkProven = false): Promise<{
  uploaded: number;
  pending: number;
}> {
  if (photoSyncInFlight) return photoSyncInFlight;
  const run = (async () => {
    let uploaded = 0;
    const photoQueue = await media.getUploadablePhotos();
    if (photoQueue.length > 0) {
      let token = await storage.getToken();
      if (token) {
        for (const photo of photoQueue) {
          try {
            const intervals = await storage.getIntervals(photo.boreholeId);
            const serverInterval = intervals.find(
              (iv: any) =>
                iv.intervalNo === photo.intervalNo &&
                typeof iv.id === 'string' &&
                iv.id.length > 0 &&
                !iv.id.startsWith('interval-')
            );
            if (!serverInterval) continue; // not on server yet — keep queued
            let status = await uploadQueuedPhoto(photo, serverInterval.id, token);
            // Access token expired — the raw fetch here bypasses the axios
            // refresh interceptor, so refresh once and retry.
            if (status === 401) {
              const fresh = await refreshSessionToken();
              if (!fresh) break; // session dead/offline — stop, keep queued
              token = fresh;
              status = await uploadQueuedPhoto(photo, serverInterval.id, token);
            }
            if (status >= 200 && status < 300) {
              await media.removePhoto(photo.id);
              uploaded++;
            } else if (status >= 400 && status < 500) {
              // Deterministic server reject (413 too large, 404 interval
              // gone, 400 validation) — retrying identical bytes cannot
              // succeed. Count it; parks after 3.
              await media.markPhotoFailure(photo.id, `HTTP ${status}`);
              console.warn(
                `[Sync] Photo upload rejected (HTTP ${status}) for ${photo.fileName}`
              );
            } else {
              // 5xx — server-side hiccup, retry next round without penalty.
              console.warn(
                `[Sync] Photo upload failed (HTTP ${status}) for ${photo.fileName}; kept in queue`
              );
            }
          } catch (photoErr) {
            if (networkProven) {
              // The network is demonstrably up (push/pull just succeeded),
              // so a throw here points at the file itself.
              await media.markPhotoFailure(
                photo.id,
                photoErr instanceof Error ? photoErr.message : 'Upload error'
              );
            }
            console.warn(
              `[Sync] Photo upload failed for ${photo.fileName}:`,
              photoErr
            );
          }
        }
      }
    }
    const pending = (await media.getUploadablePhotos()).length;
    return { uploaded, pending };
  })().finally(() => {
    photoSyncInFlight = null;
  });
  photoSyncInFlight = run;
  return run;
}

export const syncManager = {
  /**
   * Main sync function: pushes local edits to server, and pulls down fresh data.
   * Only operations the server reports as SYNCED are removed from the local
   * queue; FAILED operations stay queued with their error attached, so one
   * bad operation never blocks (or destroys) the rest.
   */
  async syncWithServer(): Promise<SyncResult> {
    if (syncInFlight) return syncInFlight;
    const round = this.runSyncRound().finally(() => {
      syncInFlight = null;
    });
    syncInFlight = round;
    return round;
  },

  /** One full push+pull+photos round. Call syncWithServer(), which dedupes. */
  async runSyncRound(): Promise<SyncResult> {
    try {
      // 0. Upload queued photos FIRST. The pull below can take a long time
      // on field networks (one request per borehole), and photos captured on
      // already-synced intervals — the common case — must not wait behind it.
      let photosUploaded = (await uploadQueuedPhotos()).uploaded;

      // 1. Push the local queue
      const queue = await storage.getSyncQueue();
      let processedCount = 0;
      let failedCount = 0;
      let pushError: string | undefined;

      if (queue.length > 0) {
        // Strip local-only bookkeeping fields before sending
        const opsToSend = queue.map(({ status, lastError, ...op }) => op);
        const result = await api.syncOperations(opsToSend);
        const results: any[] | null = Array.isArray(result?.results) ? result.results : null;

        if (results) {
          // Per-operation results: clear ONLY the ops the server confirmed
          const syncedIds = results
            .filter((r) => r.status === 'SYNCED')
            .map((r) => r.operationId);
          processedCount = syncedIds.length;
          await storage.removeSyncOperations(syncedIds);

          const failedById = new Map<string, string>(
            results
              .filter((r) => r.status === 'FAILED')
              .map((r) => [r.operationId, r.error || 'Sync failed on server'])
          );
          if (failedById.size > 0) {
            failedCount = failedById.size;
            await storage.mutateSyncQueue((remaining) =>
              remaining.map((op) =>
                failedById.has(op.operationId)
                  ? { ...op, status: 'FAILED' as const, lastError: failedById.get(op.operationId) }
                  : op
              )
            );
            pushError = `${failedCount} operation(s) failed to sync and were kept in the queue`;
          }
        } else if (result?.success) {
          // Fallback for a response without per-op results. Remove ONLY the
          // ops that were actually sent — clearing the whole queue here
          // would also destroy operations queued while the push was in
          // flight.
          processedCount = result.processedCount || queue.length;
          await storage.removeSyncOperations(opsToSend.map((op) => op.operationId));
        } else {
          failedCount = queue.length;
          pushError = 'Failed to push sync queue';
        }
      }

      // 2. Pull fresh data and MERGE it with the local cache.
      // Anything still in the queue (failed or unsent) must survive the pull.
      const pendingQueue = await storage.getSyncQueue();

      const myProjectMemberships = await api.getMyProjects();
      if (Array.isArray(myProjectMemberships)) {
        // Flatten the nested project object from the project member relationship
        const projects = myProjectMemberships
          .filter((m: any) => m.project != null)
          .map((m: any) => ({
            ...m.project,
            assigned: true,
          }));

        await storage.saveProjects(projects);

        // Storage keys are per-project/per-borehole, so the pull can fan
        // out — but with BOUNDED concurrency: sequential awaits took
        // minutes, while unbounded Promise.all starved every request past
        // the 60s timeout on 2G (thundering herd).
        await mapWithConcurrency(projects, 2, async (project) => {
          try {
            const serverBoreholes = await api.getProjectBoreholes(project.id);
            if (Array.isArray(serverBoreholes)) {
              const localBoreholes = await storage.getBoreholes(project.id);
              const mergedBoreholes = mergeServerWithLocal(
                serverBoreholes,
                localBoreholes,
                pendingQueue,
                undefined,
                BOREHOLE_LOCAL_ONLY_FIELDS
              );
              await storage.saveBoreholes(project.id, mergedBoreholes);

              // Refresh intervals for boreholes that exist on the server
              await mapWithConcurrency(serverBoreholes, 3, async (bh) => {
                try {
                  const serverIntervals = await api.getBoreholeIntervals(bh.id);
                  if (Array.isArray(serverIntervals)) {
                    const localIntervals = await storage.getIntervals(bh.id);
                    const mergedIntervals = mergeIntervals(
                      serverIntervals,
                      localIntervals,
                      pendingQueue,
                      bh.id
                    );
                    await storage.saveIntervals(bh.id, mergedIntervals);
                  }
                } catch (bhErr) {
                  console.warn(`Could not sync intervals for BH ${bh.id}:`, bhErr);
                }
              });
            }
          } catch (projErr) {
            console.warn(`Could not sync boreholes for project ${project.id}:`, projErr);
          }
        });
      }

      // 3. Retry photos whose interval only just got its SERVER id (UUID)
      // from the pull above — e.g. photos taken on an interval created
      // offline in this same session. Everything else already uploaded in
      // step 0. networkProven: the pull just succeeded, so a thrown upload
      // now indicates a bad file, not a bad network.
      let photosPending = (await media.getUploadablePhotos()).length;
      if (photosPending > 0) {
        const retry = await uploadQueuedPhotos(true);
        photosUploaded += retry.uploaded;
        photosPending = retry.pending;
      }

      return {
        success: failedCount === 0,
        processedCount,
        error: pushError,
        photosUploaded,
        photosPending,
      };
    } catch (error: any) {
      console.error('Sync failed:', error);
      // A 401 that survived the refresh interceptor means the session is
      // truly gone — say so instead of the cryptic axios message.
      const sessionDead = error?.response?.status === 401;
      return {
        success: false,
        processedCount: 0,
        error: sessionDead
          ? 'Session expired — please log out and log in again'
          : error.message || 'Network error during synchronization',
      };
    } finally {
      notifySyncListeners();
    }
  },

  /**
   * Fast path: upload queued photos right now, without a full push+pull.
   * Used when a photo is captured on an interval the server already knows.
   */
  async syncPhotos(): Promise<{ uploaded: number; pending: number }> {
    const result = await uploadQueuedPhotos();
    if (result.uploaded > 0) notifySyncListeners();
    return result;
  },

  /**
   * Subscribes to sync completion (full rounds and photo batches).
   * Returns an unsubscribe function.
   */
  onSyncComplete(cb: () => void): () => void {
    syncListeners.add(cb);
    return () => {
      syncListeners.delete(cb);
    };
  },

  /**
   * Appends an operation to the sync queue for future sync
   */
  async queueOperation(
    entityType: 'BORING' | 'SPT_RECORD' | 'SAMPLE' | 'PHOTO' | 'WATER_LEVEL' | 'SESSION',
    entityId: string,
    operationType: 'CREATE' | 'UPDATE' | 'DELETE',
    payload: any,
    boringSessionId?: string
  ): Promise<void> {
    const deviceId = await storage.getDeviceId();
    const operationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await storage.addToSyncQueue({
      deviceId,
      operationId,
      entityType,
      entityId,
      operationType,
      payloadJson: payload,
      boringSessionId,
      status: 'PENDING',
    });

    // Trigger immediate background sync
    this.syncWithServer().catch((err) => {
      console.log('[Sync] Immediate background sync failed/offline:', err);
    });
  }
};

// A freshly captured photo starts uploading immediately (fast path — no
// full push+pull). Registered via callback to avoid a media↔sync import
// cycle at module init.
setOnPhotoQueued(() => {
  syncManager.syncPhotos().catch((err) => {
    console.log('[Sync] Immediate photo upload failed/offline:', err);
  });
});
