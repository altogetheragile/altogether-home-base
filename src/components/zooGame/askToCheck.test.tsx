import { describe, it, expect } from 'vitest';
import { askToCheck, answerQuestion, sendItemBack, acSettled, acOpen, asksNow, readyForDone, readyToMove } from './engine';
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
    // What is on offer depends on what the park says. Every criterion here has been refused by the
    // park (the fixture sets them all false), so the answers are "ship it knowing" and "send it
    // back" - accepting work the park says is not right is a decision, and it is named as one
    // rather than hidden behind a plain Accept.
    expect(q.choices.map((c) => c.key)).toEqual(['accept-as-is', 'back']);
    // Said as what it is. It used to read "does not meet one of its criteria" about criteria
    // nobody had looked at, which the game cannot know - see the judgement case below.
    expect(q.text, 'the question does not say what the park found').toMatch(/not right yet/i);
  });

  it('asks the plain question when the work meets everything', () => {
    const { s, item } = ready();
    const met = { ...s, backlog: s.backlog.map((it) => (it.id === item.id
      ? { ...it, acConfirmed: it.acceptance.map(() => true) } : it)) } as ZooGameState;
    const q = (askToCheck(met, item.id).questions ?? [])[0];
    expect(q.choices.map((c) => c.key)).toEqual(['accept', 'back']);
    expect(q.text).toMatch(/meets all of its criteria/i);
  });

  it('does not call a criterion unmet when nobody has looked at it', () => {
    // The park writes false into `acConfirmed` for anything it can settle and leaves the rest
    // alone. A criterion waiting on somebody's eye has not been refused by anything, and saying it
    // "does not meet" it is the game asserting what it cannot know. Reported from playing it: "how
    // are we to act on this feedback? 'Seating Area does not meet one of its criteria: Can I sit
    // down in the shade?'"
    const { s, item } = ready();
    const unjudged = { ...s, backlog: s.backlog.map((it) => (it.id === item.id
      ? { ...it, acConfirmed: [] } : it)) } as ZooGameState;
    const q = (askToCheck(unjudged, item.id).questions ?? [])[0];
    expect(q.text, 'it says the park found fault where the park said nothing').not.toMatch(/not right yet/i);
    expect(q.text, 'it does not say whose call it is').toMatch(/your eye/i);
    // ...and accepting is on offer, because judging it IS the acceptance.
    expect(q.choices.map((c) => c.key), 'the only way past a judgement is a waiver')
      .toEqual(['accept', 'back']);
  });

  it('keeps the waiver for what the park did refuse, alongside what is left to judge', () => {
    const { s, item } = ready();
    const mixed = { ...s, backlog: s.backlog.map((it) => (it.id === item.id
      ? { ...it, acConfirmed: it.acceptance.map((_, i) => (i === 0 ? false : undefined)) } : it)) } as unknown as ZooGameState;
    const q = (askToCheck(mixed, item.id).questions ?? [])[0];
    expect(q.text).toMatch(/not right yet/i);
    expect(q.text, 'the ones waiting on a judgement are counted as faults').toMatch(/yours to judge/i);
    expect(q.choices.map((c) => c.key)).toEqual(['accept-as-is', 'back']);
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

describe('an answer, once given, is not asked for again', () => {
  // Reported from playing it, after three goes round the loop: "I have the PO accept but it does not
  // go to Done." The Product Owner had accepted a habitat as it was, and the rail went on telling
  // them there was one criterion still to check - so they asked again, accepted as-is again, and
  // nothing changed.
  //
  // "Has this criterion been settled?" is two things, not one: the Product Owner ticked it, or the
  // Product Owner looked at it and said ship it anyway. Both are answers. That was known in exactly
  // one place - the sign-off - and counted as `acConfirmed` alone in the fourteen others.

  const shipped = (): { s: ZooGameState; item: BacklogItem } => {
    const { s, item } = ready();
    const after = answerQuestion(askToCheck(s, item.id), `check-${item.id}`, 'accept-as-is', 'product_owner');
    return { s: after, item: after.backlog.find((x) => x.id === item.id)! };
  };

  it('counts a criterion shipped knowing as settled', () => {
    const { item } = shipped();
    expect(item.acceptance.every((_, i) => acSettled(item, i)),
      'the Product Owner accepted it and the game still calls it unanswered').toBe(true);
    expect(acOpen(item), 'there is still something open on work that was accepted').toEqual([]);
  });

  it('stops asking the Product Owner to check it', () => {
    const { s, item } = shipped();
    const asked = asksNow(s).filter((a) => a.of === 'product_owner' && /criterion|criteria/i.test(a.text));
    expect(asked, `the Product Owner is being asked again: ${asked.map((a) => a.text).join(' / ')}`).toEqual([]);
    expect(item.status !== 'backlog', 'the work fell off the board').toBe(true);
  });

  it('asks a different question if they are asked to look again', () => {
    // Nothing is open, so it is "is this what you asked for?" rather than a list of faults.
    const { s, item } = shipped();
    const q = (askToCheck(s, item.id).questions ?? [])[0];
    expect(q.text, 'it named criteria that have been answered').not.toMatch(/not right yet/i);
    expect(q.choices.map((c) => c.key), 'Accept is not on offer for work with nothing outstanding')
      .toContain('accept');
  });

  it('writes it down once, however many times it is answered', () => {
    let { s, item } = shipped();
    for (let i = 0; i < 3; i += 1) {
      s = answerQuestion(askToCheck(s, item.id), `check-${item.id}`, 'accept-as-is', 'product_owner');
      item = s.backlog.find((x) => x.id === item.id)!;
    }
    expect((item.acceptedAsIs ?? []).length, 'the same criterion was recorded once per press')
      .toBe(new Set(item.acceptedAsIs ?? []).size);
  });

  it('leaves the Developers free to move it', () => {
    const { s, item } = shipped();
    expect(readyForDone(item), 'everything was answered and the sign-off never followed').toBe(true);
    expect(readyToMove(item), 'nothing was outstanding and the card still would not move').toBe(true);
    expect(s.backlog.find((x) => x.id === item.id)).toBeTruthy();
  });

  it('will not send back work the Product Owner has already accepted as it is', () => {
    const { s, item } = shipped();
    expect(sendItemBack(s, item.id), 'work that was accepted was refused afterwards anyway').toBe(s);
  });
});
