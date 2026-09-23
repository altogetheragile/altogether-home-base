import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// The front door of a freelancer's site.
//
// Measured on the live home page before changing anything: the page is 4,522px tall, both hero
// buttons sat at y≈362 - "Browse Events" and "Knowledge Base" - and the first "Book a Chemistry
// Session" was at y≈2,799. Three and a half screens below the fold.
//
// Both hero buttons were BROWSE actions. That is a training company's front door: catalogue first,
// because the catalogue is the product. A freelancer's product is the person, and the conversion is
// a conversation, so the hero has to offer one.
//
// Source-level rather than rendered, with the copy registry resolved into it first: this page is 380-odd lines of hard-coded marketing copy with
// three data hooks in it, and what is being held here is an editorial rule about what appears in
// the hero, not a rendering behaviour. Rendering it would test react-query and an image loader.

// There is one home page now. There were two: `/` is served by the Next route in apps/web, and
// `src/pages/Home.tsx` was the SPA's near-identical twin of it - same class names, same hero, its
// own copy of every string, rendered to anyone who clicked Home from inside the app. Editing one
// and not the other was the trap this file was written to prevent, and it caught it at least once.
//
// The twin is deleted and the SPA no longer claims the URL, so there is nothing left to keep in
// step. What survives is the editorial rule about what belongs in the hero.
const SOURCES = [
  ['the home page', 'apps/web/src/app/page.tsx', 'STATS'],
] as const;
/** The home page's words live in a registry now, so a source slice alone says `t('home.hero.h1')`
 *  where the heading used to be. Resolving the registry into the slice keeps these assertions
 *  about what a visitor reads rather than about where the string is kept.
 *
 *  Worth knowing what this no longer covers. The registry is the wording the site SHIPS with; an
 *  edit made in Admin lives in `site_copy` and never touches this file, so these rules guard the
 *  default and not the live page. That is the price of copy being editable, and it is the right
 *  trade: a rule in a test cannot be the thing that stops the owner of the site changing his own
 *  heading. */
const registry: Record<string, { value: string }> =
  JSON.parse(readFileSync('apps/web/src/lib/copy/home.json', 'utf8')).entries;

const resolve = (src: string) =>
  src.replace(/\{t\('([A-Za-z0-9.]+)'\)\}/g, (_m, key) => registry[key]?.value ?? '')
     .replace(/\bt\('([A-Za-z0-9.]+)'\)/g, (_m, key) => registry[key]?.value ?? '');

const heroes = () => SOURCES.map(([name, path, marker]) =>
  [name, resolve(readFileSync(path, 'utf8').split(marker)[0])] as const);

describe.each(heroes())('the hero on %s', (_name, hero) => {
  it('offers a way to hire him, not only ways to browse', () => {
    expect(hero, 'the hire-me action is not in the hero').toMatch(/Book a Chemistry Session/);
  });

  it('links that through the flag rather than a hard-coded path', () => {
    // The booking route is behind show_bookings and renders Not Found when it is off, so the href
    // has to follow the flag rather than being a constant.
    expect(hero, 'a hard-coded /book/ link is a dead end whenever bookings are off')
      .toMatch(/href=\{booking(Href|Url)\}/);
    expect(hero).not.toMatch(/(to|href)="\/book\//);
  });

  it('leads with what he sells, not with a slogan any consultancy could run', () => {
    // "Work better together. Accelerate time to value." was the h1. A fine line that says nothing
    // about who is saying it.
    const h1 = hero.match(/aa-hero-h1">([\s\S]*?)<\/h1>/)?.[1] ?? '';
    expect(h1, 'the heading went back to being a slogan').toMatch(/training|coaching/i);
    expect(h1, 'the slogan is back in the heading').not.toMatch(/Accelerate time to value/);
  });

  it('keeps the thing that actually distinguishes him', () => {
    expect(hero).toMatch(/delivered personally/);
  });

  it('keeps a place in the hero for the thing that distinguishes him', () => {
    // This used to assert the words themselves: "25 years", "Co-author of AgilePM3 v2 and
    // AgileBA v3". They are still on the front page of altogetheragile.com, in `site_copy`, which
    // is where they always were for anyone who had edited them.
    //
    // What changed is the value this repository SHIPS. It ships blank now, because a second site
    // built from it was claiming to have trained 1,500 people and to have co-written AgilePM on
    // its first day online. A default cannot be a credential: the whole point of a credential is
    // that it is true of whoever is claiming it.
    //
    // So the editorial rule survives as a rule about the hero rather than about one person's
    // wording: there is a line above the headline for a credential, and a line below it for what
    // the visitor gets, and both are the site's own to fill.
    // Against the raw source: `resolve` substitutes each key for its value, so a resolved hero
    // cannot be asked which keys it reads.
    const raw = readFileSync('apps/web/src/app/page.tsx', 'utf8').split('STATS')[0];
    expect(raw, 'the hero lost its credential line').toMatch(/home\.hero\.eyebrow/);
    expect(raw, 'the hero lost its subtitle').toMatch(/home\.hero\.subtitle/);
  });

  it('ships no credential of its own', () => {
    expect(registry['home.hero.eyebrow'].value.trim(), 'a new site would claim this on day one').toBe('');
    const boast = /\d[\d,]*\s*\+|★|co-author|\d+\s*years?/i;
    const claiming = Object.entries(registry).filter(([, e]) => e.value.trim() && boast.test(e.value));
    expect(claiming.map(([k]) => k), 'shipped as a default, so every new site says it').toEqual([]);
  });
});
