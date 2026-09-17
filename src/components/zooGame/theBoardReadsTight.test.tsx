import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { suggestSprintGoal } from './engine';
import { initialZooState } from './config';
import type { ZooGameState, BacklogItem } from './types';

// How much of the board you can see at once.
//
// Reported from playing it: "do we need to push down the PBIs in To Do? Can the move arrows also be
// part of a PBI card rather than spacing them out so much?"
//
// Two cards and a bit was all that fitted. Every card carried a row of reorder arrows UNDER it,
// which is a card's worth of height for two chevrons, and the Sprint Goal above the board took
// three rows to say two things.

/** A Sprint with work in To Do, which is what the board is about. */
const sprint = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3) as ZooGameState;
  const taken = base.backlog.filter((it) => !it.unsized && it.category !== 'epic').slice(0, 4).map((it) => it.id);
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1,
    committedIds: taken,
    backlog: base.backlog.map((it) => (taken.includes(it.id)
      ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)),
    sprintGoal: 'Our goal is to open the lions so that visitors have something to see', ...over,
  } as ZooGameState;
};

const noop = () => {};
const props = {
  onEstimate: noop, onToggleTask: noop, onFinishItem: noop, onStartItem: noop, onReorderSprint: noop,
  onPull: noop, onDropFromSprint: noop, onAnswerPlacement: noop, onSplitEpic: noop, onAssignDev: noop,
  onOpen: noop, onAskToCheck: noop, onEndDay: noop, onHoldDailyScrum: noop, onAnswerImpediment: noop,
  onSkipDailyScrum: noop, onStartDay: noop, onHoldRefinement: noop, onBuilding: noop, onAddPbi: noop,
  onSetUserStories: noop,
};
const board = (s: ZooGameState) => render(
  <MemoryRouter><SprintBoard {...(props as unknown as Parameters<typeof SprintBoard>[0])} state={s} /></MemoryRouter>,
);

describe('the reorder arrows', () => {
  it('sit on the card rather than in a row of their own under it', () => {
    const { container } = board(sprint());
    const up = container.querySelector('[data-part="sprint-up"]');
    expect(up, 'there is no way to change the order at all').toBeTruthy();
    // The card is a button and a button cannot hold another one, so the arrows are a sibling laid
    // over the card rather than a child of it. What matters is that they take no height of their
    // own: the row under each card was a card's worth of space for two chevrons.
    const holder = up!.closest('[data-part="card-slot"]');
    expect(holder, 'the arrows are not anchored to a card').toBeTruthy();
    expect(holder!.className, 'the arrows still take a row of their own').toMatch(/\brelative\b/);
    expect(up!.parentElement!.className,
      'the arrows are in the flow, pushing the next card down').toMatch(/\babsolute\b/);
  });

  it('costs the card no height at all, and the column no change in how it stacks', () => {
    // "Can we have nice coloured up and down buttons that don't impact the size of the card or how
    // the cards are stacked?" They had a row of their own first, then a band inside the card - both
    // of which are the card paying for them. They pay for nothing now: the target is laid over the
    // corner, and what is small is the glyph inside it.
    const { container } = board(sprint());
    const card = container.querySelector('[data-part="board-card"]') as HTMLElement;
    expect(card.style.paddingBottom, 'the card is holding a band open for them').toBeFalsy();
    expect(card.className, 'the card is padded to make room for them').not.toMatch(/\bpb-\d/);
  });

  it('is coloured, rather than a grey chevron to go looking for', () => {
    const { container } = board(sprint());
    const glyph = container.querySelector('[data-part="sprint-up"] span')!;
    expect(glyph.className, 'the arrows are the colour of everything else').toMatch(/bg-primary|text-primary/);
  });

  it('still says which item each one moves', () => {
    const { container } = board(sprint());
    const up = container.querySelector('[data-part="sprint-up"]')!;
    expect(up.getAttribute('aria-label'), 'a chevron with no name is a chevron').toMatch(/up the Sprint Backlog/);
  });

  it('is not offered where there is nothing to reorder', () => {
    const one = sprint();
    const only = one.backlog.filter((it) => it.sprintNumber === 1).slice(0, 1).map((it) => it.id);
    const s = { ...one, committedIds: only,
      backlog: one.backlog.map((it) => (only.includes(it.id) ? it : { ...it, sprintNumber: null, status: 'backlog' as const })) } as ZooGameState;
    expect(board(s).container.querySelector('[data-part="sprint-up"]'),
      'one card was offered somewhere to move to').toBeNull();
  });
});

