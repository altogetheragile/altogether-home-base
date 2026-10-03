import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { colors } from '@/theme/colors';
import { SEAT, DEV_STACK } from './seats';
import { BOARD_ICONS } from './board/boardIcons';

// One colour per accountability, and the same one the board uses.
//
// `docs/scrum-board/COURSE-AND-BOARD.md` sets the language: Priya orange, Sam plum, the Developers
// a teal stack, the visitors coral. The point of it is that a learner meets the same colours on the
// diagram, in the game and on a lesson card.
//
// The game did not have one. The Scrum Master was sky-600 on the team row and teal-700 on the seat
// band; the Developers were sky-600 in two places and a six-colour rainbow in a third, and that
// rainbow started at #e6842a - an orange within a hair of the Product Owner's. Two accountabilities
// in near enough one colour, on the screens that exist to say who does what.

describe('the four accountabilities', () => {
  it('are four different colours', () => {
    const hexes = Object.values(SEAT).map((s) => s.hex.toLowerCase());
    expect(new Set(hexes).size, `two seats share a colour: ${hexes.join(', ')}`).toBe(4);
  });

  it('wear what the board draws them in', () => {
    // Read off the board's own icons rather than written down twice.
    const fill = (icon: string) => BOARD_ICONS[icon].inner.match(/fill="([^"]+)"/)?.[1] ?? '';
    expect(fill('scrum_master').toUpperCase(), 'the Scrum Master is not the board\'s plum').toBe(SEAT.scrumMaster.hex.toUpperCase());
    expect(fill('stakeholder').toUpperCase(), 'the stakeholders are not the board\'s coral').toBe(SEAT.stakeholders.hex.toUpperCase());
  });

  it('take the Product Owner\'s orange from the brand, so a rebrand moves it', () => {
    // The one of the four that IS a brand colour. Asked of the FILE, not the value: the token
    // package hands out a literal, and what matters is that this one is imported rather than typed
    // - which is exactly what `brandColoursComeFromTokens.test.ts` is checking too.
    const src = readFileSync('src/components/zooGame/seats.ts', 'utf8');
    expect(SEAT.productOwner.hex, 'the Product Owner is not the brand orange').toBe(colors.orange);
    expect(src, 'the orange is written down here instead of imported').not.toContain(colors.orange);
    expect(src, 'it does not come from the token package').toContain("from '@/theme/colors'");
  });
});

