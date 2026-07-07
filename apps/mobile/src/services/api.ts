import axios from 'axios';
import { storage } from './storage';
import { API_BASE_URL } from '../config';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to inject JWT access token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Single-flight token refresh: if several requests hit 401 simultaneously,
// only one POST /auth/refresh is performed.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await storage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token stored');
  }
  // Use a bare axios call so this request bypasses the interceptors below.
  const response = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
  );
  const accessToken = response.data?.accessToken;
  const newRefreshToken = response.data?.refreshToken;
  if (!accessToken || !newRefreshToken) {
    throw new Error('Invalid refresh response from server');
  }
  // Tokens rotate on every refresh — store the new pair.
  await storage.saveTokens(accessToken, newRefreshToken);
  return accessToken;
}

// Response interceptor: on 401, try one token refresh, then retry the
// original request once. On refresh failure, clear the stored session
// and rethrow so the UI can return to Login.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url: string = original?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh');

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const newAccessToken = await refreshPromise;
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(original);
      } catch (refreshError) {
        // Refresh failed: session is no longer valid.
        await storage.clearTokens();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // --- Auth ---
  /**
   * identifier = email OR employee code (e.g. GL-W-0001)
   * password   = account password OR worker PIN
   * Stores both tokens on success and returns the response body.
   */
  async login(identifier: string, password: string) {
    const response = await apiClient.post('/auth/login', {
      identifier,
      password,
    });
    const { accessToken, refreshToken } = response.data || {};
    if (accessToken && refreshToken) {
      await storage.saveTokens(accessToken, refreshToken);
    }
    return response.data; // { accessToken, refreshToken }
  },

  async createPassword(mobile: string, password: any) {
    const response = await apiClient.post('/auth/create-password', {
      mobile,
      password,
    });
    return response.data;
  },

  async logout() {
    const refreshToken = await storage.getRefreshToken();
    if (refreshToken) {
      await apiClient.post('/auth/logout', { refreshToken });
    }
  },

  async getProfile() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // --- Projects & Boreholes ---
  /**
   * Exact project-code lookup (e.g. GL-PRJ-2025-0047). Always answers:
   *   { found: false }
   *   { found: true, hasAccess: boolean,
   *     project: { id, projectCode, name, status, state, district } }
   */
  async searchProject(code: string) {
    const response = await apiClient.get('/projects/search', {
      params: { code },
    });
    return response.data;
  },

  async getMyProjects() {
    const response = await apiClient.get('/projects/my-projects');
    return response.data;
  },

  async getProjectBoreholes(projectId: string) {
    const response = await apiClient.get(`/projects/${projectId}/boreholes`);
    return response.data;
  },

  async getBoreholeDetails(boreholeId: string) {
    const response = await apiClient.get(`/boreholes/${boreholeId}`);
    return response.data;
  },

  async getBoreholeIntervals(boreholeId: string) {
    const response = await apiClient.get(`/boreholes/${boreholeId}/intervals`);
    return response.data;
  },

  // --- Boring Sessions ---
  async startBoringSession(boreholeId: string, startDepth: number) {
    const response = await apiClient.post(`/boreholes/${boreholeId}/sessions`, {
      startDepth,
    });
    return response.data;
  },

  async endBoringSession(
    sessionId: string,
    body: { endDepth: number; status: string; terminationReason?: string }
  ) {
    const response = await apiClient.patch(`/sessions/${sessionId}/end`, body);
    return response.data;
  },

  async getBoreholeSessions(boreholeId: string) {
    const response = await apiClient.get(`/boreholes/${boreholeId}/sessions`);
    return response.data;
  },

  // --- Engineer Query Threads ---
  /**
   * Worker query inbox. Returns an array of review threads:
   *   { id, boreholeId, raisedByUserId, assignedToUserId, threadType,
   *     status: 'OPEN' | 'CLOSED', priority, createdAt, updatedAt,
   *     borehole: { id, boreholeCode, name, projectId },
   *     raisedBy: { id, firstName, lastName },
   *     messages: [{ id, threadId, senderId, message, attachments?,
   *                  createdAt, sender: { id, firstName, lastName } }] }
   * Messages are ordered oldest-first.
   */
  async getMyThreads() {
    const response = await apiClient.get('/threads/assigned-to-me');
    return response.data;
  },

  /**
   * Reply to a query thread (allowed for the assigned field worker).
   * Returns the created message incl. sender { id, firstName, lastName }.
   */
  async replyToThread(threadId: string, message: string) {
    const response = await apiClient.post(`/threads/${threadId}/messages`, {
      message,
    });
    return response.data;
  },

  // --- Synchronization ---
  async syncOperations(operations: any[]) {
    const response = await apiClient.post('/sync/operations', {
      operations,
    });
    // { success, processedCount, results: [{ operationId, status, error? }] }
    return response.data;
  },

  // --- Media Upload ---
  async uploadMedia(intervalId: string, base64Data: string, filename: string) {
    const formData = new FormData();
    formData.append('file', {
      uri: `data:image/jpeg;base64,${base64Data}`,
      name: filename,
      type: 'image/jpeg',
    } as any);

    const token = await storage.getToken();
    const response = await apiClient.post(`/intervals/${intervalId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data;
  },
};
