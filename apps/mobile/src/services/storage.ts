import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: '@auth_token',
  REFRESH_TOKEN: '@refresh_token',
  DEVICE_ID: '@device_id',
  USER: '@current_user',
  OFFLINE_LOGIN: '@offline_login',
  PROJECTS: '@projects',
  BOREHOLES: (projectId: string) => `@boreholes:${projectId}`,
  INTERVALS: (boreholeId: string) => `@intervals:${boreholeId}`,
  SAMPLES: (boreholeId: string) => `@samples:${boreholeId}`,
  WATER_TABLE: (boreholeId: string) => `@water_table:${boreholeId}`,
  SESSIONS: (boreholeId: string) => `@sessions:${boreholeId}`,
  SPT_INTERVAL_OVERRIDE: (boreholeId: string) => `@spt_interval:${boreholeId}`,
  SYNC_QUEUE: '@sync_queue',
  SEEN_ASSIGNMENTS: '@seen_assignments',
  CACHE_VERSION: '@cache_version',
};

/**
 * Bump this whenever historical builds may have written invalid/mock data
 * into AsyncStorage. On startup, a version mismatch wipes every cached
 * domain record (older builds seeded fake projects/boreholes into storage
 * — that pollution survives reinstalls on the same device/emulator).
 * Version 2: post no-dummy-data cleanup.
 */
const CACHE_VERSION = '2';

// Everything except auth/session/device identity. Includes the queues:
// legacy queues can hold operations referencing fake records or belong to
// a different account.
function isDomainKey(key: string): boolean {
  return (
    key === KEYS.PROJECTS ||
    key === KEYS.SYNC_QUEUE ||
    key === KEYS.SEEN_ASSIGNMENTS ||
    key === '@photo_queue' ||
    key.startsWith('@boreholes:') ||
    key.startsWith('@intervals:') ||
    key.startsWith('@samples:') ||
    key.startsWith('@water_table:') ||
    key.startsWith('@sessions:') ||
    key.startsWith('@spt_interval:')
  );
}

export interface SyncOperation {
  deviceId: string;
  operationId: string;
  entityType: 'BORING' | 'SPT_RECORD' | 'SAMPLE' | 'PHOTO' | 'WATER_LEVEL';
  entityId: string;
  operationType: 'CREATE' | 'UPDATE' | 'DELETE';
  payloadJson: any;
  boringSessionId?: string;
  // Additive, local-only bookkeeping (stripped before sending to server)
  status?: 'PENDING' | 'FAILED';
  lastError?: string;
}

