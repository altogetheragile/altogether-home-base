import { NextResponse, type NextRequest } from 'next/server';

// ============= An auth link that lands here has to get to the form =============
//
// Supabase sends a password reset to the redirect URL it was asked for, and falls back to the
// project's Site URL when that redirect is not on its allowlist. The Site URL is `/`, which this
// app answers, and this app has no auth of any kind - so the link arrived as
//
//   https://altogetheragile.com/?code=5b1e0457-...
//
// and the home page rendered, the code untouched. The person who asked to reset their password got
// the home page and no explanation.
//
// The App owns /auth/reset and its Supabase client exchanges the code. So anything arriving here
// carrying one is sent there with its query intact.
//
// This is a safety net, not the fix. The fix is the redirect allowlist in the Supabase dashboard,
// so the link points at /auth/reset in the first place. This is here because the Site URL will
// always be `/`, and a link that has already been emailed cannot be corrected.

const AUTH_PARAMS = ['code', 'token_hash'];

export function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;
  if (!AUTH_PARAMS.some((p) => searchParams.has(p))) return NextResponse.next();

  const target = new URL('/auth/reset', request.url);
  searchParams.forEach((value, key) => target.searchParams.set(key, value));
  // Where it came from, so the form can say something useful if it needs to.
  if (pathname !== '/') target.searchParams.set('from', pathname);
  return NextResponse.redirect(target);
}

export const config = {
  // Every page this app serves, and nothing static.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|og|robots.txt|sitemap.xml).*)'],
};
