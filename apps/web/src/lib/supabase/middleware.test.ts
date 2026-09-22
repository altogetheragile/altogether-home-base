import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// The point of doing the refresh in middleware rather than in the page is that middleware can
// write cookies back. If the rotated tokens do not reach the browser, the session is worse off
// than before this existed: the old refresh token has been spent and nothing has replaced it.
// So that is what these check.

type CookieToSet = { name: string; value: string; options: Record<string, unknown> };
let onCreate: (opts: { cookies: { getAll: () => { name: string; value: string }[]; setAll: (c: CookieToSet[]) => void } }) => void;
const getUser = vi.fn(async () => ({ data: { user: null }, error: null }));

vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, opts: Parameters<typeof onCreate>[0]) => {
    onCreate?.(opts);
    return { auth: { getUser } };
  },
}));

const { updateSession } = await import('./middleware');

const request = (cookie?: string) =>
  new NextRequest(new URL('/about', 'https://altogetheragile.com'), {
    headers: cookie ? { cookie } : undefined,
  });

beforeEach(() => {
  onCreate = () => {};
  getUser.mockClear();
});

describe('keeping the shared session alive', () => {
  it('asks the auth server who this is', async () => {
    await updateSession(request());
    expect(getUser).toHaveBeenCalledOnce();
  });

  it('hands the request cookies to supabase', async () => {
    let seen: { name: string; value: string }[] = [];
    onCreate = (opts) => { seen = opts.cookies.getAll(); };
    await updateSession(request('sb-test-auth-token=abc; other=1'));
    expect(seen.map((c) => c.name)).toContain('sb-test-auth-token');
  });

  it('puts refreshed tokens on the response, so the browser and the App both get them', async () => {
    onCreate = (opts) => {
      opts.cookies.setAll([
        { name: 'sb-test-auth-token', value: 'rotated', options: { path: '/' } },
      ]);
    };
    const res = await updateSession(request('sb-test-auth-token=stale'));
    expect(res.cookies.get('sb-test-auth-token')?.value).toBe('rotated');
  });

  it('leaves the response alone when there was nothing to rotate', async () => {
    const res = await updateSession(request());
    expect(res.cookies.getAll()).toHaveLength(0);
    expect(res.headers.get('location'), 'must not redirect').toBeNull();
  });
});
