import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: '@auth_token',
  REFRESH_TOKEN: '@refresh_token',
  DEVICE_ID: '@device_id',
  USER: '@current_user',
  PROJECTS: '@projects',
  BOREHOLES: (projectId: string) => `@boreholes:${projectId}`,
  INTERVALS: (boreholeId: string) => `@intervals:${boreholeId}`,
  SAMPLES: (boreholeId: string) => `@samples:${boreholeId}`,
  WATER_TABLE: (boreholeId: string) => `@water_table:${boreholeId}`,
  SESSIONS: (boreholeId: string) => `@sessions:${boreholeId}`,
  SYNC_QUEUE: '@sync_queue',
};

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

  // --- Projects ---
  async saveProjects(projects: any[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects));
  },

  async getProjects(): Promise<any[]> {
    const data = await AsyncStorage.getItem(KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
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
