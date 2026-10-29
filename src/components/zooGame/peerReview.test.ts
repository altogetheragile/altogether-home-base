import { describe, it, expect } from 'vitest';
import { initialZooState, DAY_SECONDS } from './config';
import { startItem, yourDev, otherDevs } from './engine';
import { dodVerdicts } from './dodChecks';
import { aiTurn } from './aiSeats';
import type { ZooGameState } from './types';

// "Peer-reviewed by another Developer" has to be reachable by somebody.
//
// Reported from a live game, day 3 of Sprint 3, sitting as the Product Owner: an item with every
// acceptance criterion accepted, signed off, standing on the park - and stuck, because the
// Definition of Done wanted a second Developer on it and the line read "nobody picked it up".
// Nothing in the game had ever written down who was working on anything; `assignedDevs` was only
// filled by choosing a name from a menu, and seats played by the game never chose. The one person
// watching it happen could not fix it either, because assigning a Developer is not the Product
// Owner's call - and should not be.

const sprint = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const item = base.backlog.find((it) => !it.unsized && it.category === 'enclosure')!;
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    daySecondsLeft: DAY_SECONDS, committedIds: [item.id],
    backlog: base.backlog.map((it) => (it.id === item.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)),
    ...over,
  } as ZooGameState;
};

const held = (s: ZooGameState) => s.backlog.find((it) => it.status === 'committed')!;

describe('who is working on it', () => {
  it('writes down whoever took the work', () => {
    const s = sprint();
    const after = startItem(s, held(s).id);
    const on = after.backlog.find((it) => it.id === held(s).id)!.assignedDevs ?? [];
    expect(on.length, 'the item was taken and nobody was recorded as working it').toBe(1);
    expect(s.team.developers.some((d) => d.id === on[0])).toBe(true);
  });

  it('says one Developer worked it alone, not that nobody picked it up', () => {
    const s = startItem(sprint(), held(sprint()).id);
    const item = s.backlog.find((it) => it.started)!;
    const line = dodVerdicts(s, item).find((c) => /Peer-reviewed/.test(c.line))!;
    expect(line.answer && 'met' in line.answer && line.answer.met,
      'one Developer alone met a line about a second pair of eyes').toBe(false);
    expect(line.answer?.evidence, 'the park still says nobody is on it').toMatch(/one Developer worked it alone/);
  });

  it('gives it to whoever took it, and to you when nobody is named', () => {
    // This used to spread the work: whoever had least on took the next card, so two pulls landed
    // on two Developers. It read prettily on a board where nobody owned anything, and that
    // ambiguity is exactly what let a colleague finish your work for you - a Developer played by
    // the game would find a started card with no design and build it, and it might be yours.
    //
    // So a pull now says whose it is. One with nobody named is YOURS, however much you already
    // have on, because you are the Developer at the table; the Developers the game plays name
    // themselves. Nothing about the second pair of eyes needs the old spreading: the reviewer is
    // somebody who is not already on the card, which is the thing the line is actually asking.
    const base = initialZooState(3);
    // Two things that can start on their own - an animal waits for its habitat - and two SMALL
    // ones, so that a single day can pay for both.
    const two = base.backlog.filter((it) => !it.unsized && !['epic', 'exhibit'].includes(it.category))
      .sort((a, z) => a.estimate - z.estimate).slice(0, 2);
    let s = {
      ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, daySecondsLeft: DAY_SECONDS, wipLimit: 0,
      backlog: base.backlog.map((it) => (two.some((t) => t.id === it.id)
        ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)),
    } as ZooGameState;
    const you = yourDev(s)!;
    const them = otherDevs(s)[0];
    s = startItem(s, two[0].id);                      // you pulled it
    s = startItem(s, two[1].id, 'developer', them.id); // they pulled it
    const [a, b] = two.map((t) => s.backlog.find((it) => it.id === t.id)!);
    expect(a.pulledBy, 'a card you pulled is not yours').toBe(you.id);
    expect(a.assignedDevs, 'your name is not on the card you took').toEqual([you.id]);
    expect(b.pulledBy, 'a card a named Developer pulled is not theirs').toBe(them.id);
    expect(b.assignedDevs).toEqual([them.id]);
  });

});

describe('the second pair of eyes', () => {
  it('does not offer a review on work that is not finished', () => {
    const s = startItem(sprint(), held(sprint()).id);   // started, nothing built yet
    const move = aiTurn(s, 'developer');
    expect(move?.action.type, 'they reviewed something nobody had built').not.toBe('ASSIGN_DEV');
  });
});
