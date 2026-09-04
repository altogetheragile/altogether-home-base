import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DoneGate } from './DoneGate';
import { unlockedBy } from './dodChecks';
import { initialZooState } from './config';
import { reducer } from './useZooGame';
import { splitEpic, planSprint } from './engine';
import type { BacklogItem, ZooGameState } from './types';

// Is it Done? Three things, in one place.
//
// The Developers' plan, this item's acceptance criteria, and the Definition of Done every item
// meets. They used to be three lists in two panels, so "why can this not move" was a question you
// answered by looking in three places and holding the answer in your head.
//
// And every line carries its evidence: what the park read, or "your judgement" where nothing in
// the park can measure it. A criterion nobody can check is one taken on trust.

/** A Sprint with a habitat and the zone's pathway in it, neither delivered. */
function midSprint(): { s: ZooGameState; habitat: BacklogItem } {
  let s = splitEpic(initialZooState(1), 'bigcats', ['tiger', 'leopard', 'kiosk']);
  for (const it of s.backlog.filter((x) => x.unsized)) s = reducer(s, { type: 'ESTIMATE_ITEM', id: it.id, points: it.trueSize ?? 3 });
  const habitat = s.backlog.find((it) => it.category === 'enclosure')!;
  const path = s.backlog.find((it) => it.category === 'path');
  s = planSprint({ ...s, phase: 'planning' }, [habitat.id, ...(path ? [path.id] : [])]);
  s = { ...s, dayStage: 'building', daySecondsLeft: 90 };
  return { s, habitat: s.backlog.find((it) => it.id === habitat.id)! };
}

/** ...and a Sprint with an animal in it whose habitat has not been built yet. */
function animalWaitingOnItsHabitat(): { s: ZooGameState } {
  let s = splitEpic(initialZooState(1), 'bigcats', ['tiger', 'leopard', 'kiosk']);
  for (const it of s.backlog.filter((x) => x.unsized)) s = reducer(s, { type: 'ESTIMATE_ITEM', id: it.id, points: it.trueSize ?? 3 });
  const habitat = s.backlog.find((it) => it.category === 'enclosure')!;
  const animal = s.backlog.find((it) => it.category === 'exhibit')!;
  s = planSprint({ ...s, phase: 'planning' }, [habitat.id, animal.id]);
  return { s: { ...s, dayStage: 'building', daySecondsLeft: 90 } };
}

const gate = (s: ZooGameState, item: BacklogItem) => render(<DoneGate state={s} item={item} />).container;

describe('the Done gate', () => {
  it('asks the question once, and answers it in three parts', () => {
    const { s, habitat } = midSprint();
    const text = gate(s, habitat).textContent ?? '';
    expect(text).toContain('Is it Done?');
    for (const part of ['Plan', "the Developers' steps", 'Acceptance criteria', 'this item', 'Definition of Done', 'every item']) {
      expect(text, `the gate does not carry "${part}"`).toContain(part);
    }
  });

  it('shows what the park read, line by line', () => {
    const { s, habitat } = midSprint();
    const text = gate(s, habitat).textContent ?? '';
    expect(text, 'no line says what the park actually saw').toMatch(/the park says:/);
  });

  it('says which lines are nobody’s to measure', () => {
    // The split is the teaching: a line the park cannot check is the team's word, and saying so is
    // better than a tick that means nothing.
    const { s, habitat } = midSprint();
    const text = gate(s, habitat).textContent ?? '';
    expect(text).toMatch(/judgement/i);
  });

  it('separates being behind from waiting on somebody else', () => {
    // Red lines tell a team nothing about which of them are theirs. A lion cannot be on the park
    // until its habitat is: that line is the enclosure's to settle, not the lion's, and the two
    // are different conversations.
    const { s } = animalWaitingOnItsHabitat();
    const lion = s.backlog.find((it) => it.category === 'exhibit')!;
    const waiting = unlockedBy(s, lion);
    expect(waiting.length, 'nothing was named as the thing this is waiting on').toBe(1);
    expect(waiting[0].item.category, 'the wrong item was named').toBe('enclosure');
    expect(waiting[0].lines.length, 'an item was named as unlocking nothing').toBeGreaterThan(0);

    const text = gate(s, lion).textContent ?? '';
    expect(text, 'the gate does not say what somebody else’s work would settle')
      .toMatch(/not all of it is yours/i);
    expect(text).toContain(waiting[0].item.name);
  });

  it('says nothing of the sort when the work is all yours', () => {
    const { s, habitat } = midSprint();
    expect(unlockedBy(s, habitat), 'the habitat was told to wait on something').toEqual([]);
    expect(gate(s, habitat).textContent ?? '', 'the habitat was told its work was somebody else’s')
      .not.toMatch(/not all of it is yours/i);
  });

  it('does not point at work that is not in this Sprint', () => {
    // Delivering the habitat would settle the line either way - but if it is not in the Sprint,
    // "wait for it" is not the answer. That is a conversation for Refinement, not for today.
    const { s } = animalWaitingOnItsHabitat();
    const lion = s.backlog.find((it) => it.category === 'exhibit')!;
    const habitat = s.backlog.find((it) => it.category === 'enclosure')!;
    const outside: ZooGameState = { ...s,
      backlog: s.backlog.map((it) => (it.id === habitat.id
        ? { ...it, status: 'backlog' as const, sprintNumber: null } : it)) };
    expect(unlockedBy(outside, lion), 'the gate pointed at work nobody has forecast').toEqual([]);
  });

  it('says so plainly when everything is answered', () => {
    const { s, habitat } = midSprint();
    const settled: ZooGameState = { ...s,
      definitionOfDone: [],
      backlog: s.backlog.map((it) => (it.id === habitat.id
        ? { ...it, acConfirmed: (it.acceptance ?? []).map(() => true), tasks: (it.tasks ?? []).map((t) => ({ ...t, done: true })) }
        : it)) };
    const item = settled.backlog.find((it) => it.id === habitat.id)!;
    expect(gate(settled, item).textContent, 'a finished item was not told it could move')
      .toMatch(/can move to Done/i);
  });

  it('does not claim somebody else’s work will settle a line it would not', () => {
    // The answer comes from asking - deliver it on a copy of the state and see what changes - so a
    // line that stays red stays red, and nothing is promised that will not happen.
    const { s, habitat } = midSprint();
    for (const { item, lines } of unlockedBy(s, habitat)) {
      const delivered: ZooGameState = { ...s,
        backlog: s.backlog.map((it) => (it.id === item.id ? { ...it, status: 'open' as const } : it)) };
      const after = gate(delivered, habitat).textContent ?? '';
      for (const line of lines) expect(after, `"${line}" was promised and did not come true`).toContain(line);
    }
  });
});
