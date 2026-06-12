import axios from 'axios';
import { storage } from './storage';

// Base URL configuration
// Android emulator uses 10.0.2.2 to connect to host's localhost.
// iOS simulator uses localhost.
const BASE_URL = 'http://10.0.2.2:3000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to inject JWT token
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

export const api = {
  // --- Auth ---
  async login(mobile: string, pin: string) {
    // Note: The NestJS API login expects identifier (email or mobile) and password (or pin)
    const response = await apiClient.post('/auth/login', {
      identifier: mobile,
      password: pin,
    });
    return response.data; // Expecting { token, user, refreshToken }
  },

  async getProfile() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // --- Projects & Boreholes ---
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

  // --- Synchronization ---
  async syncOperations(operations: any[]) {
    const response = await apiClient.post('/sync/operations', {
      operations,
    });
    return response.data;
  },

  // --- Reviews & Queries ---
  async getConflicts(deviceId: string) {
    const response = await apiClient.get(`/sync/conflicts/${deviceId}`);
    return response.data;
  },
};
