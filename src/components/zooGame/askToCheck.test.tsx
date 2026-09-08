import { describe, it, expect } from 'vitest';
import { askToCheck, answerQuestion, sendItemBack } from './engine';
import { initialZooState, DAY_SECONDS } from './config';
import { presetFor } from './design';
import type { ZooGameState, BacklogItem } from './types';

// "Ask Priya to check" is a question, not a checkbox.
//
// The Developers say when the work is ready to be looked at; the Product Owner answers on their own
// rail, with the clock running, and the item says who it is waiting on meanwhile. Accepting is the
// sign-off - every criterion confirmed, which is what the sign-off has always followed - and
// sending it back is the other answer. Both are recorded with how long anybody waited.

const ready = (): { s: ZooGameState; item: BacklogItem } => {
  const base = initialZooState(3);
  const h = base.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
  const item = {
    ...h, status: 'committed' as const, sprintNumber: 1, started: true, design: presetFor(h),
    assignedDevs: [base.team.developers[0].id], acConfirmed: h.acceptance.map(() => false),
  };
  return {
    s: {
      ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
      daySecondsLeft: DAY_SECONDS, committedIds: [h.id],
      backlog: base.backlog.map((it) => (it.id === h.id ? item : it)),
    } as ZooGameState,
    item,
  };
};

describe('asking the Product Owner to look at it', () => {
  it('puts a question on their rail, from whoever built it', () => {
    const { s, item } = ready();
    const asked = askToCheck(s, item.id);
    const q = (asked.questions ?? [])[0];
    expect(q, 'nobody was asked to look at finished work').toBeTruthy();
    expect(q.of).toBe('product_owner');
    expect(q.itemId).toBe(item.id);
    expect(q.from).toBe(s.team.developers[0].name);
    expect(q.choices.map((c) => c.key)).toEqual(['accept', 'back']);
  });

  it('asks once, however many times the button is pressed', () => {
    const { s, item } = ready();
    expect((askToCheck(askToCheck(s, item.id), item.id).questions ?? []).length).toBe(1);
  });

  it('accepting it is the sign-off, and says how long they waited', () => {
    const { s, item } = ready();
    const asked = askToCheck(s, item.id);
    const later = { ...asked, daySecondsLeft: asked.daySecondsLeft - 14 } as ZooGameState;
    const after = answerQuestion(later, `check-${item.id}`, 'accept');
    const now = after.backlog.find((it) => it.id === item.id)!;
    expect(now.acConfirmed?.every(Boolean), 'accepting it confirmed nothing').toBe(true);
    expect(after.questions ?? [], 'the question stayed open after it was answered').toHaveLength(0);
    const noted = (after.decisions ?? [])[(after.decisions ?? []).length - 1];
    expect(noted.what).toMatch(/accepted/);
    expect(noted.cost, 'nothing says how long the Developers waited').toMatch(/14s/);
  });

  it('sending it back is the same send-back as everywhere else', () => {
    const { s, item } = ready();
    const asked = askToCheck(s, item.id);
    const after = answerQuestion(asked, `check-${item.id}`, 'back');
    const now = after.backlog.find((it) => it.id === item.id)!;
    expect(now.sentBack, 'the work came back with no reasons on it').toBeTruthy();
    expect(now.design, 'it was sent back and still counted as built').toBeUndefined();
    // The same function the card's own "Send it back" uses - one way for work to come back.
    const byHand = sendItemBack(s, item.id);
    expect(now.sentBack!.criteria).toEqual(byHand.backlog.find((it) => it.id === item.id)!.sentBack!.criteria);
  });
});
