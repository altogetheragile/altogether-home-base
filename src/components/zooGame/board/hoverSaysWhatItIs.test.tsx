import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ScrumBoard } from './ScrumBoard';
import { drawBoard } from './boardDrawing.generated.js';
import { BOARD_INPUTS, BOARD_OUTPUTS, BOARD_DESC, BOARD_NAMES } from './boardLabels';

// What a shape on the board says it is, when you point at it.
//
// The board is almost wordless on purpose - the design note's rule 9 - so the hover label is the
// only thing naming most of it. Asked for after it shipped without one: "if I hover over the DoD
// diamond I get a 'Definition of Done' label".
//
// Building it turned up a fault in the labels themselves. A chip's text carries a `|` where it
// wraps onto a second line, and the drawing turned the FIRST one into ": " as though a wrap were
// always a name and a qualifier after it. True of "Product Backlog|Goal + PBIs". Not true of
// "Definition|of Done", which is one name - so the gem announced itself as "Definition", with "of
// Done" underneath it.

const board = () => drawBoard({ INPUTS: BOARD_INPUTS, OUTPUTS: BOARD_OUTPUTS, DESC: BOARD_DESC });

/** Everything on the board, and what it says it is. */
const labels = () => [...board().svg.matchAll(/data-id="([a-z-]+)"[^>]*aria-label="([^"]*)"|aria-label="([^"]*)"[^>]*data-id="([a-z-]+)"/g)]
  .map((m) => m[2] ?? m[3]).filter(Boolean) as string[];

describe('the label on a shape', () => {
  it('is there on every one of them', () => {
    const shapes = (board().svg.match(/data-id="/g) ?? []).length;
    const named = labels().filter((l) => l.trim().length > 1).length;
    expect(shapes, 'nothing on the board can be pointed at').toBeGreaterThan(40);
    expect(named, `${shapes - named} shapes have nothing to say`).toBe(shapes);
  });

  it('names the Definition of Done in full', () => {
    // The one that was reported. "Definition: of Done" split a name down the middle.
    const dod = labels().filter((l) => /Definition/.test(l));
    expect(dod.length, 'the Definition of Done is not on the board').toBeGreaterThan(0);
    for (const l of dod) {
      expect(l, `a shape calls itself "${l}"`).not.toMatch(/^Definition: /);
      expect(l.split(': ')[0], 'the name is still broken across the colon').toBe('Definition of Done');
    }
  });

  it('never breaks a name across the colon, whatever the board does to fit it', () => {
    // The colon separates a name from what qualifies it. Anything after it that begins in lower
    // case is the back half of a sentence, not a qualifier - which is what went wrong.
    const bad = labels().filter((l) => {
      const [name, sub] = l.split(': ');
      return sub && Object.values(BOARD_NAMES).some((n) => n.startsWith(`${name} `));
    });
    expect(bad, `a name is split across the colon: ${bad.join(' | ')}`).toEqual([]);
  });
});

describe('pointing at something', () => {
  const hover = (c: HTMLElement, id: string) => {
    const a = c.querySelector(`a[data-id="${id}"]`);
    expect(a, `there is nothing on the board for ${id}`).toBeTruthy();
    fireEvent.mouseOver(a!, { bubbles: true });
    return c.querySelector('[data-part="board-tip"]')?.textContent ?? '';
  };

  it('shows what it is', () => {
    const c = render(<ScrumBoard />).container;
    expect(hover(c, 'definition-of-done'), 'the gem says nothing when pointed at').toBe('Definition of Done');
  });

  it('shows the qualifier under the name, rather than beside it', () => {
    const c = render(<ScrumBoard />).container;
    const said = hover(c, 'product-backlog');
    expect(said, 'the name is missing').toContain('Product Backlog');
    expect(said, 'what qualifies it is missing').toContain('Goal + PBIs');
  });

  it('takes the label away again', () => {
    const c = render(<ScrumBoard />).container;
    hover(c, 'increment');
    expect(c.querySelector('[data-part="board-tip"]')).toBeTruthy();
    fireEvent.mouseLeave(c.querySelector('[data-part="scrum-board"]')!);
    expect(c.querySelector('[data-part="board-tip"]'), 'the label stays up after the pointer leaves').toBeNull();
  });
});
