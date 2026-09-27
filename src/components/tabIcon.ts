
// ============= The tab icon, from the database rather than from the last deploy =============
//
// The shell carries an icon, and it is written into the shell by the prerenderer at deploy time.
// That made changing it in the editor look broken: the Site's pages picked a new one up at once,
// because they are rendered per request, and every page this app answers went on showing whatever
// had been built in. A second upload, a third, and still the old icon - reported as "I re-uploaded
// the favicon image but it has not changed", which was true of half the site.
//
// So the app sets it too, from the settings it has already fetched for the header and the brand.
// The shell's icon is what shows until those arrive, which is right: it is this site's icon on
// this site, and nothing at all on a site that has not chosen one.

/** The media type of an icon, from its address. Nothing when it is not one we can name, because
 *  a browser will sniff the file, and being told the wrong type can make it skip the icon. */
export function iconType(url: string): string | null {
  const ext = url.split('?')[0].split('#')[0].toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  const types: Record<string, string> = {
    svg: 'image/svg+xml', png: 'image/png', ico: 'image/x-icon',
    gif: 'image/gif', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
  };
  return (ext && types[ext]) || null;
}

/** Points every icon link at `href`, or leaves the document alone when there is nothing to point
 *  at. Separate from the component so it can be tested without a query client. */
export function pointTheIconAt(doc: Document, href: string): boolean {
  if (!href.trim()) return false;
  const links = [...doc.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')];
  const type = iconType(href);

  if (links.length === 0) {
    const link = doc.createElement('link');
    link.setAttribute('rel', 'icon');
    links.push(link);
    doc.head.appendChild(link);
  }

  for (const link of links) {
    // Only when it differs: writing the same href again makes some browsers re-fetch the file
    // on every render, which is a request per navigation for no change at all.
    if (link.getAttribute('href') === href) continue;
    link.setAttribute('href', href);
    if (type) link.setAttribute('type', type);
    else link.removeAttribute('type');
  }
  return true;
}
