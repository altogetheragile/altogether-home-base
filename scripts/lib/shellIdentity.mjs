/** Make the SPA shell say whose site it is.
 *
 *  index.html is one file, built into every site made from this repository. It carries this
 *  site's name, tagline, address, share image, logo and Twitter handle as literal text, and that
 *  head is what a browser reads before a line of JavaScript runs. On altogetheragile.com every
 *  one of those is right. On anybody else's site every one of them is wrong, and two of them are
 *  actively harmful: a canonical link and an og:url pointing at a different domain is the one SEO
 *  mistake that costs the site rather than merely embarrassing it.
 *
 *  Kept apart from prerender.mjs so it can be tested without a build, and so the strings it looks
 *  for live next to the test that checks index.html still contains them. That check matters more
 *  than it sounds: the first version of this replaced a hardcoded address with a hardcoded
 *  address, so every replacement succeeded and nothing changed.
 */

/** What this repository ships as its own identity. Every value appears verbatim in index.html. */
export const SHIPPED = {
  url: 'https://altogetheragile.com',
  company: 'AltogetherAgile',
  /** The same name written the way a person writes it. Two spellings, two replacements: the
   *  logo's alt text uses this one, so a single replaceAll left it behind. */
  companySpaced: 'Altogether Agile',
  tagline:
    'Expert agile coaching, training, and transformation services to help your organization achieve sustainable success through collaborative practices.',
  heroBody:
    'Practical agile training and coaching, grounded in 25 years of real experience. Still delivered personally, every time.',
  logo: '/brand/lockup-horizontal-tight.svg',
  twitter: '@altogetheragile',
};

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Rewrite a shell so it belongs to the site being built.
 *
 *  Every argument is optional and every one of them defaults to leaving the shipped value alone,
 *  because a site that has set nothing should still get a working page rather than a blank one.
 *
 *  @param {string} html            the shell, as Vite emitted it
 *  @param {object} identity
 *  @param {string} identity.url      this deployment's public address, without a trailing slash
 *  @param {string} [identity.company]  what the site calls itself
 *  @param {string} [identity.tagline]  its one-line description
 *  @param {string} [identity.ogImage]  absolute URL of its share image
 *  @param {string} [identity.logo]     absolute URL of an uploaded logo, if it has one
 *  @param {{first: string, second: string, gap: boolean, twoTone: boolean}} [identity.wordmark]
 *         what to set where the logo goes when there is no uploaded one, from wordmarkOf
 */
export function withIdentity(html, { url, company, tagline, ogImage, logo, wordmark } = {}) {
  const site = (url || SHIPPED.url).replace(/\/$/, '');
  // The one question everything else hangs off. Left alone, a site with nothing configured is
  // byte-for-byte what it is today, which is what altogetheragile.com wants.
  const ours = site === SHIPPED.url;
  let out = html;

  // Everything inserted below lands either in an attribute value or in a text node, so all of it
  // is escaped on the way in. The name is the one that bites: it reaches alt="", content="" and
  // <title>, and a company called Bell & "Co" closed the attribute early and took the rest of
  // the tag with it.
  const name = company?.trim() ? escapeHtml(company.trim()) : null;

  if (name) out = out.replaceAll(SHIPPED.company, name).replaceAll(SHIPPED.companySpaced, name);

  if (tagline?.trim()) out = out.replaceAll(SHIPPED.tagline, escapeHtml(tagline.trim()));

  // Before the address, not after: the share image's URL starts with the address, so replacing
  // the address first would leave this looking for a string that is no longer there.
  if (ogImage?.trim()) out = out.replaceAll(`${SHIPPED.url}/og-image.png`, escapeHtml(ogImage.trim()));

  out = out.replaceAll(SHIPPED.url, escapeHtml(site));

  const uploaded = logo?.trim() && /^https?:\/\//i.test(logo.trim()) ? logo.trim() : null;
  if (uploaded) out = out.replaceAll(SHIPPED.logo, escapeHtml(uploaded));

  if (!ours) {
    // A Twitter handle is an account, not a style. There is no setting for one, and guessing is
    // worse than silence: left in place, every share of her site credits ours.
    out = out.replace(/\n?\s*<meta\s+name="twitter:site"[^>]*>/g, '');

    // The hero is a placeholder held up while React boots. Showing somebody else's slogan for
    // that moment is worse than showing the site's own name, so it says whose site this is and
    // nothing more. With no tagline set, the sentence goes rather than being invented.
    out = out.replace(
      /(<h1 class="sh-hero-h1">)[\s\S]*?(<\/h1>)/,
      `$1${name || escapeHtml(SHIPPED.companySpaced)}$2`,
    );
    out = out.replace(
      new RegExp(`(<p[^>]*>)${SHIPPED.heroBody.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(</p>)`),
      tagline?.trim() ? `$1${escapeHtml(tagline.trim())}$2` : '',
    );

    // The header's picture, which is this repository's lockup and stays that until somebody
    // uploads their own. React swaps it for the site's name a moment later, so leaving it means
    // every first load of her site opens with our logo and then corrects itself. The markup below
    // is the same rule SiteLogo renders, written out, so the swap is not visible either.
    if (!uploaded && name) {
      out = out.replace(/<img\s+src="[^"]*lockup-horizontal-tight\.svg"[^>]*>/, markup(name, wordmark));
    }
  }

  return out;
}

/** The header wordmark as static HTML, for the shell that is painted before React exists.
 *
 *  Kept next to the replacement rather than in the brand module because it is markup, not a
 *  rule, and because the shell cannot import TypeScript. The colours are the brand custom
 *  properties withBrand writes into the same head, with this repository's values as the fallback
 *  for the moment before that style is parsed. */
function markup(name, wordmark) {
  const common = "display:inline-flex;align-items:center;height:38px;font-family:'DM Sans',system-ui,sans-serif;font-weight:800;white-space:nowrap";
  const teal = 'var(--aa-deep-teal,#004D4D)';
  if (!wordmark?.twoTone || !wordmark.second) {
    return `<span style="${common};font-size:20px;letter-spacing:-0.02em;color:${teal}">${name}</span>`;
  }
  const first = escapeHtml(wordmark.first);
  const second = escapeHtml(wordmark.second);
  return (
    `<span style="${common};font-size:17px;letter-spacing:0.01em;text-transform:uppercase;color:${teal}">` +
    `${first}${wordmark.gap ? '&nbsp;' : ''}<span style="color:var(--aa-orange,#FF9715)">${second}</span></span>`
  );
}
