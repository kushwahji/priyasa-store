const BASE = (typeof window === 'undefined' ? process.env.PRIYASA_API_BASE_URL : process.env.NEXT_PUBLIC_PRIYASA_API_BASE_URL || process.env.PRIYASA_API_BASE_URL || '').replace(/\/$/, '');

const TOKEN_KEY = 'priyasa_access_token';
let memoryToken: string | null | undefined;

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage; } catch { return null; }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  if (memoryToken !== undefined) return memoryToken;
  const value = storage()?.getItem(TOKEN_KEY) || null;
  memoryToken = value;
  return value;
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  memoryToken = token;
  try { storage()?.setItem(TOKEN_KEY, token); } catch { /* keep in-memory session */ }
}

export function clearAccessToken(): void {
  if (typeof window === 'undefined') return;
  memoryToken = null;
  try { storage()?.removeItem(TOKEN_KEY); } catch { /* already cleared */ }
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.name === 'PriyasaUnauthorizedError';
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === TOKEN_KEY) memoryToken = event.newValue;
  });
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!BASE) throw new Error('PRIYASA_API_BASE_URL is not configured');

  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const method = (init.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !headers.has('Idempotency-Key')) {
    headers.set('Idempotency-Key', typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers, cache: 'no-store' });
  const body = await res.json().catch(() => null);

  // A single endpoint must never silently destroy the customer's session.
  // Protected pages decide whether a 401 means the session is genuinely invalid.
  if (res.status === 401) {
    const error = new Error(body?.message || 'Your session has expired. Please sign in again.') as Error & { status?: number };
    error.name = 'PriyasaUnauthorizedError';
    error.status = 401;
    throw error;
  }

  if (!res.ok) throw new Error(body?.message || `PRIYASA_API_${res.status}`);
  return body as T;
}
