// ============= Which URLs belong to the Site, not the App =============
//
// `config/vercel/routing.json` rewrites these to the Next Site, which server-renders them. The App must not
// declare routes for them and must not link to them with <Link>: React Router would happily render
// something of its own at that URL without ever asking the server, which is exactly how this site
// came to have two home pages and two About pages, maintained in lockstep and rendered to
// different people depending on how they arrived.
//
// A plain <a> is the point. It leaves the app, the server answers, and there is one implementation
// of every public URL.
//
// siteOwnedRoutes.test.ts compares this list with the routing config, so adding a rewrite without adding
// it here fails the build. The link component that uses it is src/components/AppLink.tsx.

export const SITE_OWNED = [
  '/',
  '/about',
  '/coaching',
  '/contact',
  '/testimonials',
  '/events',
  '/blog',
  '/exams',
  // Courses, workshops and webinars. Not '/courses': a workshop is not a course, and the
  // catalogue holds both. Every old /courses/<slug> address redirects here.
  '/training',
  // Admin only, and 404 to everybody else. Listed here because the Site answers it, not because
  // it is public.
  '/setup',
] as const;

/** Whether the Site answers this path. Prefix match, so /blog/a-post counts, but /events/:id does
 *  not: the routing config rewrites `/events` alone, and the App still owns the detail pages under it. */
export function isSiteOwned(path: string): boolean {
  if (path === '/') return true;
  return SITE_OWNED.some((r) => r !== '/' && (path === r || (r !== '/events' && path.startsWith(r + '/'))));
}
