import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TOOLBOX } from './toolboxItems';
import { suggestTasks, isSignOffTask, whatIsLeft, readyToMove, startOnTheBoard } from './engine';
import { parkCanSeeStep } from './design';
import { initialZooState } from './config';
import { CardDialog } from './CardDialog';
import type { BacklogItem, ZooGameState } from './types';

// A step the park cannot see is the team's to tick, and the game says so.
//
// The scrum-master playtest (sm5, 19 Nov 2026) wrote one step in its own words at its first Sprint
// Planning - "Construct the lion habitat enclosure" - and then met all five criteria and Priya's
// acceptance four Sprints running while the card sat in Doing. The park ticks the steps it can see
// (the size, the fence, the ground); that one it could not, so it never ticked, and Done waits for
// every step. The card said "Next: construct the lion habitat enclosure", which read as more work
// on the park, and the criteria panel said "move it to Done", which there was no way to do.

const asItem = (t: (typeof TOOLBOX)[number]['items'][number], i: number): BacklogItem =>
  ({ id: `t${i}`, name: t.name, category: t.category, template: t.template, zone: t.zone, status: 'committed' } as unknown as BacklogItem);
const everything = TOOLBOX.flatMap((g) => g.items).map(asItem);

describe('the steps the game suggests', () => {
  it('are all ones the park can see, or the Product Owner\'s sign-off', () => {
    // Otherwise the game's own plan would carry a step nobody is told to tick.
    for (const item of everything) {
      for (const t of suggestTasks(item)) {
        expect(isSignOffTask(t.label) || parkCanSeeStep(item, t.label), `${item.name}: "${t.label}"`).toBe(true);
      }
    }
  });
});

describe('a step in the team\'s own words', () => {
  // Finished work, the way `whatYouChose.test.tsx` builds it, with one step of the team's own
  // still open.
  const lion = (): { state: ZooGameState; item: BacklogItem } => {
    const s = startOnTheBoard(initialZooState(1) as ZooGameState);
    const pen = s.backlog.find((it) => it.status === 'committed' && it.category === 'enclosure')!;
    const item: BacklogItem = {
      ...pen, started: true,
      tasks: [
        { id: 'a', label: 'Construct the lion habitat enclosure', done: false },
        ...(pen.tasks ?? []).map((t) => ({ ...t, done: true })),
      ],
      acceptance: pen.acceptance ?? [],
      acConfirmed: (pen.acceptance ?? []).map(() => true),
      design: { parts: { type: 'enclosure' }, colors: { ground: '#c8a06a', fence: '#6b4a22' }, copies: [] } as unknown as BacklogItem['design'],
      pos: { x: 500, y: 800 },
    };
    return { state: { ...s, backlog: s.backlog.map((it) => (it.id === pen.id ? item : it)) } as ZooGameState, item };
  };

  it('is not one the park can see', () => {
    const { item } = lion();
    expect(parkCanSeeStep(item, 'Construct the lion habitat enclosure')).toBe(false);
    expect(parkCanSeeStep(item, 'Set the footprint size')).toBe(true);
  });

  it('is named on the card as the team\'s to tick', () => {
    const { state, item } = lion();
    expect(readyToMove(item), 'the open step should be what stops it').toBe(false);
    expect(whatIsLeft(state, item)).toBe('Next: tick “Construct the lion habitat enclosure” on its card - the park cannot see that step');
  });

  it('is marked in the plan on the item\'s card, and only that one', () => {
    const { state, item } = lion();
    const c = render(<CardDialog state={state} item={item} onClose={() => {}} onToggleTask={() => {}} />).baseElement;
    const marks = [...c.querySelectorAll('[data-part="hand-tick"]')];
    expect(marks).toHaveLength(1);
    expect(marks[0].closest('li')?.textContent).toContain('Construct the lion habitat enclosure');
  });
});
