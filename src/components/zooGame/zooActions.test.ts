import { describe, it, expect } from 'vitest';
import type { ZooAction } from './types';
import { zooActions } from './zooActions';

// The reason this file exists at all: a game played alone and a game played together must
// offer the screens the same actions, and there must not be two lists of them. The type
// system carries most of that - ZooSession extends ZooActions, so a missing action fails to
// compile - and these cover what types cannot.

const spy = () => { const sent: ZooAction[] = []; return { sent, send: (a: ZooAction) => sent.push(a) }; };

describe('one action surface, whoever carries it', () => {
  it('is built around its carrier rather than around a reducer', () => {
    // Nothing here dispatches. Everything goes to whatever it was handed, which is what
    // lets the same call reach a local reducer or a shared session.
    const { sent, send } = spy();
    const a = zooActions(send);
    a.setGoal('A zoo the neighbourhood is proud of');
    a.estimate('pbi-1', 5);
    a.tickDay();
    expect(sent).toEqual([
      { type: 'SET_PRODUCT_GOAL', goal: 'A zoo the neighbourhood is proud of' },
      { type: 'ESTIMATE_ITEM', id: 'pbi-1', points: 5 },
      { type: 'TICK_DAY' },
    ]);
  });

  it('is entirely functions, and covers the whole game', () => {
    const a = zooActions(spy().send);
    const keys = Object.keys(a);
    expect(keys.every((k) => typeof (a as Record<string, unknown>)[k] === 'function')).toBe(true);
    // A guard against half a surface: the screens need planning, building, the events and
    // the park, so a carrier missing a family of actions would show up here.
    for (const needed of ['start', 'plan', 'estimate', 'pull', 'build', 'open', 'closeDay',
                          'holdDailyScrum', 'review', 'nextSprint', 'setItemPos', 'splitEpic',
                          'tickDay', 'tickScrum', 'reset']) {
      expect(keys, `${needed} is missing from the action surface`).toContain(needed);
    }
    expect(keys.length, 'the surface shrank - did an action get dropped?').toBeGreaterThanOrEqual(86);
  });

  it('keeps its identity while the carrier does', () => {
    // Screens memoise on these, so a new object every render would defeat it.
    const { send } = spy();
    const a = zooActions(send);
    const b = zooActions(send);
    expect(Object.keys(a)).toEqual(Object.keys(b));
  });
});
