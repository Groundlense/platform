const API_BASE = process.env.API_URL || 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Extract the real error message from a NestJS error body (string or string[]). */
async function toApiError(res: Response, method: string, path: string): Promise<ApiError> {
  let message = `API ${method} ${path} failed: ${res.status}`;
  try {
    const body = await res.json();
    const m = body?.message;
    if (Array.isArray(m) && m.length) message = m.join(', ');
    else if (typeof m === 'string' && m) message = m;
  } catch {
    // Non-JSON error body — keep the generic message
  }
  return new ApiError(res.status, message);
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
    throw await toApiError(res, 'GET', path);
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
    throw await toApiError(res, 'POST', path);
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
    throw await toApiError(res, 'PATCH', path);
  }
  return res.json();
}

export async function apiDelete<T>(path: string, token?: string): Promise<T> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    throw await toApiError(res, 'DELETE', path);
  }
  return res.json();
}