describe('several Developers', () => {
  it('are one colour in three shades on the board, not three colours', () => {
    // The board's rule 3, which is about the STACK - several people drawn as one figure, told apart
    // by shade because nothing else is left. Still true of the board's icon; no longer true of how
    // the game draws a person, which is `SEAT.developers.hex` for all of them.
    expect(DEV_STACK.length).toBeGreaterThan(2);
    for (const hex of DEV_STACK) expect(hex, `${hex} is not a teal`).toMatch(/^#0[0-9A-F]/i);
    expect(DEV_STACK[0], 'the one at the front is not the colour a Developer is drawn in')
      .toBe(SEAT.developers.hex);
  });

  it('are the stack the board actually drew', () => {
    const stack = BOARD_ICONS.developers.inner;
    for (const hex of DEV_STACK) {
      expect(stack, `the board's Developers icon has no ${hex} in it`).toContain(`fill="${hex}"`);
    }
  });
});

describe('three Developers on a screen', () => {
  // For a while they were three shades of the stack, one each, so that Ada, Ben and Cara were never
  // drawn as one person. That was the wrong reading of the board's rule 3, which is about a STACK -
  // several people compressed into one figure, where shade is the only thing left to say there is
  // more than one. A list of people is not a stack. Every one of them has their name written beside
  // them, and three teals on top of that said nothing a reader needed: "they should be the same
  // colours - not different shades."
  //
  // So this asks the opposite question now, and asks it of the screens rather than the tokens - the
  // first version of this file tested the PALETTE and passed while two screens disagreed with it.
  const screen = async (name: 'band' | 'team') => {
    const { render } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');
    const { initialZooState } = await import('./config');
    const { startOnTheBoard } = await import('./engine');
    const state = startOnTheBoard(initialZooState(1) as never);
    if (name === 'team') {
      const { MeetTheTeam } = await import('./MeetTheTeam');
      return render(<MemoryRouter><MeetTheTeam state={state} onNext={() => {}} /></MemoryRouter>).container;
    }
    const { SeatBand } = await import('./SeatBand');
    return render(<MemoryRouter><SeatBand state={state} /></MemoryRouter>).container;
  };

  /** Every colour a person on this screen is actually drawn in, as lowercase hex.
   *
   *  Reads inline `background-color` as well as an svg `fill`: a person is the board's figure now,
   *  but was a coloured disc, and a screen that went back to discs should still be checked. */
  const hex = (v: string): string => {
    const rgb = v.match(/rgb\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (rgb) return `#${rgb.slice(1).map((n) => (+n).toString(16).padStart(2, '0')).join('')}`;
    return /^#[0-9a-f]{6}$/i.test(v.trim()) ? v.trim().toLowerCase() : '';
  };
  const colours = (c: HTMLElement) => [
    ...[...c.querySelectorAll<HTMLElement>('[style*="background-color"]')].map((n) => n.style.backgroundColor),
    ...[...c.querySelectorAll('svg [fill]')].map((n) => n.getAttribute('fill') ?? ''),
  ].map(hex).filter(Boolean);
  /** The teals on the screen: every Developer, and nothing else. The other two people are orange
   *  and plum. */
  const devTeals = (c: HTMLElement) => {
    const stack = DEV_STACK.map((s) => s.toLowerCase());
    return colours(c).filter((v) => stack.includes(v));
  };

  for (const where of ['band', 'team'] as const) {
    it(`draws every Developer the same colour on the ${where === 'band' ? 'seat band' : 'Meet the Team cards'}`, async () => {
      const devs = devTeals(await screen(where));
      expect(devs.length, 'no Developer is drawn in a teal at all').toBeGreaterThan(2);
      expect(new Set(devs).size, `the Developers are drawn in ${new Set(devs).size} colours: ${[...new Set(devs)].join(', ')}`)
        .toBe(1);
      expect([...new Set(devs)][0], 'the Developers are not the colour seats.ts says they are')
        .toBe(SEAT.developers.hex.toLowerCase());
    });
  }

  it('leaves the back shades of the stack to the board', async () => {
    // The two darker teals are the board's artwork for several-people-as-one-figure. Nothing in the
    // game should be painting a person with them.
    const back = DEV_STACK.slice(1).map((s) => s.toLowerCase());
    for (const where of ['band', 'team'] as const) {
      const used = colours(await screen(where));
      for (const shade of back) {
        expect(used, `${shade} is on a person on the ${where}, which is a stack shade`)
          .not.toContain(shade);
      }
    }
  });

  it('writes no letter on a Developer where their name is beside them', async () => {
    // "A, B, C on dev's is not needed." A is the first letter of Ada, which is the word next to it.
    for (const where of ['band', 'team'] as const) {
      const c = await screen(where);
      const teal = SEAT.developers.hex.toLowerCase();
      const figures = [...c.querySelectorAll('svg')]
        .filter((s) => [...s.querySelectorAll('[fill]')].some((n) => hex(n.getAttribute('fill') ?? '') === teal));
      expect(figures.length, `no Developer figure found on the ${where}`).toBeGreaterThan(2);
      for (const f of figures) {
        expect(f.querySelector('text'), `a Developer on the ${where} is wearing a letter`).toBeNull();
      }
    }
  });
});

describe('the role colour and the person colour', () => {
  // Three screens have now drawn three people in one flat teal, each time by reaching for the
  // Developers' ROLE colour because it was the obvious thing called `chip`. It is called
  // `groupChip` now, and nothing may use it where a person is being drawn.
  it('are not the same thing, and the names say so', () => {
    expect('chip' in SEAT.developers, 'the trap is back: a name that reads right for a person')
      .toBe(false);
    expect(SEAT.developers.groupChip, 'the Developers have no colour as a role').toBeTruthy();
  });
});

describe('nothing in the game paints a seat for itself', () => {
  // The colours were in four files and disagreed. Anything that wants one asks `seats.ts`.
  const files = readdirSync('src/components/zooGame')
    .filter((f) => f.endsWith('.tsx') && !f.includes('.test.'));

  it('leaves no stray sky or teal on an accountability', () => {
    const stray: string[] = [];
    for (const f of files) {
      const src = readFileSync(`src/components/zooGame/${f}`, 'utf8');
      for (const m of src.matchAll(/^.*\b(bg-sky-\d00|bg-teal-700)\b.*$/gm)) {
        // Only where it is painting a person. "Inspecting" and "Founded on" are not seats, and
        // banning the colour everywhere would be wrong rather than strict.
        if (/scrum_master|scrum master|developer|\bSM\b|\bPO\b|seat/i.test(m[0])) stray.push(`${f}: ${m[0].trim().slice(0, 70)}`);
      }
    }
    expect(stray, `a seat is painted by hand: ${stray.join(' | ')}`).toEqual([]);
  });
});
