import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import { reducer } from './useZooGame';
import { aiTurn } from './aiSeats';
import { mayTake } from './seatRules';
import { decisionsIn, sprintProgress, sprintCapacity, goalMeasures, nextNudge, retroQuestions } from './engine';
import type { ZooGameState, ZooAction, TeamDecision } from './types';
import type { SeatName } from './useZooSessions';

// What the game notices about the way a Scrum Team works.
//
// Increment one of docs/ZOO_LEARNING_BY_BREAKING.md, and the whole of it is: notice, and say so
// at the Retrospective. Nothing here has an opinion, nothing costs anything, and no rule turns on
// any of it. A team that cannot see what it did cannot inspect it, and that comes first.

const AI: SeatName[] = ['scrum_master', 'developer', 'product_owner'];

/** Play a Sprint with the game holding the seats, doing whatever `during` says on each pass. */
function playSprint(seed = 7, during: (s: ZooGameState) => ZooAction[] = () => []): ZooGameState {
  let s: ZooGameState = initialZooState(seed);
  const act = (a: ZooAction) => { s = reducer(s, a); };
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

  act({ type: 'WRITE_BACKLOG', brief: { zones: ['Big Cats', 'Waterside'], audience: 'families', firstZone: 'Big Cats' } });
  act({ type: 'SET_PRODUCT_GOAL', goal: 'Open a zoo families come back to' });
  act({ type: 'AGREE_DOD' });
  act({ type: 'SET_PHASE', phase: 'planning' });
  settle();
  act({ type: 'SET_SPRINT_GOAL', goal: 'Open the Big Cats zone so families have something to see' });
  settle();
  act({ type: 'AGREE_SPRINT_GOAL', seat: 'product_owner' });
  settle();
  for (const a of during(s)) act(a);
  act({ type: 'PLAN_SPRINT', ids: s.forecast, refinementPoints: 0, by: 'developer' });
  for (let day = 0; day <= s.sprintDays && s.phase === 'sprint'; day += 1) {
    settle();
    for (const a of during(s)) act(a);
    act({ type: 'END_DAY' });
    if (s.dayStage === 'dailyScrum') settle();
  }
  return s;
}

const kinds = (ds: TeamDecision[]) => ds.map((d) => d.kind);

describe('what the game notices about how the team worked', () => {
  it('records who chose the Sprint Backlog, and how much of it there was', () => {
    const s = playSprint();
    const first = decisionsIn(s, 1).find((d) => d.kind === 'forecast')!;
    expect(first, 'nobody noticed the Sprint Backlog being chosen').toBeTruthy();
    expect(first.by, 'the accountability that chose it was not recorded').toBe('developer');
    expect(first.what, 'the line does not say who, what, or how much').toMatch(/Developers chose the Sprint Backlog: \d+ items?, \d+ points/);
  });

  it('credits whoever chose the work, not whoever started the Sprint', () => {
    // Found by playing it: the Developers selected the Sprint Backlog, the Product Owner pressed
    // Start Sprint, and the Retrospective told the team the Product Owner had chosen the work.
    let s = playSprint();
    expect(decisionsIn(s, 1).find((d) => d.kind === 'forecast')!.by).toBe('developer');

    // ...and the same again with the Product Owner doing the starting, explicitly.
    s = initialZooState(3);
    s = reducer(s, { type: 'SET_PHASE', phase: 'planning' });
    s = reducer(s, { type: 'SET_SPRINT_GOAL', goal: 'Open the Big Cats zone' });
    const ready = s.backlog.filter((it) => it.status === 'backlog' && !it.unsized).slice(0, 2).map((it) => it.id);
    s = reducer(s, { type: 'SET_FORECAST', ids: ready, by: 'developer' });
    s = reducer(s, { type: 'PLAN_SPRINT', ids: ready, by: 'product_owner' });
    const chose = decisionsIn(s, s.sprintNumber).find((d) => d.kind === 'forecast')!;
    expect(chose.by, 'pressing Start Sprint was recorded as choosing the work').toBe('developer');
    expect(chose.what).toMatch(/^The Developers chose/);
  });

  it('records the Daily Scrum, day by day, held or skipped', () => {
    const s = playSprint();
    const scrums = decisionsIn(s, 1).filter((d) => d.kind === 'daily-scrum');
    expect(scrums.length, 'a whole Sprint went by with nothing said about the Daily Scrum').toBeGreaterThan(0);
    for (const d of scrums) expect(d.what).toMatch(/Day \d+: the Daily Scrum was (held|skipped)/);
  });

  it('records the Definition of Done being changed, and by whom', () => {
    let s = playSprint();
    s = reducer(s, { type: 'SET_DOD', dod: ['Meets its acceptance criteria'], by: 'scrum_master' });
    const dod = (s.decisions ?? []).filter((d) => d.kind === 'dod');
    expect(dod.length, 'the team rewrote their Definition of Done and the game said nothing').toBe(1);
    expect(dod[0].by).toBe('scrum_master');
    expect(dod[0].what).toMatch(/criteria became 1/);
  });

  it('says nothing when nothing changed', () => {
    // Setting the same Definition of Done again, or the WIP limit to what it already is, is not
    // a decision. A log full of non-events is a log nobody reads.
    let s = playSprint();
    const before = (s.decisions ?? []).length;
    s = reducer(s, { type: 'SET_DOD', dod: s.definitionOfDone });
    s = reducer(s, { type: 'SET_WIP_LIMIT', limit: s.wipLimit });
    expect((s.decisions ?? []).length, 'the game noticed something that did not happen').toBe(before);
  });

  it('keeps them across Sprints, so a habit reads as a habit', () => {
    const s = playSprint();
    expect(s.decisions?.every((d) => d.sprint >= 1), 'a decision was recorded against no Sprint').toBe(true);
    expect(kinds(decisionsIn(s, 1)), 'the first Sprint noticed nothing at all').not.toEqual([]);
  });
});

describe('noticing changes nothing', () => {
  it('is read by nothing that decides anything', () => {
    // The whole of increment one: the game pays attention and acts on none of it. Proved by
    // taking the record away and checking that everything which decides something still decides
    // the same thing. If this ever fails, a later increment has attached a cost quietly.
    const watched = playSprint(11);
    expect(watched.decisions?.length, 'nothing was noticed, so this proves nothing').toBeGreaterThan(2);
    const forgotten: ZooGameState = { ...watched, decisions: [], forecastBy: undefined };

    expect(sprintProgress(forgotten)).toEqual(sprintProgress(watched));
    expect(sprintCapacity(forgotten)).toEqual(sprintCapacity(watched));
    expect(goalMeasures(forgotten)).toEqual(goalMeasures(watched));
    expect(nextNudge(forgotten)?.id).toBe(nextNudge(watched)?.id);
    expect(retroQuestions(forgotten)).toEqual(retroQuestions(watched));

    // ...and a Sprint played on from either one ends in the same place.
    const on = (s: ZooGameState) => {
      let out = reducer(s, { type: 'SET_PHASE', phase: 'retro' });
      out = reducer(out, { type: 'NEXT_SPRINT', improvement: '' });
      return out.backlog.map((i) => `${i.id}:${i.status}`).join(',') + '|' + out.velocity.join(',');
    };
    expect(on(forgotten), 'the record changed what happened next').toBe(on(watched));
  });
});
