import { describe, it, expect } from 'vitest';
import { pointTheIconAt, removeTheIcon, iconType } from './tabIcon';
import { rewritesFor, SHIPPED_SITE_HOST } from '../../vercel';
import { SITE_OWNED } from '@/config/siteOwnedRoutes';

// "I re-uploaded the favicon image but it has not changed", and half of that was true. The Site's
// pages are rendered per request and picked the new icon up at once. Every page this app answers
// carried whatever the prerenderer had built into the shell at the last deploy, so no amount of
// uploading could move it.

const withHead = (html: string) => {
  const doc = document.implementation.createHTMLDocument('t');
  doc.head.innerHTML = html;
  return doc;
};
const icons = (doc: Document) =>
  [...doc.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')]
    .map((l) => ({ href: l.getAttribute('href'), type: l.getAttribute('type') }));

describe('the icon follows the editor', () => {
  it('repoints the icon the shell was built with', () => {
    const doc = withHead('<link rel="icon" type="image/svg+xml" href="/favicon.svg">');
    expect(pointTheIconAt(doc, 'https://cdn.example/hers.ico')).toBe(true);
    expect(icons(doc)).toEqual([{ href: 'https://cdn.example/hers.ico', type: 'image/x-icon' }]);
  });

  it('corrects the type, rather than announcing an .ico as an SVG', () => {
    // The shell's type is this repository's, because its own icon is an SVG. Left in place it
    // tells a browser to expect something the file is not, which is a reason to skip it.
    const doc = withHead('<link rel="icon" type="image/svg+xml" href="/favicon.svg">');
    pointTheIconAt(doc, 'https://cdn.example/hers.png');
    expect(icons(doc)[0].type).toBe('image/png');
  });

  it('says nothing about a type it cannot name', () => {
    const doc = withHead('<link rel="icon" type="image/svg+xml" href="/favicon.svg">');
    pointTheIconAt(doc, 'https://cdn.example/icon');
    expect(icons(doc)[0].type).toBeNull();
    expect(iconType('https://cdn.example/icon')).toBeNull();
  });

  it('reads the extension through a query string', () => {
    expect(iconType('https://cdn.example/a.png?v=2')).toBe('image/png');
    expect(iconType('https://cdn.example/a.SVG')).toBe('image/svg+xml');
  });

  it('moves every icon link, not only the first', () => {
    // The Site emits rel="icon" and rel="shortcut icon". One left behind is one a browser may use.
    const doc = withHead('<link rel="shortcut icon" href="/a.svg"><link rel="icon" href="/a.svg">');
    pointTheIconAt(doc, 'https://cdn.example/b.ico');
    expect(icons(doc).every((i) => i.href === 'https://cdn.example/b.ico')).toBe(true);
  });

  it('adds one when the shell carries none', () => {
    // A site that has not chosen an icon gets no link in its shell at all. Choosing one later
    // should not need a deploy to show up.
    const doc = withHead('');
    pointTheIconAt(doc, 'https://cdn.example/new.png');
    expect(icons(doc)).toEqual([{ href: 'https://cdn.example/new.png', type: 'image/png' }]);
  });

  it('leaves the document alone when nothing has been chosen', () => {
    // Not a reason to delete this site's own icon, and never a reason to invent one.
    const doc = withHead('<link rel="icon" type="image/svg+xml" href="/favicon.svg">');
    expect(pointTheIconAt(doc, '')).toBe(false);
    expect(icons(doc)).toEqual([{ href: '/favicon.svg', type: 'image/svg+xml' }]);
  });

  it('does not rewrite an href that is already right', () => {
    // Writing the same href makes some browsers fetch the file again, once per render.
    const doc = withHead('<link rel="icon" href="https://cdn.example/same.png" type="image/png">');
    const before = doc.head.innerHTML;
    pointTheIconAt(doc, 'https://cdn.example/same.png');
    expect(doc.head.innerHTML).toBe(before);
  });
});

describe('an icon taken away is taken away', () => {
  it('removes every link the shell was built with', () => {
    // Setting one could already be followed at runtime. Removing one could not: the shell's link
    // is built in at deploy time, so an icon taken out in the editor went on showing on every
    // page this app serves until something deployed. Reported as "I removed the favicon image...
    // I still see the AA favicon".
    const doc = withHead('<link rel="shortcut icon" href="/a.svg"><link rel="icon" href="/a.svg">');
    expect(removeTheIcon(doc)).toBe(2);
    expect(icons(doc)).toEqual([]);
  });

  it('says how many it took, so nothing to do is not mistaken for doing nothing', () => {
    expect(removeTheIcon(withHead(''))).toBe(0);
  });
});

describe('the icon a browser asks for without being told', () => {
  it('is answered by the Site rather than by the app shell', () => {
    // It fell through to the catch-all and answered 200 with a page of HTML. A browser can tell
    // nothing from a success that is not an icon.
    const rule = rewritesFor(SHIPPED_SITE_HOST).find((r) => r.source === '/favicon.ico');
    expect(rule, '/favicon.ico is not routed anywhere').toBeTruthy();
    expect(rule!.destination).toContain('/site-icon');
  });

  it('follows a second site to its own deployment', () => {
    const rule = rewritesFor('hers.vercel.app').find((r) => r.source === '/favicon.ico');
    expect(rule!.destination).toBe('https://hers.vercel.app/site-icon');
  });

  it('is listed as a URL the Site owns, so the App never claims it', () => {
    expect(SITE_OWNED).toContain('/favicon.ico');
  });
});
