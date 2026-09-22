import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

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
  it('is sent to the form, with its code', () => {
    const res = go('/?code=5b1e0457-5389-4b3b-b3ac-21dd09821467');
    expect(res.status, 'not a redirect').toBe(307);
    const to = new URL(res.headers.get('location')!);
    expect(to.pathname).toBe('/auth/reset');
    expect(to.searchParams.get('code')).toBe('5b1e0457-5389-4b3b-b3ac-21dd09821467');
  });

  it('carries the older recovery shape too', () => {
    const to = new URL(go('/?token_hash=abc&type=recovery').headers.get('location')!);
    expect(to.pathname).toBe('/auth/reset');
    expect(to.searchParams.get('token_hash')).toBe('abc');
    expect(to.searchParams.get('type')).toBe('recovery');
  });

  it('says where it landed, when it was not the home page', () => {
    const to = new URL(go('/about?code=abc').headers.get('location')!);
    expect(to.searchParams.get('from')).toBe('/about');
  });
});

describe('an ordinary visit', () => {
  it('is left alone', () => {
    for (const path of ['/', '/about', '/exams', '/blog/a-post', '/?utm_source=newsletter']) {
      expect(go(path).headers.get('location'), `${path} was redirected`).toBeNull();
    }
  });
});
