import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ActionRail } from './ActionRail';
import { initialZooState } from './config';
import { planSprint, startItem, whatToPullNext, availableItems, toggleGoalCritical } from './engine';
import type { ZooGameState, BacklogItem } from './types';

// Pulling is a choice, and a choice nobody is told the stakes of is a guess.
//
// The board listed the Sprint Backlog in order and said nothing about what any of it would unblock
// or what the Goal rested on. The rail asks the question instead, with the first few that could
// actually start and one line each.

const sprint = (): ZooGameState => {
  const base = initialZooState(1);
  const picks = availableItems(base).slice(0, 4).map((it) => it.id);
  return { ...planSprint(base, picks), phase: 'sprint', dayStage: 'building', dayNumber: 1 } as ZooGameState;
};
const committed = (s: ZooGameState): BacklogItem[] =>
  s.backlog.filter((it) => it.status === 'committed' && it.sprintNumber === s.sprintNumber);

describe('what could be pulled', () => {
  it('offers no more than a few, however much could start', () => {
    // The seeded Sprint has fewer startable cards than the limit, so the limit never bites in it
    // and a test written against that Sprint passes whatever the limit is. This one has five.
    const s = sprint();
    const one = committed(s)[0];
    const five: BacklogItem[] = Array.from({ length: 5 }, (_, i) => ({
      ...one, id: `many-${i}`, name: `Thing ${i}`, category: 'amenity' as const,
      enclosureId: undefined, status: 'committed' as const, started: false, goalCritical: false,
    }));
    const many = { ...s, backlog: [...s.backlog.filter((it) => it.sprintNumber !== s.sprintNumber), ...five] } as ZooGameState;
    expect(whatToPullNext(many, 99).length, 'not enough startable work to test the limit').toBe(5);
    expect(whatToPullNext(many).length, 'the whole column was offered').toBe(3);
    expect(whatToPullNext(many, 2).length, 'the limit is ignored').toBe(2);
  });

  it('offers the first few, in the Sprint Backlog’s order', () => {
    const s = sprint();
    const next = whatToPullNext(s);
    expect(next.length, 'nothing was offered at all').toBeGreaterThan(0);
    const order = committed(s).map((it) => it.id);
    const offered = next.map((n) => n.item.id);
    expect(offered, 'the offer is not in the order the Developers put the work in')
      .toEqual([...offered].sort((a, z) => order.indexOf(a) - order.indexOf(z)));
  });

  it('leaves out what cannot start yet', () => {
    // An animal waits for its habitat. Offering it and refusing the press would be the board
    // asking a question it already knows the answer to.
    const s = sprint();
    const blocked = committed(s).filter((it) => it.category === 'exhibit' && it.enclosureId);
    expect(blocked.length, 'no blocked work in this Sprint to check').toBeGreaterThan(0);
    const offered = whatToPullNext(s, 99).map((n) => n.item.id);
    for (const it of blocked) {
      expect(offered, `${it.name} was offered while its habitat is unbuilt`).not.toContain(it.id);
    }
  });

  it('leaves out what is already being built', () => {
    const s = sprint();
    const first = whatToPullNext(s)[0].item;
    const after = startItem(s, first.id);
    expect(whatToPullNext(after).map((n) => n.item.id), 'work in hand was offered again')
      .not.toContain(first.id);
  });

  it('says what the Sprint Goal rests on, ahead of anything else it could say', () => {
    // The Goal outranks every other reason: a card that is top of the list AND essential is said to
    // be essential, because that is the thing the Developers are protecting.
    const s = sprint();
    const first = whatToPullNext(s)[0].item;
    expect(whatToPullNext(s)[0].why, 'the first card does not read as the first card')
      .not.toMatch(/Sprint Goal depends/i);
    const marked = toggleGoalCritical(s, first.id);
    expect(whatToPullNext(marked).find((n) => n.item.id === first.id)!.why,
      'an essential item does not say the Goal depends on it').toMatch(/Sprint Goal depends/i);
  });

  it('says what a card unblocks', () => {
    const s = sprint();
    const homes = committed(s).filter((it) => it.category === 'enclosure');
    expect(homes.length, 'no habitat in this Sprint to check').toBeGreaterThan(0);
    const waits = committed(s).some((it) => it.enclosureId === homes[0].id);
    if (!waits) return;
    const why = whatToPullNext(s, 99).find((n) => n.item.id === homes[0].id)!.why;
    expect(why, 'a habitat with an animal behind it reads as just another card')
      .toMatch(/cannot start until this is built/i);
  });

  it('gives every candidate a reason', () => {
    for (const { item, why } of whatToPullNext(sprint(), 99)) {
      expect(why, `${item.name} was offered with no reason`).toBeTruthy();
    }
  });
});

describe('the rail asks it', () => {
  const rail = (s: ZooGameState, onStartItem?: (id: string) => void) => render(
    // A question only reaches the rail if there is something to answer it with, so the handler is
    // always passed: leaving it out made the "somebody is waiting" test pass for the wrong reason.
    <MemoryRouter><ActionRail state={s} onStartItem={onStartItem} onAnswerQuestion={() => {}} /></MemoryRouter>,
  ).container;

  it('asks when there is nothing in hand', () => {
    const c = rail(sprint(), () => {});
    expect(c.textContent, 'the rail never asks what to pull').toMatch(/What will you pull next\?/);
  });

  it('says nothing once something is in hand', () => {
    // A prompt that arrives mid-build is a tap on the shoulder, and the question has been answered.
    const s = sprint();
    const started = startItem(s, whatToPullNext(s)[0].item.id);
    expect(rail(started, () => {}).textContent, 'the rail asks again while the team is building')
      .not.toMatch(/What will you pull next\?/);
  });

  it('carries the reason for each candidate', () => {
    const said = rail(sprint(), () => {}).textContent ?? '';
    for (const { item } of whatToPullNext(sprint())) {
      expect(said, `${item.name} is offered with no reason beside it`).toContain(item.name);
    }
    expect(said, 'no reason is given for any of them').toMatch(/Top of the list|depends on it|cannot start until/i);
  });

  it('pulls the one you press', () => {
    const s = sprint();
    const want = whatToPullNext(s)[0].item;
    let pulled: string | null = null;
    const c = rail(s, (id) => { pulled = id; });
    const button = [...c.querySelectorAll('button')].find((b) => b.textContent?.trim() === want.name);
    expect(button, `no button for ${want.name}`).toBeTruthy();
    fireEvent.click(button!);
    expect(pulled, 'pressing a candidate pulled nothing').toBe(want.id);
  });

  it('lets somebody waiting on an answer go first', () => {
    // Nobody is waiting on "what will you pull next". A Product Owner with a question is.
    const s = sprint();
    const asked = {
      ...s,
      questions: [{ id: 'q1', of: 'product_owner', from: 'Ada', itemId: committed(s)[0].id,
        text: 'Rounded or square?', askedAt: s.daySecondsLeft,
        choices: [{ key: 'theirs', label: 'Your call' }], day: 1 }],
    } as unknown as ZooGameState;
    const said = rail(asked, () => {}).textContent ?? '';
    expect(said, 'the pull prompt pushed a waiting question off the rail').toMatch(/Rounded or square/);
    expect(said).not.toMatch(/What will you pull next\?/);
  });
});
