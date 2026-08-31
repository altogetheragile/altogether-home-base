import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import { reducer } from './useZooGame';
import { aiTurn } from './aiSeats';
import { mayTake } from './seatRules';
import type { ZooGameState, ZooAction } from './types';
import type { SeatName } from './useZooSessions';

// One Sprint, end to end, with a human Product Owner and the other seats played by the game.
//
// Every other test here checks a rule in isolation. This one plays, because the faults that
// actually reached a person were never in a rule: they were in what happened next. Work was
// pulled and never built. Items were built and never Done, because nobody ticked the plan. A
// path reached Done and could never be released, because no run of it reached the zone and
// the park - rightly - would not take anybody's word for it.

const AI: SeatName[] = ['scrum_master', 'developer'];
const ME: SeatName = 'product_owner';

describe('a Sprint, played through to the Review', () => {
  it('finishes, releases, and gives the Review something to inspect', () => {
    let s: ZooGameState = initialZooState(7);
    // The Product Owner's own moves go through the gate, exactly as they would in the game.
    const po = (a: ZooAction) => {
      expect(mayTake(a.type, { seat: ME }).allowed, `the Product Owner was refused ${a.type}`).toBe(true);
      s = reducer(s, a);
    };
    // ...and the seats nobody is in take one turn a pass, as useAiSeats does.
    const settle = (limit = 400) => {
      for (let i = 0; i < limit; i += 1) {
        let moved = false;
        for (const seat of AI) {
          const m = aiTurn(s, seat);
          if (!m || !mayTake(m.action.type, { seat }).allowed) continue;
          s = reducer(s, m.action); moved = true; break;
        }
        if (!moved) return i;
      }
      throw new Error('the seats never ran out of moves');
    };

    po({ type: 'WRITE_BACKLOG', brief: { zones: ['Big Cats', 'Waterside'], audience: 'families', firstZone: 'Big Cats' } });
    po({ type: 'SET_PRODUCT_GOAL', goal: 'Open a zoo families come back to' });
    s = reducer(s, { type: 'AGREE_DOD' });
    s = reducer(s, { type: 'SET_PHASE', phase: 'planning' });

    settle();                                                     // the Developers size the Backlog
    po({ type: 'SET_SPRINT_GOAL', goal: 'Open the Big Cats zone so families have something to see' });
    settle();                                                     // the team agrees, forecasts, plans the how
    po({ type: 'AGREE_SPRINT_GOAL', seat: ME });
    settle();

    expect(s.sprintGoalAgreed.sort(), 'the Goal went unagreed by somebody').toEqual(['developer', 'product_owner', 'scrum_master']);
    expect(s.forecast.length, 'the Developers forecast nothing').toBeGreaterThan(0);
    s = reducer(s, { type: 'PLAN_SPRINT', ids: s.forecast, refinementPoints: 0 });

    for (let day = 0; day <= s.sprintDays && s.phase === 'sprint'; day += 1) {
      settle();                                                   // build, plan-tick, run the pathways
      // The Product Owner accepts what the Developers have built, which is what makes it Done -
      // the card waits in Doing until they do - and then releases it. Placement criteria are
      // answered by the park itself, so a tick alone will not do.
      for (const it of s.backlog.filter((x) => x.status === 'committed' && x.started && x.design)) {
        (it.acceptance ?? []).forEach((_, i) => { s = reducer(s, { type: 'CONFIRM_AC', id: it.id, index: i, value: true }); });
        if (s.backlog.find((x) => x.id === it.id)!.status === 'done') po({ type: 'OPEN_ITEM', id: it.id });
      }
      s = reducer(s, { type: 'END_DAY' });
      if (s.dayStage === 'dailyScrum') settle();
    }

    expect(s.phase, 'the Sprint never reached the Review').toBe('review');
    const worked = s.backlog.filter((x) => x.sprintNumber === 1);
    const notReleased = worked.filter((x) => x.status !== 'open');
    expect(notReleased.map((x) => `${x.category}:${x.name}`), 'these were never released').toEqual([]);
    expect((s.connectors ?? []).length, 'no pathway was ever run to a zone').toBeGreaterThan(0);
    expect(s.velocity[0], 'nothing was delivered').toBeGreaterThan(0);
    expect(s.sprintGoalMet, 'the Sprint Goal was not met').toBe(true);
    // ...and the Review has something to talk about, which is the whole point of getting here.
    expect(s.signals.length, 'the visitors said nothing, so the Review teaches nothing').toBeGreaterThan(0);
  });
});
