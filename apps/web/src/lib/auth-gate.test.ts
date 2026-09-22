import { describe, it, expect, vi, beforeEach } from 'vitest';

// The Site has never gated anything. These cover the rules it will gate by, and in particular the
// three places where being wrong is expensive: a role that cannot be read, a second factor that
// cannot be read, and an account that has no second factor at all.

type Fake = {
  user?: { id: string } | null;
  roles?: { role: string }[];
  profile?: { role: string } | null;
  factors?: { factor_type: string; status: string }[];
  level?: string | null;
  throwOn?: 'roles' | 'factors';
};

const redirect = vi.fn((to: string) => { throw new Error('REDIRECT:' + to); });
const notFound = vi.fn(() => { throw new Error('NOT_FOUND'); });
vi.mock('next/navigation', () => ({ redirect: (t: string) => redirect(t), notFound: () => notFound() }));

const load = async (f: Fake) => {
  vi.resetModules();
  redirect.mockClear();
  notFound.mockClear();
  vi.doMock('./supabase/server', () => ({
    createClient: async () => ({
      auth: {
        getUser: async () => ({ data: { user: f.user ?? null }, error: f.user ? null : { message: 'missing' } }),
        mfa: {
          listFactors: async () => {
            if (f.throwOn === 'factors') throw new Error('unreachable');
            return { data: { all: f.factors ?? [] } };
          },
          getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: f.level ?? null } }),
        },
      },
      from: (table: string) => {
        if (f.throwOn === 'roles') throw new Error('unreachable');
        const rows = table === 'user_roles' ? (f.roles ?? []) : [];
        return {
          select: () => ({
            eq: () => ({
              then: (r: (v: unknown) => unknown) => r({ data: rows }),
              maybeSingle: async () => ({ data: table === 'profiles' ? (f.profile ?? null) : null }),
            }),
          }),
        };
      },
    }),
  }));
  return import('./auth');
};

const AL = { id: 'u1' };

describe('what role someone holds', () => {
  it('prefers admin over anything else they hold', async () => {
    const { getUserRole } = await load({ user: AL, roles: [{ role: 'user' }, { role: 'admin' }] });
    expect(await getUserRole()).toBe('admin');
  });

  it('falls back to the profile for accounts that predate user_roles', async () => {
    const { getUserRole } = await load({ user: AL, roles: [], profile: { role: 'admin' } });
    expect(await getUserRole()).toBe('admin');
  });

  it('is nobody when nobody is signed in', async () => {
    const { getUserRole, isAdmin } = await load({ user: null });
    expect(await getUserRole()).toBeNull();
    expect(await isAdmin()).toBe(false);
  });

  it('is not an admin when the role cannot be read', async () => {
    const { isAdmin } = await load({ user: AL, throwOn: 'roles' });
    expect(await isAdmin()).toBe(false);
  });

  it('does not promote an unknown profile role', async () => {
    const { getUserRole } = await load({ user: AL, roles: [], profile: { role: 'wizard' } });
    expect(await getUserRole()).toBe('user');
  });
});

describe('the second factor', () => {
  it('is satisfied by an account that has none, which is the point', async () => {
    const { assurance } = await load({ user: AL, factors: [] });
    expect(await assurance()).toMatchObject({ satisfied: true, hasFactor: false });
  });

  it('ignores a factor that was never verified', async () => {
    const { assurance } = await load({ user: AL, factors: [{ factor_type: 'totp', status: 'unverified' }] });
    expect(await assurance()).toMatchObject({ satisfied: true, hasFactor: false });
  });

  it('is satisfied when someone who has one has used it', async () => {
    const { assurance } = await load({ user: AL, factors: [{ factor_type: 'totp', status: 'verified' }], level: 'aal2' });
    expect(await assurance()).toMatchObject({ satisfied: true, hasFactor: true, level: 'aal2' });
  });

  it('is NOT satisfied when they have one and have not', async () => {
    const { assurance } = await load({ user: AL, factors: [{ factor_type: 'totp', status: 'verified' }], level: 'aal1' });
    expect(await assurance()).toMatchObject({ satisfied: false, hasFactor: true });
  });

  it('fails closed when it cannot be read', async () => {
    const { assurance } = await load({ user: AL, throwOn: 'factors' });
    expect(await assurance()).toMatchObject({ satisfied: false });
  });
});

describe('the gates', () => {
  it('send a stranger to the sign-in form', async () => {
    const { requireUser } = await load({ user: null });
    await expect(requireUser()).rejects.toThrow('REDIRECT:/auth');
  });

  it('send someone who owes a second factor to the challenge', async () => {
    const { requireUser } = await load({ user: AL, factors: [{ factor_type: 'totp', status: 'verified' }], level: 'aal1' });
    await expect(requireUser()).rejects.toThrow('REDIRECT:/auth?mfa=1');
  });

  it('let a signed-in user through', async () => {
    const { requireUser } = await load({ user: AL, factors: [] });
    await expect(requireUser()).resolves.toEqual(AL);
  });

  it('show a non-admin a 404 rather than telling them the page exists', async () => {
    const { requireAdmin } = await load({ user: AL, factors: [], roles: [{ role: 'user' }] });
    await expect(requireAdmin()).rejects.toThrow('NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('let an admin through', async () => {
    const { requireAdmin } = await load({ user: AL, factors: [], roles: [{ role: 'admin' }] });
    await expect(requireAdmin()).resolves.toEqual(AL);
  });
});
