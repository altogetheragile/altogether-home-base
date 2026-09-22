import { describe, it, expect, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Every ordinary request now also refreshes the shared session. That needs the network, so it is
// stubbed here and covered on its own in lib/supabase/middleware.test.ts; what matters in this
// file is which of the two paths a request takes.
const refreshed = vi.fn(async () => {
  const res = NextResponse.next();
  res.headers.set('x-refreshed', '1');
  return res;
});
vi.mock('@/lib/supabase/middleware', () => ({ updateSession: (req: NextRequest) => refreshed(req) }));

const { middleware } = await import('./middleware');

// A password reset that lands on the Site has nowhere to go.
//
// Supabase sends the reset to the redirect URL it was asked for, and falls back to the project's
// Site URL when that redirect is not on its allowlist. The Site URL is `/`, which this app answers,
// and this app has no auth of any kind. The link arrived as
//
//   https://altogetheragile.com/?code=5b1e0457-...
//
// and the home page rendered with the code untouched. Reported from the preview: "the email link
// does not take me to a pwd reset screen".

const go = (url: string) => middleware(new NextRequest(new URL(url, 'https://altogetheragile.com')));

describe('an auth link that lands on the Site', () => {
  it('is sent to the form, with its code', async () => {
    const res = await go('/?code=5b1e0457-5389-4b3b-b3ac-21dd09821467');
    expect(res.status, 'not a redirect').toBe(307);
    const to = new URL(res.headers.get('location')!);
    expect(to.pathname).toBe('/auth/reset');
    expect(to.searchParams.get('code')).toBe('5b1e0457-5389-4b3b-b3ac-21dd09821467');
  });

  it('carries the older recovery shape too', async () => {
    const to = new URL((await go('/?token_hash=abc&type=recovery')).headers.get('location')!);
    expect(to.pathname).toBe('/auth/reset');
    expect(to.searchParams.get('token_hash')).toBe('abc');
    expect(to.searchParams.get('type')).toBe('recovery');
  });

  it('says where it landed, when it was not the home page', async () => {
    const to = new URL((await go('/about?code=abc')).headers.get('location')!);
    expect(to.searchParams.get('from')).toBe('/about');
  });
});

describe('an ordinary visit', () => {
  it('is not redirected', async () => {
    for (const path of ['/', '/about', '/exams', '/blog/a-post', '/?utm_source=newsletter']) {
      expect((await go(path)).headers.get('location'), `${path} was redirected`).toBeNull();
    }
  });

  it('has its session refreshed, so a page can ask who is asking', async () => {
    refreshed.mockClear();
    const res = await go('/about');
    expect(refreshed).toHaveBeenCalledOnce();
    expect(res.headers.get('x-refreshed')).toBe('1');
  });
});

describe('a reset link', () => {
  it('is redirected without a refresh, having no session to refresh yet', async () => {
    refreshed.mockClear();
    await go('/?code=abc');
    expect(refreshed).not.toHaveBeenCalled();
  });
});
