// ============= Which registry a URL is editing =============
//
// Deliberately free of any import that reaches the server, because the on-page editor is a client
// component and needs to answer "what am I looking at?" before it asks the server for anything.
//
// The mapping is explicit rather than derived from the path. /blog/some-post is a post, whose words
// live in the posts table and are edited in Admin; only /blog itself is the page this registry
// describes. Deriving the page from the first path segment would have offered to edit the listing's
// headings while standing on an article, which is a confusing thing to be offered.

export const COPY_ROUTES: Record<string, string> = {
  '/': 'home',
  '/about': 'about',
  '/coaching': 'coaching',
  '/contact': 'contact',
  '/testimonials': 'testimonials',
  '/blog': 'blog',
  '/events': 'events',
  '/exams': 'exams',
};

/** The registry a pathname edits, or null where there is nothing on the page to edit. */
export function copyPageFor(pathname: string): string | null {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return COPY_ROUTES[clean] ?? null;
}

/** Always offered, on every page, because the menu and footer are on every page. */
export const CHROME_PAGE = 'navigation';
