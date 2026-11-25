import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import { presetFor, addWaterTo, addFloraTo, designSatisfiesTask, HABITAT_FEATURE_TYPES } from './design';
import type { ItemDesign } from './design';

// A plan step and the criterion beside it said opposite things on the same card: "Fence it
// securely" ticked while "Is it bordered safely?" said "nothing borders it yet", and "Lay the
// ground, shelter and water" ticked on ground and water while the criterion still said "still needs
// shelter or planting". A step is ticked by what the park would say about the same thing.

const pen = initialZooState(3).backlog.find((it) => it.category === 'enclosure')!;
const base = presetFor(pen);
const step = (design: ItemDesign, label: string) => designSatisfiesTask(pen, design, label);

describe('"Fence it securely"', () => {
  it('is not done while nothing borders it', () => {
    const { barrier: _none, ...unbordered } = base.parts;
    expect(step({ ...base, parts: unbordered }, 'Fence it securely')).toBe(false);
  });
  it('is done once a border is chosen', () => {
    expect(step({ ...base, parts: { ...base.parts, barrier: 'fence' } }, 'Fence it securely')).toBe(true);
  });
});

describe('"Lay the ground, shelter and water"', () => {
  const ground = { ...base, colors: { ...base.colors, ground: '#c8a06a' }, flora: [], water: [] } as ItemDesign;
  it('is not done with ground and water but nothing growing', () => {
    expect(step({ ...ground, water: addWaterTo(ground) }, 'Lay the ground, shelter and water')).toBe(false);
  });
  it('is not done with ground and planting but no water', () => {
    expect(step({ ...ground, flora: addFloraTo(ground, HABITAT_FEATURE_TYPES[0]) }, 'Lay the ground, shelter and water')).toBe(false);
  });
  it('is done with all three', () => {
    expect(step({ ...ground, water: addWaterTo(ground), flora: addFloraTo(ground, HABITAT_FEATURE_TYPES[0]) }, 'Lay the ground, shelter and water')).toBe(true);
  });
});
