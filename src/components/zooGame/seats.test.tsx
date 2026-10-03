import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { colors } from '@/theme/colors';
import { SEAT, DEV_STACK, devShade } from './seats';
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
  it('are one colour in three shades, not three colours', () => {
    // The board's rule 3: told apart by shade only.
    expect(DEV_STACK.length).toBeGreaterThan(2);
    for (const hex of DEV_STACK) expect(hex, `${hex} is not a teal`).toMatch(/^#0[0-9A-F]/i);
    expect(devShade(0), 'the one at the front is not the lightest').toBe(DEV_STACK[0]);
  });

  it('start the stack again rather than inventing a colour', () => {
    expect(devShade(DEV_STACK.length)).toBe(DEV_STACK[0]);
    expect(devShade(-1), 'a missing Developer picks something off the end of the list').toBe(DEV_STACK[0]);
  });
});

describe('three Developers on a screen', () => {
  // The first version of this file tested the PALETTE and passed while two screens drew all three
  // Developers in one flat teal. Caught by reading the colours off the live page rather than
  // trusting a screenshot: A, B and C all came back rgb(14, 140, 140).
  //
  // So this asks the screens, not the tokens.
  const meetTheTeam = async () => {
    const { render } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');
    const { initialZooState } = await import('./config');
    const { startOnTheBoard } = await import('./engine');
    const { MeetTheTeam } = await import('./MeetTheTeam');
    const state = startOnTheBoard(initialZooState(1) as never);
    return render(<MemoryRouter><MeetTheTeam state={state} onNext={() => {}} /></MemoryRouter>).container;
  };

  const shades = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[style*="background-color"]')]
    .map((n) => n.style.backgroundColor)
    .filter((v) => /rgb\(\s*\d+/.test(v));

  it('are told apart on the seat band, which is where this was spotted', async () => {
    // "Should I see different icons, or?" - with a screenshot of Ada, Ben and Cara in one teal.
    // The band was left on the role's flat colour because it looked like a list of ACCOUNTABILITIES.
    // It is a list of people: three names, three initials, one line each.
    const { render } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');
    const { initialZooState } = await import('./config');
    const { startOnTheBoard } = await import('./engine');
    const { SeatBand } = await import('./SeatBand');
    const state = startOnTheBoard(initialZooState(1) as never);
    const c = render(<MemoryRouter><SeatBand state={state} /></MemoryRouter>).container;
    const devs = shades(c);
    expect(devs.length, 'no Developer on the band carries a shade').toBeGreaterThan(2);
    expect(new Set(devs).size, `the band draws them all in one colour: ${devs.join(', ')}`).toBeGreaterThan(1);
  });

  it('are told apart on Meet the Team', async () => {
    const found = shades(await meetTheTeam());
    const devs = found.filter((v) => /rgb\((9|10|14|5),/.test(v.replace(/\s/g, '')) || /14, 140, 140|10, 109, 109|9, 84, 84/.test(v));
    expect(devs.length, 'no Developer carries a shade of their own').toBeGreaterThan(2);
    expect(new Set(devs).size, `all the Developers are one colour: ${devs.join(', ')}`).toBeGreaterThan(1);
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
