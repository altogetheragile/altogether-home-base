import { SITE_URL } from '@/config/featureFlags';

// ============= Whose site is this deployment? =============
//
// The App's half of apps/web/src/lib/ourSite.ts. Written twice because the two apps cannot import
// from each other; both compare this deployment's address with altogetheragile.com.
//
// It matters wherever a fallback is this repository's own identity: the lockup in the header, the
// name in a tab title, the company in the footer. Those are right on altogetheragile.com and wrong
// on a site that simply has not said what it is called yet.

export const OUR_SITE = 'https://altogetheragile.com';

export const isOurSite = (): boolean => SITE_URL.replace(/\/$/, '') === OUR_SITE;

/** What to call this site when it has not said: its own name, ours on our site, or else its own
 *  address, the one name it certainly has. Never null, for places that need some words. */
export function siteNameOr(companyName?: string | null): string {
  const name = companyName?.trim();
  if (name) return name;
  if (isOurSite()) return 'Altogether Agile';
  try {
    return new URL(SITE_URL).host.replace(/^www\./, '');
  } catch {
    return 'Home';
  }
}

/** The name a logo falls back to: as above, except that on our own site an unnamed logo is our
 *  lockup, which is what logoOf draws when it is given no name. */
export const logoNameOr = (companyName?: string | null): string | null =>
  companyName?.trim() || (isOurSite() ? null : siteNameOr(null));
