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

// BOTH home pages. `/` is served by the Next route in apps/web, and `src/pages/Home.tsx` is the
// SPA's near-identical twin of it - same class names, same hero, its own copy of every string.
// Editing one and not the other is the trap this file exists to prevent: the change that matters
// to a visitor is the Next one, and the change that is easiest to make is the other.
const SOURCES = [
  ['the Next home page (this is the one that is served)', 'apps/web/src/app/page.tsx', 'STATS'],
  ['the SPA home page', 'src/pages/Home.tsx', 'STATS BAR'],
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
    expect(hero).toMatch(/25 years/);
    expect(hero).toMatch(/delivered personally/);
  });

  it('says he co-wrote the frameworks he teaches', () => {
    expect(hero, 'the credential is not on the front page')
      .toMatch(/Co-author of AgilePM3 v2 and AgileBA v3/);
  });
});
