import { afterEach, describe, expect, it, vi } from 'vitest';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

describe('store API client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('uses the server-side PriyasaCore base URL for server requests', async () => {
    process.env.PRIYASA_API_BASE_URL = 'https://api.priyasa.com/api/v1';
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const { api } = await import('../../src/lib/api');
    const result = await api<{ ok: boolean }>('/health');

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.priyasa.com/api/v1/health',
      expect.objectContaining({ credentials: 'include', cache: 'no-store' }),
    );
  });
});
