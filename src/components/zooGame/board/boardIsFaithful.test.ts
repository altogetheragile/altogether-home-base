import { describe, it, expect } from 'vitest';
import { drawBoard } from './boardDrawing.generated.js';
import { BOARD_INPUTS, BOARD_OUTPUTS, BOARD_DESC } from './boardLabels';
import { BOARD_PAGES, pageById } from './boardPages';
import { BOARD_ICONS } from './boardIcons';

// The board, and the design file it was lifted out of.
//
// `docs/scrum-board/scrum-big-picture.html` decides the layout: two hundred lines of hand-tuned
// coordinates. They were not re-derived in JSX - the park's own notes record nine occasions when
// two drawings of one thing disagreed, and a third would have been the tenth. The drawing comes
// across whole, by `scripts/scrumBoard/import.mjs`, and `--check` in CI keeps it in step.
//
// What that check cannot tell you is whether the lifted code still DRAWS the same board. Compared
// through the DOM against the design file, it does: 60,922 characters of markup, identical. These
// are the parts of that worth holding on every run, without a browser.

const board = () => drawBoard({ INPUTS: BOARD_INPUTS, OUTPUTS: BOARD_OUTPUTS, DESC: BOARD_DESC });

describe('the board draws', () => {
  it('at the size the design file draws it', () => {
    expect(board().height, 'the board has changed height, so the layout has moved').toBe(1080);
  });

  it('a whole board, not a fragment', () => {
    const { svg } = board();
    expect(svg.length, 'the markup is a fraction of what it was').toBeGreaterThan(55000);
    expect(svg, 'the Sprint bar is gone').toContain('SPRINT');
    expect(svg, 'the values wheel is gone').toContain('Scrum');
  });
});

describe('every link on the board', () => {
  // A board whose icons open nothing is a picture. These ids are written in four places - the
  // chips, the legend, the event rows and the cross-links inside the pages - and a typo in any of
  // them is a dead end a learner finds before anybody else does.
  const idsOnTheBoard = () => [...board().svg.matchAll(/data-id="([a-z-]+)"/g)].map((m) => m[1]);

  it('opens a page that exists', () => {
    const missing = [...new Set(idsOnTheBoard())].filter((id) => !pageById(id));
    expect(missing, `the board points at pages that are not there: ${missing.join(', ')}`).toEqual([]);
  });

  it('is actually there to be clicked', () => {
    expect(new Set(idsOnTheBoard()).size, 'the board has almost nothing to open').toBeGreaterThan(15);
  });
});

describe('the reference pages', () => {
  it('came across whole', () => {
    expect(BOARD_PAGES.length, 'pages went missing in the import').toBe(28);
    for (const p of BOARD_PAGES) {
      expect(p.title, `${p.id} has no title`).toBeTruthy();
      expect(p.lede, `${p.id} has no lede`).toBeTruthy();
    }
  });

  it('do not cross-link to pages that are not there', () => {
    // The bodies carry <a href='#id'> into each other, and `rel` lists what to read next.
    const bad: string[] = [];
    for (const p of BOARD_PAGES) {
      for (const r of p.rel) if (!pageById(r)) bad.push(`${p.id} -> ${r}`);
      for (const [, body] of p.secs) {
        for (const m of body.matchAll(/href='#([a-z-]+)'/g)) if (!pageById(m[1])) bad.push(`${p.id} -> ${m[1]}`);
      }
    }
    expect(bad, `dead cross-links: ${bad.join(', ')}`).toEqual([]);
  });
});

describe('the icons', () => {
  it('all came across, with a box to draw in', () => {
    expect(Object.keys(BOARD_ICONS).length).toBe(20);
    for (const [id, i] of Object.entries(BOARD_ICONS)) {
      expect(i.box, `${id} has no viewBox`).toMatch(/^[-0-9. ]+$/);
      expect(i.inner.length, `${id} is empty`).toBeGreaterThan(20);
    }
  });

  it('draw no outlines on the figures, which is the rule that keeps being broken', () => {
    for (const id of ['product_owner', 'scrum_master', 'developers', 'scrum_team', 'stakeholder']) {
      expect(BOARD_ICONS[id].inner, `${id} has a stroke on it`).not.toMatch(/stroke="(?!none)/);
    }
  });

  it('show several people in one role as a stack, including inside the Scrum Team', () => {
    // developers.svg always did. scrum_team.svg drew the Developers as one figure, which is the
    // one thing the audit of the pack turned up.
    const heads = (id: string) => (BOARD_ICONS[id].inner.match(/<circle/g) ?? []).length;
    expect(heads('developers'), 'the Developers are not a stack of three').toBe(3);
    expect(heads('scrum_team'), 'the Scrum Team is three figures, not PO + stack + SM').toBe(5);
  });
});
