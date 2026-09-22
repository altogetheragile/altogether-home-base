// Generated once, hand-maintained since: which storage the session lives in decides whether the
// two apps can both see it, so it is not left to a generator.
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ============= One session, both apps =============
//
// The session used to live in localStorage. Same origin as the Site, but the Site is
// server-rendered: its pages run before any JavaScript, so a server that wants to know who is
// asking needs the session in a cookie. It could not have one, so it was handed a cosmetic
// `aa-auth` cookie meaning "somebody is signed in" and nothing more (src/utils/authPresence.ts).
//
// That cost more than it looked like:
//
//   exam_attempts has recorded nothing since June, because the Site's exam player calls getUser()
//   on a client with no session and quietly gives up;
//
//   the exam guide editor had to go in Admin rather than on the page, because a page cannot tell
//   an admin from a visitor;
//
//   and the half of the app behind a login cannot move to the Site at all while the Site cannot
//   tell who is asking.
//
// createBrowserClient writes the session as cookies in the format @supabase/ssr's server client
// reads, which is what apps/web already uses. Same origin, so both see it.
//
// Two consequences, both deliberate. Everyone signed in at the moment this ships is signed out
// once, because their session is in storage this no longer reads. And the Site can now act as the
// signed-in user on the server, which is the point of the change and is a real increase in what
// that app is trusted with.

export const supabase = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Stated rather than inherited. createBrowserClient defaults this to isBrowser(), so it is
    // already true here - but this app depends on the browser noticing the code in a reset link
    // and exchanging it, and that dependency should be written down rather than left to a default
    // that exists for a different kind of app.
    detectSessionInUrl: true,
  },
});
