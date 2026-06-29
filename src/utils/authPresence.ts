// Publishes a lightweight, NON-SENSITIVE "is someone signed in" signal as a readable
// cookie on the apex domain, so the Next.js Site (same origin) can render its chrome
// (Dashboard vs Sign In) correctly without access to the real session. This is display
// only — it carries no token and grants no access; the App's real session stays in its
// own storage and every gated route is still enforced by Supabase auth/RLS. Setting it
// must never be able to break auth, so callers wrap nothing — this never throws.
const COOKIE = 'aa-auth';
const MAX_AGE_DAYS = 30;

export function setAuthPresence(signedIn: boolean): void {
  try {
    if (typeof document === 'undefined') return;
    const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
    if (signedIn) {
      document.cookie = `${COOKIE}=1; Path=/; Max-Age=${60 * 60 * 24 * MAX_AGE_DAYS}; SameSite=Lax${secure}`;
    } else {
      document.cookie = `${COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    }
  } catch {
    /* cosmetic only — never let this affect auth */
  }
}
