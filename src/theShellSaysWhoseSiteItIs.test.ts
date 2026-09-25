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
    // One replaceAll of 'AltogetherAgile' misses alt="Altogether Agile" entirely.
    const out = withIdentity(shell, hers);
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

  it('uses her uploaded logo, and ignores a wordmark that is not a URL', () => {
    expect(withIdentity(shell, { ...hers, logo: 'https://cdn.example/logo.svg' })).toContain('https://cdn.example/logo.svg');
    expect(withIdentity(shell, { ...hers, logo: 'Stream Strategy' })).toContain(SHIPPED.logo);
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
