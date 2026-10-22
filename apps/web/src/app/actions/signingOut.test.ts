import { describe, it, expect, vi, beforeEach } from 'vitest';

// What signing out from the site clears, and what it must leave.

let jar: Map<string, string>;
const signOutCall = vi.fn(async (_opts: unknown) => ({ error: null }));
const redirect = vi.fn();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => [...jar.keys()].map((name) => ({ name, value: jar.get(name)! })),
    delete: (name: string) => jar.delete(name),
  }),
}));
vi.mock('next/navigation', () => ({ redirect: (to: string) => redirect(to), notFound: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { signOut: signOutCall } }) }));

const { signOut } = await import('./signOut');

beforeEach(() => {
  jar = new Map([
    ['sb-abc-auth-token.0', 'x'], ['sb-abc-auth-token.1', 'y'],
    ['sb-abc-auth-token-code-verifier', 'pending reset'],
    ['aa-auth', '1'], ['aa-visitor-view', '1'], ['unrelated', 'keep'],
  ]);
  signOutCall.mockClear();
  redirect.mockClear();
});

describe('signing out from the site', () => {
  it('ends the session on this device only, and goes home', async () => {
    await signOut();
    // Not global: signing out of a laptop must not sign the same person out of their own.
    expect(signOutCall).toHaveBeenCalledWith({ scope: 'local' });
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('takes every chunk of the session and the signed-in signals with it', async () => {
    await signOut();
    expect([...jar.keys()].sort()).toEqual(['sb-abc-auth-token-code-verifier', 'unrelated']);
  });

  it('still clears the cookies when auth cannot be reached', async () => {
    signOutCall.mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND'));
    await signOut();
    expect(jar.has('sb-abc-auth-token.0')).toBe(false);
    expect(redirect).toHaveBeenCalledWith('/');
  });
});