describe('the Sprint Goal panel', () => {
  it('says what it is and how it is going on one line, and the Goal on the next', () => {
    // Three rows to say two things is a third of the To Do column.
    const { container } = board(sprint());
    const panel = container.querySelector('[data-part="sprint-goal"]')!;
    const head = panel.querySelector('[data-part="goal-head"]');
    expect(head, 'the label and the verdict are still on rows of their own').toBeTruthy();
    expect(head!.textContent).toMatch(/Sprint Goal/);
    expect(head!.textContent, 'the verdict did not come up onto the label row').toMatch(/Goal safe|at risk|No Sprint Goal/i);
  });

  it('keeps the Goal itself the thing you read first', () => {
    const { container } = board(sprint());
    const text = container.querySelector('[data-part="sprint-goal-text"]')!;
    expect(text.className, 'the Goal is no bigger than its own label').toMatch(/text-base|text-lg/);
    expect(text.className).toMatch(/font-bold/);
  });
});

describe('the Goal the game suggests', () => {
  const item = (over: Partial<BacklogItem>): BacklogItem => ({
    id: over.name ?? 'x', name: 'x', zone: 'Big Cats', category: 'enclosure', estimate: 3,
    acceptance: [], status: 'backlog', sprintNumber: null, accessible: true, ...over,
  } as BacklogItem);

  it('is about what visitors get, not about delivering an area', () => {
    // Reported from playing it: "'deliver the Big Cats zone so that visitors have something to see
    // and somewhere to stop' is more like a Product Goal. A Sprint Goal would better focus on
    // getting lions open or similar."
    //
    // The suggestion scaled UP as the Sprint filled: three items in one zone and it proposed
    // delivering the zone. That is backwards. More items in a Sprint does not make the objective
    // bigger, it makes it the thing those items add up to.
    const goal = suggestSprintGoal([
      item({ name: 'Lion Enclosure' }),
      item({ name: 'Lion', category: 'exhibit' }),
      item({ name: 'Main Pathways', category: 'path' }),
      item({ name: 'Toilets', category: 'amenity' }),
    ]);
    expect(goal, 'the Sprint Goal is still a Product Goal').not.toMatch(/the Big Cats zone/);
    expect(goal, 'it does not say what visitors would actually get').toMatch(/lion/i);
  });

  it('names the animals, because they are what anybody came for', () => {
    const goal = suggestSprintGoal([
      item({ name: 'Lion', category: 'exhibit' }),
      item({ name: 'Tiger', category: 'exhibit' }),
      item({ name: 'Lion Enclosure' }),
    ]);
    expect(goal).toMatch(/lion/i);
    expect(goal).toMatch(/tiger/i);
  });

  it('keeps the house shape, so it reads as one objective with a reason', () => {
    const goal = suggestSprintGoal([item({ name: 'Lion', category: 'exhibit' })]);
    expect(goal, 'it stopped being an outcome with a reason behind it').toMatch(/ so that /);
  });

  it('still has something to say for a Sprint with no animals in it', () => {
    const goal = suggestSprintGoal([
      item({ name: 'Main Pathways', category: 'path' }),
      item({ name: 'Toilets', category: 'amenity' }),
    ]);
    expect(goal).toMatch(/ so that /);
    expect(goal.length, 'a Sprint of facilities got no Goal at all').toBeGreaterThan(20);
  });
});
