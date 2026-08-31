import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { initialZooState } from './config';
import { reducer } from './useZooGame';
import { aiTurn } from './aiSeats';
import { mayTake } from './seatRules';
import { SprintReview } from './SprintReview';
import type { ZooGameState, ZooAction } from './types';
import type { SeatName } from './useZooSessions';

// A Product Owner who reaches the Review with Done work still shut.
//
// It is the easiest mistake in the game to make and the hardest to notice: the Developers build,
// the items reach Done, and unless the Product Owner opens them nobody ever sees any of it. The
// Review showed a picture of the zoo with the work missing from it and said nothing, so a whole
// Sprint could pass as "Sprint Goal not met" with no clue why.
//
// The Guide's line is the teaching: an Increment may be delivered before the end of the Sprint,
// and "the Sprint Review should never be considered a gate to releasing value".

// The Product Owner seat accepts the work, because nothing reaches Done without it. What this
// seat never does is open anything: releasing is a decision, and this is a test about the one
// nobody made.
const AI: SeatName[] = ['scrum_master', 'developer', 'product_owner'];

/** Play a Sprint with the game holding every seat but the Product Owner, who does the least
 *  they can get away with: they never open anything. */
function sprintWithNothingReleased(): ZooGameState {
  let s: ZooGameState = initialZooState(7);
  const po = (a: ZooAction) => { s = reducer(s, a); };
  const settle = (limit = 400) => {
    for (let i = 0; i < limit; i += 1) {
      let moved = false;
      for (const seat of AI) {
        const m = aiTurn(s, seat);
        if (!m || !mayTake(m.action.type, { seat }).allowed) continue;
        s = reducer(s, m.action); moved = true; break;
      }
      if (!moved) return;
    }
    throw new Error('the seats never ran out of moves');
  };

  po({ type: 'WRITE_BACKLOG', brief: { zones: ['Big Cats', 'Waterside'], audience: 'families', firstZone: 'Big Cats' } });
  po({ type: 'SET_PRODUCT_GOAL', goal: 'Open a zoo families come back to' });
  s = reducer(s, { type: 'AGREE_DOD' });
  s = reducer(s, { type: 'SET_PHASE', phase: 'planning' });
  settle();
  po({ type: 'SET_SPRINT_GOAL', goal: 'Open the Big Cats zone so families have something to see' });
  settle();
  po({ type: 'AGREE_SPRINT_GOAL', seat: 'product_owner' });
  settle();
  s = reducer(s, { type: 'PLAN_SPRINT', ids: s.forecast, refinementPoints: 0 });

  for (let day = 0; day <= s.sprintDays && s.phase === 'sprint'; day += 1) {
    settle();                       // build, tick the plan, run the pathways - and nothing else
    s = reducer(s, { type: 'END_DAY' });
    if (s.dayStage === 'dailyScrum') settle();
  }
  return s;
}

describe('the Review, when Done work was never released', () => {
  it('says so, and names what is shut', () => {
    const s = sprintWithNothingReleased();
    const shut = s.backlog.filter((it) => it.status === 'done');
    expect(shut.length, 'the Developers finished nothing, so there is nothing to be shut about').toBeGreaterThan(0);

    render(<SprintReview state={s} onTakeSignal={() => {}} onContinue={() => {}} onOpen={() => {}}
      onConfirmAc={() => {}} onToggleTask={() => {}} />);

    expect(screen.getByText(/Built, and nobody can see it/i),
      'the Review said nothing about work that is finished and shut').toBeTruthy();
    // Named, not counted: "3 items" tells a Product Owner nothing they can act on.
    for (const it of shut) {
      expect(screen.getAllByText(it.name).length, `${it.name} is Done and shut, and the Review never named it`)
        .toBeGreaterThan(0);
    }
  });

  it('names work the Developers finished that is waiting on the Product Owner', () => {
    // Since Done waits for the approval, this is where a Sprint most easily goes: everything
    // built, nothing accepted, an empty park in the Increment picture and - until this - nothing
    // on the screen saying why.
    const s = sprintWithNothingReleased();
    const built = s.backlog.filter((it) => it.status === 'committed' && it.started && it.design);
    if (!built.length) return;   // the seats accepted everything themselves; nothing to say
    render(<SprintReview state={s} onTakeSignal={() => {}} onContinue={() => {}} onOpen={() => {}}
      onConfirmAc={() => {}} onToggleTask={() => {}} />);
    expect(screen.getByText(/waiting on you to accept/i),
      'the Review said nothing about work waiting on the Product Owner').toBeTruthy();
    for (const it of built) {
      expect(screen.getAllByText(it.name).length, `${it.name} is waiting on acceptance and was never named`)
        .toBeGreaterThan(0);
    }
  });

  it('goes quiet as each one is opened, and keeps the ones that cannot be', () => {
    let s = sprintWithNothingReleased();
    // The Product Owner accepts what they can accept. Some criteria are not theirs to tick: the
    // park answers "the animal is in its enclosure" itself, and refuses if it is not.
    for (const it of s.backlog.filter((x) => x.status === 'done')) {
      (it.acceptance ?? []).forEach((_, i) => { s = reducer(s, { type: 'CONFIRM_AC', id: it.id, index: i, value: true }); });
      const fresh = s.backlog.find((x) => x.id === it.id)!;
      const signOff = (fresh.tasks ?? []).find((t) => /sign[- ]?off/i.test(t.label) && !t.done);
      if (signOff) s = reducer(s, { type: 'TOGGLE_TASK', id: it.id, taskId: signOff.id });
      s = reducer(s, { type: 'OPEN_ITEM', id: it.id });
    }
    const stillShut = s.backlog.filter((it) => it.status === 'done');
    expect(stillShut.length, 'nothing was released at all, so this proves nothing')
      .toBeLessThan(s.backlog.filter((it) => it.status === 'open').length);

    const { unmount } = render(<SprintReview state={s} onTakeSignal={() => {}} onContinue={() => {}} onOpen={() => {}} />);
    if (stillShut.length === 0) {
      expect(screen.queryByText(/Built, and nobody can see it/i),
        'the Review nagged about work that is already open').toBeNull();
    } else {
      // Whatever is left is exactly what is still shut, and nothing that has gone live.
      for (const it of stillShut) expect(screen.getAllByText(it.name).length).toBeGreaterThan(0);
      for (const it of s.backlog.filter((x) => x.status === 'open')) {
        expect(screen.queryAllByText(it.name).length,
          `${it.name} is open to visitors and the Review is still asking about it`).toBe(0);
      }
    }
    unmount();
  });
});
