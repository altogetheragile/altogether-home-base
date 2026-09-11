import { describe, it, expect } from 'vitest';
import { proposeSaveName, readSave, SAVE_VERSION } from './zooSaves';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// Keeping a game should be one press.
//
// A save used to arrive at an empty field, so every one of them was a naming decision before it was
// a save - and the second save of the same game asked again. What the name has to do is tell one
// game from another in a list; where each was left off is already on the line under it, so repeating
// that here would waste the only line the name has.

describe('the name a save is offered', () => {
  // Built locally rather than from a UTC string: the name carries the day where the save was made.
  const when = new Date(2026, 8, 11, 20, 41);

  it('says which zoo it is and when it was kept', () => {
    const s = { ...initialZooState(3), brief: { zones: ['Big Cats'], audience: 'families', firstZone: 'Big Cats' } } as ZooGameState;
    expect(proposeSaveName(s, when)).toBe('Big Cats zoo · 11 Sep');
  });

  it('still offers something before there is a brief to go on', () => {
    const s = { ...initialZooState(3), brief: undefined, zones: [] } as unknown as ZooGameState;
    expect(proposeSaveName(s, when), 'a save with nothing to call it').toBe('New zoo · 11 Sep');
  });

  it('does not name it after the ground between the areas', () => {
    const s = { ...initialZooState(3), brief: undefined, zones: ['Grounds', 'Facilities', 'Savanna'] } as unknown as ZooGameState;
    expect(proposeSaveName(s, when)).toBe('Savanna zoo · 11 Sep');
  });
});

describe('a save written by another build', () => {
  it('is refused out loud rather than half-read', () => {
    const read = readSave({ backlog: [], version: SAVE_VERSION + 1 });
    expect(read.ok, 'a save from a newer game was loaded anyway').toBe(false);
  });

  it('is read when this build wrote it', () => {
    expect(readSave({ ...initialZooState(3), version: SAVE_VERSION }).ok).toBe(true);
  });
});
