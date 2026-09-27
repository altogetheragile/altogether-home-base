import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  orderedSections, HOME_SECTIONS, ABOUT_SECTIONS, SPACES, ACROSS, SIDES,
  type SectionChoice, type ShapeName,
} from '@altogether/ui/editor/sections';
import { shapeClasses } from '@/components/Sections';

// The one thing a commercial builder does that this could not: change the shape of a section.
// Deliberately three questions with a handful of answers rather than a layout editor. A named
// answer cannot overlap two columns or set a card grid to a width nothing fits in.

const css = readFileSync('src/app/globals.css', 'utf8');
const home = readFileSync('src/app/home.css', 'utf8');
const sources = [home, css, readFileSync('src/app/HomeTestimonials.tsx', 'utf8'),
  readFileSync('src/components/AboutSection.tsx', 'utf8')].join('\n');

describe('a section has a shape', () => {
  it('has a rule for every answer it offers', () => {
    // An answer the stylesheet does not define is a dropdown that moves nothing.
    for (const s of SPACES) expect(css, `no rule for ${s.label}`).toContain(`.aa-space--${s.key}`);
    for (const a of ACROSS) expect(css, `no rule for ${a.label}`).toContain(`.aa-across--${a.key}`);
    for (const d of SIDES) expect(css, `no rule for ${d.label}`).toContain(`.aa-side--${d.key}`);
  });

  it('turns choices into classes, and no choice into nothing at all', () => {
    // No classes means no wrapper, which is what keeps an untouched site byte for byte the same.
    expect(shapeClasses({ section: 'stats', visible: true })).toBe('');
    expect(shapeClasses({ section: 'stats', visible: true, space: 'roomy', across: 'four' }))
      .toBe('aa-space--roomy aa-across--four');
    expect(shapeClasses({ section: 'founder', visible: true, band: 'deep', side: 'right' }))
      .toBe('aa-band aa-band--deep aa-side--right');
  });

  it('keeps a shape across a save and drops one that is not on offer', () => {
    const saved = JSON.stringify([
      { section: 'personas', visible: true, space: 'roomy', across: 'four' },
      { section: 'stats', visible: true, space: 'enormous', across: 'nine', side: 'above' },
    ]);
    const got = orderedSections(saved, HOME_SECTIONS);
    const personas = got.find((s) => s.section === 'personas')!;
    expect([personas.space, personas.across]).toEqual(['roomy', 'four']);
    const stats = got.find((s) => s.section === 'stats')!;
    expect([stats.space, stats.across, stats.side]).toEqual([undefined, undefined, undefined]);
  });

  it('offers a control only where the section can honour it', () => {
    // The rule the bands taught: a row in the editor that moves nothing reads as broken.
    const declared: Record<ShapeName, (c: SectionChoice) => boolean> = {
      // Every section pads itself, and all of them now read the multiplier.
      space: () => true,
      // Only the sections built on the shared card grid can change how many fit across.
      across: (c) => ['personas', 'philosophy'].includes(c.key),
      // Only the founder block is a picture beside some words.
      side: (c) => c.key === 'founder',
    };
    for (const list of [HOME_SECTIONS, ABOUT_SECTIONS]) {
      for (const c of list) {
        const shape = c.shape ?? [];
        for (const what of ['space', 'across', 'side'] as ShapeName[]) {
          expect(shape.includes(what), `${c.key} offers ${what} but cannot honour it`)
            .toBe(declared[what](c));
        }
      }
    }
  });

  it('falls back to what the section already did, everywhere it reads a shape', () => {
    // A bare var() would flatten every section to one padding the moment nobody chose anything.
    const bare = sources.match(/var\(--aa-(?:space|across)\)/g);
    expect(bare, `a shape variable with no fallback: ${bare?.join(', ')}`).toBeNull();
  });

  it('measures space as a multiplier, so each section keeps its own proportions', () => {
    // 64px, 56px, 40px and 96px are four deliberate paddings. One shared value would lose all four.
    expect(home).toContain('calc(var(--aa-space, 1) * 64px)');
    expect(home).toContain('calc(var(--aa-space, 1) * 40px)');
  });

  it('gives the number of columns the control promises', () => {
    // The first attempt said it as a smallest card width, and a row fits as many as it can: at
    // 1280px a 260px minimum fitted four, so "3 across" produced four. Found by rendering it.
    for (const [key, n] of [['two', 2], ['three', 3], ['four', 4]] as const) {
      expect(css, `${key} does not set ${n} columns`)
        .toContain(`.aa-across--${key} .aa-cards { grid-template-columns: repeat(${n}, minmax(0, 1fr)); }`);
    }
  });

  it('narrows the number on a small screen rather than squeezing the cards', () => {
    // Three or four cards in the width of a tablet is four or five words to a line.
    const tablet = css.slice(css.indexOf('@media (min-width: 768px) and (max-width: 1099px)'));
    expect(tablet).toContain('.aa-across--four .aa-cards');
    expect(tablet.slice(0, 400)).toContain('repeat(2, minmax(0, 1fr))');
  });

  it('swaps the picture and the words only where there are sides to swap', () => {
    // In one column there are no sides, and putting the picture below the words there would be a
    // different decision made by accident.
    const rule = css.slice(css.indexOf('.aa-side--right'));
    expect(css.slice(0, css.indexOf('.aa-side--right'))).toContain('@media (min-width: 768px)');
    expect(rule).toContain('order: 2');
  });
});
