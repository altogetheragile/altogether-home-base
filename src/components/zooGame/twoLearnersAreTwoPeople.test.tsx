import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { reducer } from './useZooGame';
import { initialZooState } from './config';
import { standUp, yourStandUp } from './engine';
import { mayTake } from './seatRules';
import { Bubble } from './TeamChat';
import { YouContext } from './you';
import type { ZooAction, ZooGameState } from './types';

// Two learners in a shared game were both Ada: the game's "you" was always the first Developer, so
// both pulled under her name and were offered her stand-up. Every player is a Developer of their own
// now (docs/ZOO_EVERYONE_A_DEVELOPER.md), and a move is made as whoever sent it.

const as = (member: string, action: ZooAction) => ({ ...action, as: member }) as unknown as ZooAction;

/** A shared game as it starts: no Developers until people arrive. */
const table = (): ZooGameState => {
  const base = initialZooState(5);
  const empty = { ...base, team: { ...base.team, developers: [] } };
  return [{ type: 'JOIN_TEAM', id: 'p-sam', name: 'sam' }, { type: 'JOIN_TEAM', id: 'p-jo', name: 'jo' }]
    .reduce((s, a) => reducer(s, a as ZooAction), empty as ZooGameState);
};
const building = (s: ZooGameState): ZooGameState => {
  const ready = s.backlog.filter((it) => !it.unsized && it.category !== 'exhibit' && it.category !== 'epic').slice(0, 2).map((it) => it.id);
  return { ...s, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1, daySecondsLeft: 100, wipLimit: 0,
    committedIds: ready,
    backlog: s.backlog.map((it) => (ready.includes(it.id) ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)) } as ZooGameState;
};

describe('two learners at one table', () => {
  it('are two Developers, under their own names, once each', () => {
    const s = reducer(table(), { type: 'JOIN_TEAM', id: 'p-sam', name: 'sam' } as ZooAction);
    expect(s.team.developers.map((d) => d.name)).toEqual(['sam', 'jo']);
    expect(s.team.developers.every((d) => d.player)).toBe(true);
  });

  it('each pull a card as themselves', () => {
    const s = building(table());
    const [a, b] = s.committedIds;
    const one = reducer(s, as('p-jo', { type: 'START_ITEM', id: a } as ZooAction));
    const two = reducer(one, as('p-sam', { type: 'START_ITEM', id: b } as ZooAction));
    expect(two.backlog.find((it) => it.id === a)?.pulledBy, 'jo pulled as somebody else').toBe('p-jo');
    expect(two.backlog.find((it) => it.id === b)?.pulledBy, 'sam pulled as somebody else').toBe('p-sam');
  });

  it('say things as themselves, and only the speaker sees it as theirs', () => {
    const s = reducer(table(), as('p-jo', { type: 'SAY', who: 'you', from: 'You', text: 'I will take the toilets.' } as ZooAction));
    const line = s.chat![s.chat!.length - 1];
    expect(line).toMatchObject({ who: 'developer', from: 'jo', member: 'p-jo' });
    const seenBy = (viewer: string) => render(<YouContext.Provider value={viewer}><ul><Bubble msg={line} /></ul></YouContext.Provider>)
      .container.querySelector('li')!.className;
    expect(seenBy('p-jo'), 'jo does not see it as theirs').toMatch(/flex-row-reverse/);
    expect(seenBy('p-sam'), 'sam sees jo’s line as their own').not.toMatch(/flex-row-reverse/);
  });

  it('each say their own stand-up, and the game says nobody’s for them', () => {
    const s = standUp({ ...building(table()), dayStage: 'dailyScrum' });
    expect((s.chat ?? []).filter((m) => m.kind === 'stand-up' && /^Yesterday/.test(m.text)), 'a player’s lines were read out for them').toHaveLength(0);
    expect(yourStandUp(s, 'p-jo').length, 'jo has nothing to say').toBeGreaterThan(0);
  });

  it('are all Developers, the Product Owner seat included', () => {
    expect(mayTake('START_ITEM', { seat: 'product_owner', memberId: 'p-sam' }).allowed).toBe(true);
    expect(mayTake('ESTIMATE_ITEM', { seat: 'product_owner', memberId: 'p-sam' }).allowed).toBe(true);
    expect(mayTake('ESTIMATE_ITEM', { seat: 'product_owner' }).allowed, 'a Product Owner with no member became a Developer').toBe(false);
    expect(mayTake('REORDER_IN_ZONE', { seat: 'developer', memberId: 'p-jo' }).allowed, 'a Developer may order the Product Backlog').toBe(false);
  });
});

describe('playing alone', () => {
  it('is unchanged: you are the first Developer', () => {
    const s = reducer(initialZooState(5), { type: 'SAY', who: 'you', from: 'You', text: 'Hello' } as ZooAction);
    expect(s.chat![s.chat!.length - 1]).toMatchObject({ who: 'you', from: 'You' });
  });
});
