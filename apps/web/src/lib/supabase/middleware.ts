import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ============= Keeping the shared session alive =============
//
// Since PR #728 both apps store one session in the same cookies, so the Site can finally ask who
// is signing in rather than reading a cosmetic "somebody is" flag. That only holds while the
// access token is fresh. An access token lasts an hour; the refresh token that replaces it can
// only be spent somewhere that is allowed to write cookies, and a Server Component is not: its
// cookie store is read-only, which is why `lib/supabase/server.ts` swallows the write.
//
// Middleware is allowed to write. So the refresh happens here, once per request, and the new
// tokens go back to the browser in the same cookies the App reads. Without this the Site would
// still refresh - the client does it on its own - but would throw the result away every time, and
// rotating a refresh token and then discarding it is how sessions get lost.
//
// Two rules from the @supabase/ssr docs, both load-bearing:
//   - do nothing between createServerClient and getUser, or a slow render can leave the session
//     half-written;
//   - return THIS response object, because it is the one carrying the refreshed cookies.
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // A visitor with no session cookie costs nothing here: supabase-js answers from memory rather
  // than calling the auth server, so the common case stays free.
  await supabase.auth.getUser();

  return response;
}
