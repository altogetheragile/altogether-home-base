import { describe, it, expect } from 'vitest';
import { parseStoryMap, nowSlice, exampleStoryMap, emptyStoryMap } from './storyMap';
import { validateArtifactData } from './artifacts/schemas';

// The Story Map as Al teaches it (Cohn's three tiers, Scrum Master Exercises deck slides 21-23):
// backbone, stories, smaller stories; slices cut across the smaller stories only, each with its
// own Product Goal; Now goes to the backlog. Al's decisions, 20 Oct 2026: slices never cut the
// two rows above, and an old two-tier map keeps every card.

describe('the story map has three tiers', () => {
  it('starts with Now, Next and Later', () => {
    expect(emptyStoryMap().slices.map((s) => s.name)).toEqual(['Now', 'Next', 'Later']);
  });

  it('reads an old two-tier map without losing a card or its release', () => {
    const old = {
      productGoal: 'Help busy people plan their day',
      releases: [{ id: 'r1', name: 'Release 1' }, { id: 'r2', name: 'Release 2' }],
      activities: [{ id: 'a1', name: 'Capture tasks', cards: [
        { id: 'c1', title: 'Add a task in one line', releaseId: 'r1' },
        { id: 'c2', title: 'Add a task by email', releaseId: 'r2' },
        { id: 'c3', title: 'Not yet placed', releaseId: null },
      ] }],
    };
    const m = parseStoryMap(old)!;
    expect(m.version).toBe(2);
    expect(m.backbone[0].name).toBe('Capture tasks');
    // One story, left unnamed, so the team sees the missing middle tier
    expect(m.backbone[0].stories).toHaveLength(1);
    expect(m.backbone[0].stories[0].title).toBe('');
    expect(m.backbone[0].stories[0].smaller.map((c) => [c.title, c.sliceId])).toEqual([
      ['Add a task in one line', 'r1'], ['Add a task by email', 'r2'], ['Not yet placed', null],
    ]);
    expect(m.slices.map((s) => s.name)).toEqual(['Release 1', 'Release 2']);
    // The old single Product Goal goes on the first slice
    expect(m.slices[0].productGoal).toBe('Help busy people plan their day');
  });

  it('reads its own shape back unchanged', () => {
    const m = exampleStoryMap();
    expect(parseStoryMap(JSON.parse(JSON.stringify(m)))).toEqual(m);
  });

  it('gives every backbone step a story, so every step has a column', () => {
    const m = parseStoryMap({ version: 2, slices: [], backbone: [{ id: 'b', name: 'Arrive', stories: [] }] })!;
    expect(m.backbone[0].stories).toHaveLength(1);
  });

  it('drops a reference to a slice that no longer exists, to Not sliced yet', () => {
    const m = parseStoryMap({ version: 2, slices: [{ id: 's1', name: 'Now', productGoal: '' }],
      backbone: [{ id: 'b', name: 'x', stories: [{ id: 'st', title: 'y', smaller: [{ id: 'c', title: 'z', sliceId: 'gone' }] }] }] })!;
    expect(m.backbone[0].stories[0].smaller[0].sliceId).toBeNull();
  });

  it('sends Now only, the top of every column first (the walking skeleton)', () => {
    const m = parseStoryMap({ version: 2,
      slices: [{ id: 'now', name: 'Now', productGoal: 'g' }, { id: 'next', name: 'Next', productGoal: '' }],
      backbone: [
        { id: 'b1', name: 'Plan', stories: [{ id: 's1', title: 'Tickets', smaller: [
          { id: 'x1', title: 'Select ticket', sliceId: 'now' },
          { id: 'x2', title: 'Compare prices', sliceId: 'next' },
          { id: 'x3', title: 'Check out', sliceId: 'now' },
        ] }] },
        { id: 'b2', name: 'Arrive', stories: [{ id: 's2', title: 'Enter', smaller: [
          { id: 'y1', title: 'Enter gate', sliceId: 'now' },
          { id: 'y2', title: '   ', sliceId: 'now' },
        ] }] },
      ] })!;
    const { slice, ordered } = nowSlice(m);
    expect(slice.name).toBe('Now');
    expect(ordered.map((o) => o.item.title)).toEqual(['Select ticket', 'Enter gate', 'Check out']);
  });

  it('matches the artifact contract the backlog hand-off checks', () => {
    expect(validateArtifactData('story-map', exampleStoryMap()).valid).toBe(true);
  });
});
