/** Write a site's palette into an HTML head so the first paint is already the right brand.
 *
 *  The App is client-rendered: it painted the shipped defaults and corrected itself once
 *  site_settings arrived. On altogetheragile.com that is invisible, because the defaults are
 *  its own brand. On any other site it is a flash of somebody else's colours and logo on every
 *  first load, which looks exactly like what it is: a site wearing the wrong clothes.
 *
 *  Insertion is immediately before </head>, which puts the <style> AFTER the stylesheet links.
 *  That ordering is the whole point. index.css carries its own :root block of defaults at the
 *  same specificity, so the later rule is the one that wins. Move this earlier in the head and
 *  the flash comes back silently: the page still renders, just in the wrong colours.
 */
export function withBrand(html, { css, logo } = {}) {
  if (!css || html.includes('id="aa-brand"')) return html;
  let out = html.replace('</head>', `  <style id="aa-brand">:root{${css}}</style>\n  </head>`);
  if (logo && /^https?:\/\//i.test(logo)) {
    out = out.replace('</head>', `  <link rel="preload" as="image" href="${logo}" />\n  </head>`);
  }
  return out;
}
