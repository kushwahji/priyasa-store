import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM = (process.env.PRIYASA_API_BASE_URL || process.env.PRIYASA_API_URL || '').replace(/\/$/, '');

async function proxy(request: NextRequest) {
  try {
    if (!UPSTREAM) return NextResponse.json({ message: 'PRIYASA_API_BASE_URL is not configured' }, { status: 502 });
    const path = request.nextUrl.searchParams.get('path') || '';
    const target = `${UPSTREAM}/${path.replace(/^\/+/, '')}${request.nextUrl.search ? '' : ''}`;
    const headers = new Headers(request.headers);
    headers.delete('host'); headers.delete('connection'); headers.delete('content-length'); headers.set('accept', 'application/json');
    const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();
    const upstream = await fetch(target, { method: request.method, headers, body, redirect: 'manual', cache: 'no-store' });
    const out = new Headers();
    for (const name of ['content-type', 'set-cookie', 'x-correlation-id']) { const value = upstream.headers.get(name); if (value) out.set(name, value); }
    return new NextResponse(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: out });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to reach PRIYASA Core' }, { status: 502 });
  }
}
export const GET = proxy; export const POST = proxy; export const PUT = proxy; export const PATCH = proxy; export const DELETE = proxy; export const HEAD = proxy;
