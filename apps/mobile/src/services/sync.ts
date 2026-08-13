import { api } from './api';
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
 * body natively without transformRequest interference.
 */
async function uploadQueuedPhoto(
  photo: QueuedPhoto,
  serverIntervalId: string,
  token: string
): Promise<boolean> {
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

  const response = await fetch(`${API_BASE_URL}/intervals/${serverIntervalId}/media`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });
  return response.ok;
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

/**
 * Merge server data with the local cache:
 * - server wins for records that have no pending local edits;
 * - local wins for records that still have a queued (unsynced) operation;
 * - local-only records (e.g. created offline) are kept as long as they have
 *   a pending queue operation.
 */
function mergeServerWithLocal(
  serverItems: any[],
  localItems: any[],
  queue: SyncOperation[],
  boreholeId?: string
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
 */
async function uploadQueuedPhotos(): Promise<{
  uploaded: number;
  pending: number;
}> {
  if (photoSyncInFlight) return photoSyncInFlight;
  const run = (async () => {
    let uploaded = 0;
    const photoQueue = await media.getPhotoQueue();
    if (photoQueue.length > 0) {
      const token = await storage.getToken();
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
            const ok = await uploadQueuedPhoto(photo, serverInterval.id, token);
            if (ok) {
              await media.removePhoto(photo.id);
              uploaded++;
            } else {
              console.warn(
                `[Sync] Photo upload rejected for ${photo.fileName}; kept in queue`
              );
            }
          } catch (photoErr) {
            // Network/IO failure — photo stays queued for the next sync
            console.warn(
              `[Sync] Photo upload failed for ${photo.fileName}:`,
              photoErr
            );
          }
        }
      }
    }
    const pending = (await media.getPhotoQueue()).length;
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
            const remaining = await storage.getSyncQueue();
            await storage.saveSyncQueue(
              remaining.map((op) =>
                failedById.has(op.operationId)
                  ? { ...op, status: 'FAILED' as const, lastError: failedById.get(op.operationId) }
                  : op
              )
            );
            pushError = `${failedCount} operation(s) failed to sync and were kept in the queue`;
          }
        } else if (result?.success) {
          // Fallback for a response without per-op results
          processedCount = result.processedCount || queue.length;
          await storage.clearSyncQueue();
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

        // Storage keys are per-project/per-borehole, so the whole pull can
        // fan out in parallel — sequential awaits here used to take minutes
        // on field networks and held up everything behind the sync.
        await Promise.all(
          projects.map(async (project) => {
            try {
              const serverBoreholes = await api.getProjectBoreholes(project.id);
              if (Array.isArray(serverBoreholes)) {
                const localBoreholes = await storage.getBoreholes(project.id);
                const mergedBoreholes = mergeServerWithLocal(
                  serverBoreholes,
                  localBoreholes,
                  pendingQueue
                );
                await storage.saveBoreholes(project.id, mergedBoreholes);

                // Refresh intervals for boreholes that exist on the server
                await Promise.all(
                  serverBoreholes.map(async (bh) => {
                    try {
                      const serverIntervals = await api.getBoreholeIntervals(bh.id);
                      if (Array.isArray(serverIntervals)) {
                        const localIntervals = await storage.getIntervals(bh.id);
                        const mergedIntervals = mergeServerWithLocal(
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
                  })
                );
              }
            } catch (projErr) {
              console.warn(`Could not sync boreholes for project ${project.id}:`, projErr);
            }
          })
        );
      }

      // 3. Retry photos whose interval only just got its SERVER id (UUID)
      // from the pull above — e.g. photos taken on an interval created
      // offline in this same session. Everything else already uploaded in
      // step 0.
      let photosPending = (await media.getPhotoQueue()).length;
      if (photosPending > 0) {
        const retry = await uploadQueuedPhotos();
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
      return {
        success: false,
        processedCount: 0,
        error: error.message || 'Network error during synchronization',
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
    entityType: 'BORING' | 'SPT_RECORD' | 'SAMPLE' | 'PHOTO' | 'WATER_LEVEL',
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
