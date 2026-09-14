import { NextRequest, NextResponse } from 'next/server';

const API_BASE = (process.env.PRIYASA_API_BASE_URL || process.env.PRIYASA_API_URL || '').replace(/\/$/, '');

const blockedHeaders = new Set(['host', 'content-length', 'connection']);

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!API_BASE) {
    return NextResponse.json({ message: 'PRIYASA_API_BASE_URL is not configured' }, { status: 500 });
  }

  const { path } = await context.params;
  const target = `${API_BASE}/${path.map(segment => encodeURIComponent(segment)).join('/')}${request.nextUrl.search}`;
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (!blockedHeaders.has(key.toLowerCase())) headers.set(key, value);
  });
  headers.set('x-priyasa-store-proxy', '1');

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
    });

    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!['content-length', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json({ message: 'Unable to reach PriyasaCore API' }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const HEAD = forward;
