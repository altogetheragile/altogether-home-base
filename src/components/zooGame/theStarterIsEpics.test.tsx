import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SplitEpicPanel } from './Board';
import { initialZooState, starterBacklog, DEFAULT_BRIEF } from './config';
import { writeBacklog, splitEpic, startOnTheBoard } from './engine';
import { reducer } from './useZooGame';
import type { BacklogItem, ZooGameState } from './types';

// The Product Owner's starter, as Al described it: "refine enough stories to start a PBL based upon
// a starter from the PO - epics for the zoo zones". An epic for each area, and one for the park's
// own pieces. Nothing arrives ready to build, so splitting it is the team's first Refinement.
//
// The first area used to arrive refined - its habitat and its animal, sized - which skipped the
// part of Refinement a newcomer most needs to do: turning something too big into something small
// enough to start.

const blank = (): ZooGameState => ({ ...initialZooState(1), backlog: [] } as ZooGameState);
const epics = (brief = DEFAULT_BRIEF) => writeBacklog(blank(), brief).backlog;

/** Every item a Product Backlog could ever hold once everything in it has been split. */
function splitAll(state: ZooGameState): BacklogItem[] {
  let s = state;
  for (const e of state.backlog.filter((it) => it.category === 'epic')) {
    s = splitEpic(s, e.id, (e.epicMembers ?? []).map((m) => m.id));
  }
  return s.backlog;
}

describe('the whole flow\'s starter', () => {
  it('is epics, and nothing in it is ready to build', () => {
    const ready = epics().filter((it) => it.category !== 'epic' && it.category !== 'need');
    expect(ready.map((it) => it.name), 'these arrived refined').toEqual([]);
    // A need is not refined either: nobody has decided what the work is.
    expect(epics().every((it) => it.unsized), 'something arrived sized').toBe(true);
  });

  it('has an epic for each area the Scrum Team asked for, the first area first', () => {
    const backlog = epics({ zones: ['Big Cats', 'Savanna', 'Forest'], audience: 'families', firstZone: 'Savanna' });
    const areas = backlog.filter((it) => it.category === 'epic' && !['Grounds', 'Facilities'].includes(it.zone));
    expect(areas.map((it) => it.zone)).toEqual(['Savanna', 'Big Cats', 'Forest']);
    expect(backlog[0].zone, 'the area opened first is not at the top').toBe('Savanna');
  });

  it('keeps the animal each area opens with', () => {
    // The refined starter handed the lion over on its own, so Big Cats' list never had it in.
    const bigCats = epics().find((it) => it.id === 'bigcats');
    expect(bigCats?.epicMembers?.map((m) => m.id)).toContain('lion');
    const lion = bigCats?.epicMembers?.find((m) => m.id === 'lion');
    expect(lion?.enclosureId).toBe('lion-enc');
  });

  it('makes the park\'s own pieces an epic of their own, the pathways and the bridge among them', () => {
    const grounds = epics().find((it) => it.id === 'grounds');
    expect(grounds?.category).toBe('epic');
    expect(grounds?.epicMembers?.map((m) => m.name)).toEqual(expect.arrayContaining(['Main Pathways', 'Bridge']));
    // ...and split, they are the same items the refined starter hands over.
    const split = splitAll(writeBacklog(blank(), DEFAULT_BRIEF));
    expect(split.find((it) => it.id === 'paths')?.category).toBe('path');
    expect(split.find((it) => it.id === 'bridge')?.template).toBe('bridge');
  });

  it('can be split into everything the refined starter hands over', () => {
    // Two starters, one zoo. Whatever the board preset arrives with, the whole flow can reach.
    const reachable = new Set(splitAll(writeBacklog(blank(), DEFAULT_BRIEF)).map((it) => it.id));
    const missing = starterBacklog(DEFAULT_BRIEF, { firstAreaRefined: true })
      .filter((it) => it.category !== 'epic' && !reachable.has(it.id))
      .map((it) => it.name);
    expect(missing, 'the whole flow can never build these').toEqual([]);
  });

  it('asks only questions the game can answer', () => {
    for (const it of epics()) expect(it.acceptance.length, `${it.name} has no criteria`).toBeGreaterThan(0);
  });

  it('is what a new game gets', () => {
    let s = reducer(initialZooState(1), { type: 'START_FROM_THE_BRIEF' });
    s = reducer(s, { type: 'WRITE_BACKLOG', brief: DEFAULT_BRIEF });
    expect(s.phase).toBe('refine');
    expect(s.backlog.find((it) => it.id === 'lion-enc'), 'the lion\'s habitat arrived ready to build').toBeUndefined();
  });
});

describe('starting on the board', () => {
  it('still arrives with the first area refined, because it skips Refinement', () => {
    const s = startOnTheBoard(blank());
    expect(s.backlog.find((it) => it.id === 'lion-enc')?.category).toBe('enclosure');
  });
});

describe('splitting the park\'s own pieces', () => {
  it('says what each piece comes out as, not that a bridge is a facility', () => {
    // Every piece that was not an animal was labelled "facility", and the panel opened by explaining
    // how each animal becomes an enclosure - over a list with no animals in it.
    const grounds = epics().find((it) => it.id === 'grounds')!;
    const { container } = render(<SplitEpicPanel epic={grounds} onSplit={() => {}} />);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/Each animal becomes/);
    expect(text).not.toMatch(/facility/);
    expect(text).toMatch(/pathway/);
    expect(text).toMatch(/scenery/);
  });

  it('still explains the habitat to an area of animals', () => {
    const bigCats = epics().find((it) => it.id === 'bigcats')!;
    const { container } = render(<SplitEpicPanel epic={bigCats} onSplit={() => {}} />);
    expect(container.textContent).toMatch(/Each animal becomes an enclosure/);
  });
});
