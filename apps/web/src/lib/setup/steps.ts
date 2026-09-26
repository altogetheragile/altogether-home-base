// ============= The order somebody is asked things in =============
//
// Five steps, as docs/NEW_SITE_SETUP.md specified. The wizard asks for them one screen at a time;
// the same fields are also reachable from the editor on any page, because a site is set up once
// and edited for years.
//
// Each step names the fields it wants by key. Pure data, so a test can check every key exists and
// that nothing important was left out of every step.

export type StepId = 'notready' | 'identity' | 'brand' | 'founder' | 'modules' | 'words';

export type Step = {
  id: StepId;
  title: string;
  /** Said once at the top of the step. What this is for, not what to type. */
  blurb: string;
  /** Which registry the fields come from. */
  page: string;
  /** The fields, in the order they should be asked for. */
  keys: string[];
  /** Shown under the step when there is more to it than the wizard asks for. */
  footnote?: string;
};

export const STEPS: Step[] = [
  {
    // First, because everything after it is work done in public otherwise. A site is reachable
    // the moment its domain resolves, and the one before this spent a day live with inherited
    // words, placeholder statistics and a main button pointing at a page that answered Not Found.
    id: 'notready',
    title: 'Hide it while you work',
    blurb: 'A site is public as soon as its address works, which is usually long before it is ready. Switch this on and visitors see a holding page while you get on with the rest of this. You will still see the real site, because you are signed in.',
    page: 'site',
    keys: [
      'site.under_construction',
      'site.construction.heading',
      'site.construction.body',
    ],
    footnote: 'Search engines are asked not to index the site while this is on, so a half-written page does not end up in results.',
  },
  {
    id: 'identity',
    title: 'Who this site belongs to',
    blurb: 'The name and how somebody reaches you. These appear in the menu, the footer, the browser tab and every search result, so they are worth getting right before anything else.',
    page: 'site',
    keys: [
      'site.company_name',
      'site.company_description',
      'site.contact_email',
      'site.contact_phone',
      'site.contact_location',
      'site.social_linkedin',
      'site.social_twitter',
      'site.social_facebook',
      'site.social_youtube',
      'site.social_github',
      'site.copyright_text',
    ],
    footnote: 'Leave any social link empty and its icon does not appear in the footer. Most sites use one or two.',
  },
  {
    id: 'brand',
    title: 'What it looks like',
    blurb: 'Leave the logo empty and your business name is used as words, which often looks better than a stretched image, and the switch under it decides how those words are set. The two typefaces and the colours are used throughout: the first colour is the one people notice.',
    page: 'site',
    keys: [
      'site.brand.images.logo',
      // Directly under the logo, because it only does anything when that is empty. On its own
      // elsewhere it reads as a setting that has stopped working.
      'site.brand.wordmark.twoTone',
      // Type is the same kind of decision as colour, made once and applied everywhere, so it is
      // asked for in the same breath rather than left to be discovered.
      'site.brand.fonts.heading',
      'site.brand.fonts.body',
      'site.brand.colors.orange',
      'site.brand.colors.deepTeal',
      'site.brand.colors.midTeal',
      'site.brand.colors.skyTeal',
      'site.brand.colors.paleTeal',
      'site.brand.images.favicon',
      'site.brand.images.ogImage',
    ],
    footnote: 'The share image is what appears when somebody posts a link to this site. Worth setting before you start sharing links, and easy to forget afterwards.',
  },
  {
    id: 'founder',
    title: 'Whose site it is',
    blurb: 'Some sites are a person and some are a company. Switch this off and the founder sections disappear entirely, which is a complete answer rather than an unfinished one.',
    page: 'site',
    keys: [
      'site.show_founder',
      'site.founder_name',
      'site.founder_role',
      'site.founder_expertise',
      'site.brand.images.founderPhoto',
      'site.brand.images.founderPortrait',
    ],
  },
  {
    id: 'modules',
    title: 'What this site does',
    blurb: 'Switch off anything this site is not for. A page that is off is not hidden, it is gone: the address returns Not Found to everybody but you.',
    // The public pages are filled in from whichever registries have a visibility switch, since
    // that list is theirs to decide rather than this file's. The keys below are the parts with no
    // page of their own to be switched from, which is how they came to live on an admin screen
    // nobody could find and half the switches were offered in two places.
    page: 'site',
    keys: [
      'site.show_bookings',
      'site.show_dynamic_pages',
      'site.show_protected_projects',
      'site.show_dashboard',
      'site.show_zoo_game',
      'site.show_scrum_game',
      'site.show_recommendations',
    ],
  },
  {
    id: 'words',
    title: 'The words',
    blurb: 'The opening of each page you have switched on. Everything else on a page is edited from the page itself, with the button in the corner.',
    page: '',
    keys: [],
    footnote: 'There is much more copy on each page than this. These are the pieces somebody reads first.',
  },
];

/** The fields a step asks for, in the order the step names them, dropping any the registry does
 *  not have. A key that has been renamed should cost that box, not the whole step. */
export function fieldsForStep<T extends { key: string }>(step: Step, available: T[]): T[] {
  const byKey = new Map(available.map((f) => [f.key, f]));
  return step.keys.map((k) => byKey.get(k)).filter((f): f is T => Boolean(f));
}

/** The headline pieces of one page: what somebody reads first.
 *
 *  Chosen by shape rather than by a list per page, so a new page needs no edit here. A heading
 *  and the sentence under it are what a visitor sees before they decide to stay. */
export function headlineKeys(page: string, keys: string[]): string[] {
  const wanted = [`${page}.hero.heading`, `${page}.hero.eyebrow`, `${page}.hero.intro`, `${page}.meta.description`];
  const found = wanted.filter((k) => keys.includes(k));
  if (found.length) return found;
  // A page with no hero: take its first two plain entries rather than showing nothing.
  return keys.filter((k) => !k.endsWith('.visible')).slice(0, 2);
}