/**
 * Pure-JS UUID v4 (no native crypto dependency).
 */
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const storage = {
  // --- Auth & User ---
  async saveToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.TOKEN, token);
  },

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.TOKEN);
  },

  async clearToken(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.TOKEN);
  },

  async saveRefreshToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.REFRESH_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
  },

  /** Stores the access + refresh token pair returned by login/refresh. */
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(KEYS.TOKEN, accessToken),
      AsyncStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  /** Removes both tokens (used when the refresh flow fails / on logout). */
  async clearTokens(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(KEYS.TOKEN),
      AsyncStorage.removeItem(KEYS.REFRESH_TOKEN),
    ]);
  },

  /**
   * Returns a stable, per-install device identifier.
   * Generated once (pure-JS UUID v4) and persisted in AsyncStorage.
   */
  async getDeviceId(): Promise<string> {
    let deviceId = await AsyncStorage.getItem(KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = uuidv4();
      await AsyncStorage.setItem(KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
  },

  async saveUser(user: any): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  async getUser(): Promise<any | null> {
    const data = await AsyncStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  async clearUser(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.USER);
  },

  // --- Offline login ---
  /**
   * Written after every successful ONLINE login: all identifiers the
   * worker may type (employee code, email, mobile) plus a SHA-256 hash
   * of the PIN/password, so offline logins can be verified without the
   * server.
   */
  async saveOfflineLogin(record: {
    userId: string;
    identifiers: string[];
    pinHash: string;
  }): Promise<void> {
    await AsyncStorage.setItem(KEYS.OFFLINE_LOGIN, JSON.stringify(record));
  },

  async getOfflineLogin(): Promise<{
    userId: string;
    identifiers: string[];
    pinHash: string;
  } | null> {
    const data = await AsyncStorage.getItem(KEYS.OFFLINE_LOGIN);
    return data ? JSON.parse(data) : null;
  },

  // --- Projects ---
  async saveProjects(projects: any[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects));
  },

  async getProjects(): Promise<any[]> {
    const data = await AsyncStorage.getItem(KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  },

  /**
   * SPT test interval for a project, in meters (set at project setup and
   * locked once boring starts). Falls back to the IS 1892 default of
   * 1.5 m for cached projects that predate the setting.
   */
  async getProjectSptInterval(projectId: string): Promise<number> {
    const projects = await this.getProjects();
    const project = projects.find((p: any) => p?.id === projectId);
    const value = Number(project?.sptIntervalM);
    return Number.isFinite(value) && value > 0 ? value : 1.5;
  },

  /**
   * Per-borehole SPT interval override, entered by the worker when the
   * boring continues after a rock-coring detour (the project spacing may
   * no longer apply below the rock band).
   */
  async setBoreholeSptInterval(boreholeId: string, meters: number): Promise<void> {
    await AsyncStorage.setItem(KEYS.SPT_INTERVAL_OVERRIDE(boreholeId), String(meters));
  },

  /** Effective SPT interval for a borehole: override first, else project setting. */
  async getSptInterval(projectId: string, boreholeId: string): Promise<number> {
    const raw = await AsyncStorage.getItem(KEYS.SPT_INTERVAL_OVERRIDE(boreholeId));
    const override = Number(raw);
    if (Number.isFinite(override) && override > 0) return override;
    return this.getProjectSptInterval(projectId);
  },

  // --- Boreholes ---
  async saveBoreholes(projectId: string, boreholes: any[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.BOREHOLES(projectId), JSON.stringify(boreholes));
  },

  async getBoreholes(projectId: string): Promise<any[]> {
    const data = await AsyncStorage.getItem(KEYS.BOREHOLES(projectId));
    return data ? JSON.parse(data) : [];
  },

  // --- Borehole Intervals ---
  async saveIntervals(boreholeId: string, intervals: any[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.INTERVALS(boreholeId), JSON.stringify(intervals));
  },

  async getIntervals(boreholeId: string): Promise<any[]> {
    const data = await AsyncStorage.getItem(KEYS.INTERVALS(boreholeId));
    return data ? JSON.parse(data) : [];
  },

  // --- Samples ---
  async saveSamples(boreholeId: string, samples: any[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.SAMPLES(boreholeId), JSON.stringify(samples));
  },

  async getSamples(boreholeId: string): Promise<any[]> {
    const data = await AsyncStorage.getItem(KEYS.SAMPLES(boreholeId));
    return data ? JSON.parse(data) : [];
  },

  // --- Water Table ---
  async saveWaterTable(boreholeId: string, observations: any[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.WATER_TABLE(boreholeId), JSON.stringify(observations));
  },

  async getWaterTable(boreholeId: string): Promise<any[]> {
    const data = await AsyncStorage.getItem(KEYS.WATER_TABLE(boreholeId));
    return data ? JSON.parse(data) : [];
  },

  // --- Boring Sessions ---
  async saveBoringSessions(boreholeId: string, sessions: any[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.SESSIONS(boreholeId), JSON.stringify(sessions));
  },

  async getBoringSessions(boreholeId: string): Promise<any[]> {
    const data = await AsyncStorage.getItem(KEYS.SESSIONS(boreholeId));
    return data ? JSON.parse(data) : [];
  },

  // --- Sync Queue ---
  async getSyncQueue(): Promise<SyncOperation[]> {
    const data = await AsyncStorage.getItem(KEYS.SYNC_QUEUE);
    return data ? JSON.parse(data) : [];
  },

  async saveSyncQueue(queue: SyncOperation[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
  },

  async addToSyncQueue(op: SyncOperation): Promise<void> {
    const queue = await this.getSyncQueue();
    queue.push(op);
    await this.saveSyncQueue(queue);
  },

  async clearSyncQueue(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.SYNC_QUEUE);
  },

  // --- Assigned-borehole notices ---
  /** Borehole ids the worker has already been notified about. */
  async getSeenAssignments(): Promise<string[]> {
    const data = await AsyncStorage.getItem(KEYS.SEEN_ASSIGNMENTS);
    return data ? JSON.parse(data) : [];
  },

  async addSeenAssignments(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const seen = await this.getSeenAssignments();
    const merged = Array.from(new Set([...seen, ...ids]));
    await AsyncStorage.setItem(KEYS.SEEN_ASSIGNMENTS, JSON.stringify(merged));
  },

  // --- Cache hygiene: main DB is the single source of truth ---

  /**
   * Wipes every cached domain record (projects, boreholes, intervals,
   * samples, water table, sessions, queues, seen-assignment notices).
   * Auth tokens, the current user and the device id survive. The next
   * successful sync repopulates everything from the server.
   */
  async clearDomainData(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    await Promise.all(
      keys.filter(isDomainKey).map((k) => AsyncStorage.removeItem(k)),
    );
  },

  /**
   * One-time purge when the cache schema/trust level changed (e.g. old
   * builds wrote mock records into storage). Returns true if a wipe ran.
   */
  async ensureCacheVersion(): Promise<boolean> {
    const stored = await AsyncStorage.getItem(KEYS.CACHE_VERSION);
    if (stored === CACHE_VERSION) return false;
    await this.clearDomainData();
    await AsyncStorage.setItem(KEYS.CACHE_VERSION, CACHE_VERSION);
    return true;
  },

  /**
   * Account isolation: when a different user logs in on this device, the
   * previous account's cached data and queues must never leak into (or be
   * attributed to) the new session. Returns true if a wipe ran.
   */
  async ensureCacheOwner(newUserId: string): Promise<boolean> {
    const previous = await this.getUser();
    if (!previous?.id || previous.id === newUserId) return false;
    await this.clearDomainData();
    return true;
  },

  /**
   * Removes only the operations whose operationId is in the given list
   * (used after a sync round to clear per-op SYNCED results while
   * keeping FAILED / still-pending operations queued).
   */
  async removeSyncOperations(operationIds: string[]): Promise<void> {
    if (operationIds.length === 0) return;
    const ids = new Set(operationIds);
    const queue = await this.getSyncQueue();
    await this.saveSyncQueue(queue.filter((op) => !ids.has(op.operationId)));
  },
};
