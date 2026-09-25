import { getCopy } from '.';

// ============= What this site calls a page =============
//
// A page had its name written out in three places: the menu, the browser tab and the breadcrumb
// in the structured data. The menu was editable and the other two were not, so renaming Coaching
// to Services gave a site whose menu said Services, whose tab said Coaching, and whose breadcrumb
// told Google the page was called Coaching. Two out of three is worse than none, because the
// disagreement is the thing a search engine notices.
//
// The breadcrumb now reads the menu label. One name, edited once. The tab is its own field,
// because it is doing a different job: a menu entry wants to be short and a title wants to be
// what somebody would search for, and on this site they are genuinely different sentences.

/** Which menu label names each page. Only the pages the Site serves: the App's routes have no
 *  breadcrumb of their own. */
const NAV_KEY: Record<string, string> = {
  about: 'nav.about',
  coaching: 'nav.coaching',
  contact: 'nav.contact',
  testimonials: 'nav.testimonials',
  events: 'nav.events',
  blog: 'nav.blog',
  exams: 'nav.exams',
};

/** The name to show for a page, as the site calls it.
 *
 *  Falls back to what is passed in rather than to nothing: a breadcrumb saying the wrong thing is
 *  better than one saying "" on every page of a site whose navigation registry failed to load. */
export async function pageName(page: string, fallback: string): Promise<string> {
  const key = NAV_KEY[page];
  if (!key) return fallback;
  try {
    const t = await getCopy('navigation');
    return t(key).trim() || fallback;
  } catch {
    return fallback;
  }
}

/** The breadcrumb for a Site page: home, then this page under whatever it is called. */
export async function pageCrumbs(page: string, path: string, fallback: string) {
  return [
    { name: 'Home', path: '/' },
    { name: await pageName(page, fallback), path },
  ];
}
