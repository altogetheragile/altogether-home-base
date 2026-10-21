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

/** Pages that answer many addresses, one per row of something in the database. Every course page
 *  is the same page with a different course in it, so one registry holds the words they share:
 *  the headings, the buttons, the form. What the course itself says is that course's row, edited
 *  in Admin, and is not offered here.
 *
 *  Keyed by the prefix, trailing slash included, so '/training' itself matches nothing. */
export const COPY_ROUTE_PREFIXES: Record<string, string> = {
  '/training/': 'training',
};

/** The registry a pathname edits, or null where there is nothing on the page to edit. */
export function copyPageFor(pathname: string): string | null {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (COPY_ROUTES[clean]) return COPY_ROUTES[clean];
  const prefix = Object.keys(COPY_ROUTE_PREFIXES).find((pre) => clean.startsWith(pre) && clean.length > pre.length);
  return prefix ? COPY_ROUTE_PREFIXES[prefix] : null;
}

/** Always offered, on every page, because the menu and footer are on every page. */
export const CHROME_PAGE = 'navigation';

/** Also always offered: the name, the brand, the founder and how to reach you. These used to be
 *  four separate admin pages in the other app, which meant knowing where each thing lived before
 *  you could change it. */
export const SITE_PAGE = 'site';

/** Which module switch decides whether a URL is shown. Same shape as COPY_ROUTES and for the same
 *  reason: the client needs to answer "what am I looking at?" before asking the server anything.
 *
 *  Only pages with a switch of their own. The home page has none, deliberately: a site with no
 *  front door is not a state worth being able to reach by accident. */
export const MODULE_FOR_PATH: Record<string, string> = {
  '/about': 'about',
  '/coaching': 'coaching',
  '/contact': 'contact',
  '/testimonials': 'testimonials',
  '/events': 'events',
  '/blog': 'blog',
  '/exams': 'exams',
};
