import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
// @ts-expect-error - a build script, deliberately plain JS with no types
import { withIdentity, SHIPPED } from '../scripts/lib/shellIdentity.mjs';

/** index.html is built into every site made from this repository, and its head is what a browser
 *  reads before any JavaScript runs. Without this, a second site announces our name in the tab,
 *  our slogan in the first paint, our Twitter account in every share, and our address in its own
 *  canonical link. */
describe('the shell says whose site it is', () => {
  const shell = readFileSync(resolve(__dirname, '../index.html'), 'utf-8');
  const hers = {
    url: 'https://streamstrategy.co.uk',
    company: 'Stream Strategy',
    tagline: 'Coaching for people who lead change.',
    ogImage: 'https://cdn.example/hers.png',
  };

  // The guard that matters most. Every replacement below looks for a literal, and a literal that
  // has drifted out of index.html makes the replacement a silent no-op that still reports
  // success. That is not hypothetical: the address was replaced with itself for weeks, because
  // both sides of the substitution were the same hardcoded string.
  describe('the strings it looks for are really in the shell', () => {
    for (const [name, value] of Object.entries(SHIPPED) as [string, string][]) {
      it(`index.html still contains the shipped ${name}`, () => {
        expect(shell).toContain(value);
      });
    }
  });

  it('leaves our own site exactly as it is', () => {
    // Nothing configured, or configured to what we ship, must not change a byte.
    expect(withIdentity(shell, { url: SHIPPED.url })).toBe(shell);
    expect(withIdentity(shell, {})).toBe(shell);
  });

  it('leaves no trace of us on somebody else’s site', () => {
    const out = withIdentity(shell, { ...hers, logo: 'https://cdn.example/logo.svg' });
    expect(out).not.toContain('altogetheragile');
    expect(out).not.toContain('AltogetherAgile');
    expect(out).not.toContain('Altogether Agile');
  });

  it('points the canonical and og:url at her domain, not ours', () => {
    const out = withIdentity(shell, hers);
    expect(out).toContain('content="https://streamstrategy.co.uk"');
    expect(out).not.toContain('https://altogetheragile.com');
  });

  it('replaces the share image before the address, so it is not left half-rewritten', () => {
    // The shipped image URL starts with the shipped address. Rewrite the address first and this
    // looks for a string that no longer exists, leaving her site sharing our picture.
    const out = withIdentity(shell, hers);
    expect(out).toContain('https://cdn.example/hers.png');
    expect(out).not.toContain('/og-image.png');
  });

  it('gives the share image her domain when she has not uploaded one', () => {
    const out = withIdentity(shell, { url: hers.url, company: hers.company });
    expect(out).toContain('https://streamstrategy.co.uk/og-image.png');
  });

  it('follows the name into the logo’s alt text, which is spelled with a space', () => {
    // One replaceAll of 'AltogetherAgile' misses alt="Altogether Agile" entirely. Checked with an
    // uploaded logo, since that is the case where an <img> survives at all.
    const out = withIdentity(shell, { ...hers, logo: 'https://cdn.example/logo.svg' });
    expect(out).toContain('alt="Stream Strategy"');
  });

  it('drops our Twitter account rather than crediting us on her shares', () => {
    expect(withIdentity(shell, hers)).not.toContain('twitter:site');
    expect(withIdentity(shell, { url: SHIPPED.url })).toContain(SHIPPED.twitter);
  });

  it('puts her name in the first paint instead of our slogan', () => {
    const out = withIdentity(shell, hers);
    expect(out).toContain('>Stream Strategy<');
    expect(out).not.toContain('Work better together.');
    expect(out).toContain('Coaching for people who lead change.');
  });

  it('says nothing rather than inventing a sentence she has not written', () => {
    const out = withIdentity(shell, { url: hers.url, company: hers.company });
    expect(out).not.toContain(SHIPPED.heroBody);
  });

  it('uses her uploaded logo when there is one', () => {
    expect(withIdentity(shell, { ...hers, logo: 'https://cdn.example/logo.svg' })).toContain('https://cdn.example/logo.svg');
  });

  /** The header's picture is this repository's lockup until somebody uploads their own. React
   *  swaps it for the site's name a moment later, so leaving it means every first load of her
   *  site opens with our logo and then corrects itself in front of her visitors. */
  it('sets her name where the logo goes rather than showing ours', () => {
    const out = withIdentity(shell, hers);
    expect(out).not.toContain(SHIPPED.logo);
    expect(out).toContain('>Stream Strategy</span>');
  });

  it('ignores a logo that is a name rather than a picture', () => {
    const out = withIdentity(shell, { ...hers, logo: 'Stream Strategy' });
    expect(out).not.toContain('src="Stream Strategy"');
    expect(out).not.toContain(SHIPPED.logo);
  });

  it('sets the wordmark in two colours when the site asks, and in one when it does not', () => {
    const two = withIdentity(shell, { ...hers, wordmark: { first: 'Stream', second: 'Strategy', gap: false, twoTone: true } });
    expect(two).toContain('text-transform:uppercase');
    expect(two).toContain('var(--aa-orange');
    expect(two).toContain('>Strategy</span>');

    const one = withIdentity(shell, { ...hers, wordmark: { first: 'Stream', second: 'Strategy', gap: false, twoTone: false } });
    expect(one).not.toContain('var(--aa-orange');
  });

  it('keeps the space a two-word name had, and adds none to a name that had not', () => {
    const spaced = withIdentity(shell, { ...hers, company: 'Bramble Fern', wordmark: { first: 'Bramble', second: 'Fern', gap: true, twoTone: true } });
    expect(spaced).toContain('Bramble&nbsp;<span');
    const joined = withIdentity(shell, { ...hers, wordmark: { first: 'Stream', second: 'Strategy', gap: false, twoTone: true } });
    expect(joined).toContain('Stream<span');
  });

  it('leaves our own header picture alone', () => {
    // The shipped site has an uploaded lockup and must keep it.
    expect(withIdentity(shell, { url: SHIPPED.url })).toContain(SHIPPED.logo);
  });

  it('escapes a name that would otherwise break the markup', () => {
    const out = withIdentity(shell, { url: hers.url, company: 'Bell & "Co"' });
    expect(out).toContain('Bell &amp; &quot;Co&quot;');
    expect(out).not.toContain('Bell & "Co"');
  });

  it('is wired into both copies of the shell, and takes its address from the environment', () => {
    const src = readFileSync(resolve(__dirname, '../scripts/prerender.mjs'), 'utf-8');
    // Both: dist/_spa.html answers every route nothing else claims, and the base every
    // prerendered route is built from. Only the second was ever branded.
    expect(src).toContain('brandHead(identityHead(readFileSync');
    expect(src).toContain('let shell = identityHead(before)');
    // The defect this replaces: a const equal to the string it was meant to replace.
    expect(src).toContain('process.env.VITE_SITE_URL');
    expect(src).not.toMatch(/const SITE_URL = 'https:\/\/altogetheragile\.com';/);
  });
});
