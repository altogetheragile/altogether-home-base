import { cache } from 'react';
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
