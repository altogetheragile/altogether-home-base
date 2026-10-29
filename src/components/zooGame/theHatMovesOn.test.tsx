import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { initialZooState } from './config';
import { joinTeam, startNextSprint, cancelSprint, speaking } from './engine';
import { seatLines } from './header';
import { mayTake, refusal, withTheHat } from './seatRules';
import { SeatBand } from './SeatBand';
import { YouContext } from './you';
import type { ZooGameState } from './types';

// The Scrum Master is a hat, not a seat. In a shared game one of the Developers wears it, the first
// player to join wears it first, and it moves on at each Sprint Planning so everybody holds it
// (Al, 29 Oct 2026; docs/ZOO_EVERYONE_A_DEVELOPER.md).

/** A shared game as it starts: no Developers until people arrive, then three of them. */
const table = (): ZooGameState => {
  const base = initialZooState(5);
  const empty = { ...base, team: { ...base.team, developers: [] } } as ZooGameState;
  return joinTeam(joinTeam(joinTeam(empty, 'p-ann', 'Ann'), 'p-bo', 'Bo'), 'p-cy', 'Cy');
};
const retro = (s: ZooGameState): ZooGameState => ({ ...s, phase: 'retro' } as ZooGameState);
const sprinting = (s: ZooGameState): ZooGameState => ({ ...s, phase: 'sprint', dayStage: 'building' } as ZooGameState);

describe('the Scrum Master hat', () => {
  it('goes first to the first player to join', () => {
    expect(table().scrumMasterId).toBe('p-ann');
  });

  it('moves along at each Sprint Planning, in the order they joined, and comes round again', () => {
    const holders: (string | undefined)[] = [];
    let s = table();
    for (let i = 0; i < 4; i++) {
      s = startNextSprint(retro(s), '');
      holders.push(s.scrumMasterId);
    }
    expect(holders).toEqual(['p-bo', 'p-cy', 'p-ann', 'p-bo']);
  });

  it('moves along when a Sprint is cancelled too, because a new Sprint Planning starts', () => {
    expect(cancelSprint(sprinting(table())).scrumMasterId).toBe('p-bo');
  });

  it('is never worn playing alone, where you are the Scrum Master throughout', () => {
    const solo = initialZooState(5);
    expect(solo.scrumMasterId).toBeUndefined();
    expect(startNextSprint(retro(solo), '').scrumMasterId).toBeUndefined();
  });

  it('makes the impediment call the holder’s, and tells anybody else who to ask', () => {
    const s = table();
    const ann = withTheHat({ seat: 'developer', memberId: 'p-ann' }, s);
    const bo = withTheHat({ seat: 'developer', memberId: 'p-bo' }, s);
    expect(mayTake('ANSWER_IMPEDIMENT', ann).allowed).toBe(true);
    const no = mayTake('ANSWER_IMPEDIMENT', bo);
    expect(no.allowed).toBe(false);
    expect(refusal(no)).toMatch(/Ann holds the Scrum Master hat this Sprint/);
  });

  it('is the holder’s whatever the empty Scrum Master seat would have said', () => {
    const ctx = withTheHat({ seat: 'product_owner', memberId: 'p-ann', emptySeats: ['scrum_master'] }, table());
    expect(mayTake('ANSWER_IMPEDIMENT', ctx).allowed).toBe(true);
  });

  it('speaks as the holder, not as Sam', () => {
    expect(speaking(table(), 'scrum_master').from).toBe('Ann');
  });

  it('shows on the strip as a badge on a Developer, with no Sam beside them', () => {
    const s = table();
    const lines = seatLines(s);
    expect(lines.some((l) => l.role === 'scrum_master'), 'Sam is still on the strip').toBe(false);
    expect(lines.filter((l) => l.hat).map((l) => l.name)).toEqual(['Ann']);
    const band = render(<YouContext.Provider value="p-bo"><SeatBand state={s} seat="developer" /></YouContext.Provider>).container;
    const badged = [...band.querySelectorAll('[data-part="seat"]')].filter((el) => el.querySelector('[data-part="seat-hat"]'));
    expect(badged.map((el) => el.textContent)).toEqual([expect.stringMatching(/^Ann/)]);
  });

  it('leaves Sam on the strip playing alone', () => {
    expect(seatLines(initialZooState(5)).some((l) => l.role === 'scrum_master')).toBe(true);
  });
});

describe('the strip in a shared game', () => {
  it('marks only your own Developer as you, and only your own name can be changed', () => {
    const band = render(<YouContext.Provider value="p-bo"><SeatBand state={table()} seat="developer" onRename={() => {}} /></YouContext.Provider>).container;
    const yours = [...band.querySelectorAll('[data-part="seat"]')].filter((el) => el.querySelector('[data-part="seat-you"]'));
    expect(yours.map((el) => el.textContent)).toEqual([expect.stringMatching(/^Bo/)]);
    expect(band.querySelectorAll('[data-part="rename-me"]')).toHaveLength(1);
  });
});
