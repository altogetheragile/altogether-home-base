import { describe, it, expect, vi, beforeEach } from 'vitest';
import { displayName } from './auth';

// The Site spent three months unable to tell an admin from a visitor, because all it had was a
// cookie saying somebody was signed in. These cover the two halves of the replacement: what we
// call someone, and what happens when the answer cannot be got.

describe('what to call someone', () => {
  it('uses their own name, first word only', () => {
    expect(displayName({ email: 'a@b.com', user_metadata: { full_name: 'Alun Davies-Baker' } })).toBe('Alun');
  });

  it('accepts the other shapes Supabase stores a name under', () => {
    expect(displayName({ user_metadata: { name: 'Sam Patel' } })).toBe('Sam');
    expect(displayName({ user_metadata: { first_name: 'Jo' } })).toBe('Jo');
  });

  it('falls back to the email local part, which is what the App has always greeted them with', () => {
    expect(displayName({ email: 'al@altogetheragile.com', user_metadata: {} })).toBe('al');
  });

  it('is nobody when there is nobody, and does not throw on the odd shapes', () => {
    expect(displayName(null)).toBeNull();
    expect(displayName(undefined)).toBeNull();
    expect(displayName({ email: null, user_metadata: null })).toBeNull();
    expect(displayName({ email: '', user_metadata: { full_name: '   ' } })).toBeNull();
    // A name stored as something other than a string must not become "[object Object]".
    expect(displayName({ email: 'x@y.com', user_metadata: { full_name: { given: 'Nope' } } })).toBe('x');
  });
});

describe('when the session cannot be read', () => {
  beforeEach(() => vi.resetModules());

  const load = async (impl: () => unknown) => {
    vi.doMock('./supabase/server', () => ({ createClient: async () => ({ auth: { getUser: impl } }) }));
    return (await import('./auth')).getCurrentUser();
  };

  it('a signed-out visitor is nobody, not an error', async () => {
    // supabase-js reports this as an error rather than an empty result.
    await expect(load(async () => ({ data: { user: null }, error: { message: 'Auth session missing!' } }))).resolves.toBeNull();
  });

  it('auth being unreachable does not take the public site down', async () => {
    await expect(load(async () => { throw new Error('getaddrinfo ENOTFOUND'); })).resolves.toBeNull();
  });

  it('a real user comes back', async () => {
    const user = { id: 'u1', email: 'al@altogetheragile.com' };
    await expect(load(async () => ({ data: { user }, error: null }))).resolves.toEqual(user);
  });
});
