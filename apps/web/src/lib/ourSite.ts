// ============= Whose site is this deployment? =============
//
// The App has had this since "/favicon.svg still serves your kanji on her domain": `scripts/lib/
// ourFace.mjs` strips this repository's own marks from any build that is not altogetheragile.com,
// and `shellIdentity.mjs` decides that by comparing the deployment's address with the shipped one.
//
// The Site needs the same thing and did not have it. It matters for anything that is OUR content
// rather than a feature a second site might want: the Scrum board is this practice's own icons,
// its own layout and its own course material, and it has no business appearing under somebody
// else's name whatever their settings happen to say.
//
// A module flag is not the answer here, and trying one is how this was found. `/scrum-on-one-page`
// was gated on `show_zoo_game`, which is false by default - but a site stood up from this one
// starts with a copy of the settings, so hers was true, and the board went out under her brand.
// Her holding page was the only thing covering it. A flag describes what a site WANTS; this
// describes what the content IS.

/** This repository's own site. Matches `SHIPPED.url` in scripts/lib/shellIdentity.mjs. */
export const OUR_SITE = 'https://altogetheragile.com';

/** Whether this deployment is ours. A second site sets NEXT_PUBLIC_SITE_URL.
 *
 *  Reads the environment itself rather than importing `SITE_URL` from seo.tsx: that module reaches
 *  the settings and React's `cache` through two more imports, and a guard about whose site this is
 *  should not need any of it to answer. seo.tsx takes its default address from here, so the address
 *  is written down once. */
export const isOurSite = (): boolean =>
  (process.env.NEXT_PUBLIC_SITE_URL || OUR_SITE).replace(/\/$/, '') === OUR_SITE;
