import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { tint } from '@altogether/ui/brand';

// Two things about a card: how wide it is, and what colour.
//
// The grids were fixed counts - three personas, two philosophy cards - so the next one dropped
// onto a row of its own at a third or half the width of the ones above it. That reads as a
// mistake rather than a choice.
//
// And the colours were a hardcoded pair per card, taken by position. Two values, kept in step by
// hand, which only ever goes wrong in one direction: somebody changes the strong one and forgets
// the pale one.

describe('cards share the width', () => {
  const globals = readFileSync('src/app/globals.css', 'utf8');
  const home = readFileSync('src/app/page.tsx', 'utf8');
  const about = readFileSync('src/app/about/page.tsx', 'utf8');

  it('lets however many there are share a row', () => {
    expect(globals).toMatch(/\.aa-cards\s*\{[^}]*auto-fit/s);
    expect(globals).toMatch(/minmax\(var\(--aa-card-min/);
  });

  it('uses it for the lists somebody can add to', () => {
    expect(home, 'the persona cards still use a fixed count').toMatch(/className="aa-cards"/);
    expect(about, 'the philosophy cards still use a fixed count').toMatch(/className="aa-cards"/);
  });

  it('gives one card per row on a phone, whatever the minimum says', () => {
    // Read the phone block and look inside it, rather than trying to match across braces.
    const phone = globals.slice(globals.indexOf('@media (max-width: 767px)'));
    const block = phone.slice(0, phone.indexOf('\n}'));
    expect(block, 'a card could still be squeezed on a phone').toMatch(/\.aa-cards\s*\{[^}]*grid-template-columns:\s*1fr/);
  });
});

describe('one colour per card, not two', () => {
  it('mixes the pale version from the strong one', () => {
    expect(tint('#1A9090')).toBe('#e4f2f2');
    expect(tint('#000000')).toBe('#e0e0e0');
    expect(tint('#ffffff')).toBe('#ffffff');
  });

  it('takes a colour with or without its hash, and leaves nonsense alone', () => {
    expect(tint('1A9090')).toBe('#e4f2f2');
    for (const bad of ['', 'teal', '#12', 'rgb(1,2,3)']) expect(tint(bad)).toBe(bad);
  });

  it('gets paler as the strength drops', () => {
    // A weaker mix means more white, so every channel rises.
    const strong = tint('#1A9090', 0.5);
    const weak = tint('#1A9090', 0.05);
    expect(parseInt(weak.slice(1, 3), 16)).toBeGreaterThan(parseInt(strong.slice(1, 3), 16));
  });
});
