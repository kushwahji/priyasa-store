import { NextRequest, NextResponse } from 'next/server';

function upstreamBase() {
  const configured = (process.env.PRIYASA_API_BASE_URL || process.env.PRIYASA_API_URL || 'https://api.priyasa.com/api/v1').replace(/\/+$/, '');
  return /\/api\/v\d+$/i.test(configured) ? configured : `${configured}/api/v1`;
}
const SESSION_COOKIE = 'priyasa_session';
const UPSTREAM_TIMEOUT_MS = 20_000;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUBLIC_ROUTES = new Set(['auth/send-otp', 'auth/verify-otp', 'auth/resend-otp', 'auth/logout']);
function isAllowedRoute(route: string) { return PUBLIC_ROUTES.has(route) || route === 'device/token' || route.startsWith('storefront/'); }
function extractToken(value: unknown): string | null { if (!value || typeof value !== 'object') return null; const record = value as Record<string, unknown>; const direct = [record.access_token, record.accessToken, record.token].find((v) => typeof v === 'string' && v.length > 0); if (direct) return direct as string; if (record.data && typeof record.data === 'object') return extractToken(record.data); return null; }
function stripToken(value: unknown): unknown { if (!value || typeof value !== 'object') return value; if (Array.isArray(value)) return value.map(stripToken); const record = { ...(value as Record<string, unknown>) }; delete record.access_token; delete record.accessToken; delete record.token; if (record.data && typeof record.data === 'object') record.data = stripToken(record.data); return record; }
function normaliseOrigin(value: string) { try { const url = new URL(value); const host = url.hostname.toLowerCase().replace(/^www\./, ''); return `${url.protocol}//${host}${url.port ? `:${url.port}` : ''}`; } catch { return ''; } }
function allowedOrigin(request: NextRequest) { const origin = request.headers.get('origin'); if (!origin) return true; const incoming = normaliseOrigin(origin); const sameOrigin = normaliseOrigin(request.nextUrl.origin); const configured = [process.env.NEXT_PUBLIC_STORE_URL, process.env.PRIYASA_STORE_URL].filter(Boolean).map((value) => normaliseOrigin(value as string)).filter(Boolean); return incoming === sameOrigin || configured.includes(incoming); }
function sessionCookie(response: NextResponse, value: string, maxAge: number) { response.cookies.set(SESSION_COOKIE, value, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge }); }

export async function ALL(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!allowedOrigin(request)) return NextResponse.json({ message: 'Cross-origin request rejected.' }, { status: 403 });
  const { path } = await context.params;
  const route = path.join('/');
  if (route === '_session' && request.method === 'GET') return NextResponse.json({ authenticated: Boolean(request.cookies.get(SESSION_COOKIE)?.value) }, { headers: { 'Cache-Control': 'no-store' } });
  if (!isAllowedRoute(route)) return NextResponse.json({ message: 'Store API route is not available through this client.' }, { status: 404 });
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const target = `${upstreamBase()}/${path.map((part) => encodeURIComponent(part)).join('/')}${request.nextUrl.search}`;
  const headers = new Headers(request.headers);
  for (const name of ['host', 'content-length', 'cookie', 'origin', 'referer', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest', 'authorization']) headers.delete(name);
  if (session) headers.set('Authorization', `Bearer ${session}`);
  if (!headers.has('x-correlation-id')) headers.set('x-correlation-id', crypto.randomUUID());
  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  let upstream: Response;
  try { upstream = await fetch(target, { method: request.method, headers, body, cache: 'no-store', redirect: 'manual', signal: controller.signal }); }
  catch (error) { console.error('[PRIYASA BFF] upstream request failed', { target, method: request.method, error: error instanceof Error ? error.message : String(error) }); return NextResponse.json({ message: error instanceof Error && error.name === 'AbortError' ? 'PriyasaCore request timed out.' : 'PriyasaCore is temporarily unavailable.' }, { status: 502 }); }
  finally { clearTimeout(timeout); }

  const contentType = upstream.headers.get('content-type') || '';
  const rawBody = await upstream.arrayBuffer();
  const responseHeaders = new Headers({ 'Content-Type': contentType || 'application/json', 'Cache-Control': 'no-store' });
  for (const name of ['etag', 'x-request-id', 'x-correlation-id']) { const value = upstream.headers.get(name); if (value) responseHeaders.set(name, value); }
  const isVerify = route === 'auth/verify-otp' && upstream.ok && contentType.includes('application/json');
  let responseBody: BodyInit = rawBody; let token: string | null = null;
  if (isVerify) { try { const payload = JSON.parse(new TextDecoder().decode(rawBody)); token = extractToken(payload); responseBody = JSON.stringify(stripToken(payload)); } catch {} }
  const response = new NextResponse(responseBody, { status: upstream.status, statusText: upstream.statusText, headers: responseHeaders });
  if (isVerify && token) sessionCookie(response, token, 60 * 60 * 24 * 30);
  if (route === 'auth/logout' || upstream.status === 401) sessionCookie(response, '', 0);
  return response;
}
export const GET = ALL;
export const POST = ALL;
export const PUT = ALL;
export const PATCH = ALL;
export const DELETE = ALL;
export const HEAD = ALL;
