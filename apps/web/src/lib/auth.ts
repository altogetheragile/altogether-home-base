import { cache } from 'react';
import { redirect, notFound } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from './supabase/server';

// ============= Who is asking =============
//
// The Site used to read `aa-auth`, a cookie the App published meaning "somebody is signed in".
// It carried no identity and could not be trusted for anything, which is why the exam guide
// editor lives in Admin and why nothing behind a login could move here.
//
// Since the session moved into shared cookies (PR #728) this app can ask properly. `getUser()`
// is the one to call: it validates the token against the auth server rather than decoding
// whatever the cookie claims, so the answer is safe to gate on.
//
// `cache` makes it once per request, however many components ask. It ships only in React's
// Server Components build, so under the test runner it is undefined; calling straight through is
// correct there, because the deduplication is an optimisation and not behaviour.
const perRequest: <T extends (...args: never[]) => unknown>(fn: T) => T =
  typeof cache === 'function' ? cache : (fn) => fn;

export const getCurrentUser = perRequest(async (): Promise<User | null> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    // A signed-out visitor is an error here (AuthSessionMissingError), not an exception. Either
    // way the answer is nobody.
    if (error) return null;
    return data.user ?? null;
  } catch {
    // Auth being unreachable must not take the public site down with it. Everything the Site
    // renders today is public; the worst case is a header that says Sign In to someone who is.
    return null;
  }
});

type NamedUser = { email?: string | null; user_metadata?: Record<string, unknown> | null };

/** What to call someone in the chrome. Their own name if we hold one, otherwise the part of
 *  their email before the @, which is what the App's dashboard has always greeted them with. */
export function displayName(user: NamedUser | null | undefined): string | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  for (const key of ['full_name', 'name', 'first_name'] as const) {
    const v = meta[key];
    if (typeof v === 'string' && v.trim()) return v.trim().split(/\s+/)[0];
  }
  const local = user.email?.split('@')[0]?.trim();
  return local || null;
}

// ============= What they are allowed to do =============
//
// Identity is not authorisation. These are separate on purpose: `getCurrentUser` answers who, and
// nothing here trusts anything the browser sent to answer what.
//
// Every one of these fails closed. An error reading a role is not an admin.

export type Role = 'admin' | 'moderator' | 'user';

/** Their role, by the same precedence the App uses (src/hooks/useUserRole.ts): the `user_roles`
 *  table first, then `profiles.role` for the accounts that predate it. Written twice because the
 *  two apps cannot import from each other; `roleMatchesTheApp.test.ts` holds them together. */
export const getUserRole = perRequest(async (): Promise<Role | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  try {
    const supabase = await createClient();
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
    const held = (roles ?? []).map((r: { role: string }) => r.role);
    if (held.includes('admin')) return 'admin';
    if (held.includes('moderator')) return 'moderator';

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    const fallback = (profile as { role?: string } | null)?.role;
    return fallback === 'admin' || fallback === 'moderator' ? fallback : 'user';
  } catch {
    return 'user';
  }
});

export async function isAdmin(): Promise<boolean> {
  return (await getUserRole()) === 'admin';
}

// ============= Second factor =============
//
// The rule the App applies (src/components/ProtectedRoute.tsx) and the one worth restating,
// because it reads as a loophole until you see why it is not: someone with no second factor
// configured passes. AAL2 is not a claim that everyone has MFA, it is a claim that anyone who has
// it has *used* it. Demanding aal2 of an account with no factor would lock that account out of
// its own dashboard with no way to satisfy the check.

export type Assurance = { satisfied: boolean; hasFactor: boolean; level: string | null };

export const assurance = perRequest(async (): Promise<Assurance> => {
  try {
    const supabase = await createClient();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = factors?.all?.some((f) => f.factor_type === 'totp' && f.status === 'verified') ?? false;
    if (!verified) return { satisfied: true, hasFactor: false, level: null };

    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const level = data?.currentLevel ?? null;
    return { satisfied: level === 'aal2', hasFactor: true, level };
  } catch {
    // Unreadable is not satisfied. This is the one place failing closed can lock someone out, so
    // it is deliberate: a page that needs a second factor is a page worth a second attempt.
    return { satisfied: false, hasFactor: true, level: null };
  }
});

// ============= Gates =============
//
// For pages, not for buttons. A page calls one of these and either continues with a user or never
// renders at all. `redirect` and `notFound` throw, so nothing after them runs.

/** Signed in, and past their second factor if they have one. Sends them to the App's sign-in form
 *  otherwise, since the Site has none of its own. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/auth');
  const { satisfied } = await assurance();
  // `mfa=1` is how the App's form knows to go straight to the challenge. The App reads it in
  // src/pages/Auth.tsx; a server redirect cannot set the sessionStorage flag it used to use.
  if (!satisfied) redirect('/auth?mfa=1');
  return user;
}

/** Admins only. A 404 rather than a refusal: someone who is not an admin has no business learning
 *  that the page exists. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!(await isAdmin())) notFound();
  return user;
}
