const API_BASE = process.env.API_URL || 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new ApiError(res.status, `API GET ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new ApiError(res.status, `API POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPatch<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new ApiError(res.status, `API PATCH ${path} failed: ${res.status}`);
  }
  return res.json();
}
