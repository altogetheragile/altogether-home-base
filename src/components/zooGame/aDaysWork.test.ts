import { describe, it, expect } from 'vitest';
import { initialZooState, DAY_SECONDS, TRUE_VELOCITY_PER_DAY } from './config';
import { startOnTheBoard, buildItem, secondsPerPoint, dayCanAfford, nothingFitsToday, teamIsBusy } from './engine';
import { reducer } from './useZooGame';
import { presetFor } from './design';
import type { ZooGameState, BacklogItem } from './types';

// What a day's work costs, and who pays for it.
//
// Reported from playing it: "it only takes a day to get through the 3 PBIs." A Sprint priced at
// three days went in one, and with it went everything the days are for - the Daily Scrum with
// something to inspect, a burndown that bends, work carried over, running out of time.
//
// The cause was the same shape as most of this project's faults: one question with two answers.
// "What does building this cost the Sprint?" depended on WHO built it. A seat played by the game
// was charged `secondsPerPoint * estimate` and could not start what the day could not afford. A
// person was charged nothing at all and gated on nothing, so their work cost whatever their hands
// took - and a person who knows the controls is three or four times faster than the economy the
// whole game turns on.
//
// The work costs what the work costs, whoever does it.

const sprint = (): ZooGameState => startOnTheBoard(initialZooState(1) as ZooGameState);
const inSprint = (s: ZooGameState): BacklogItem[] => s.backlog.filter((it) => it.status === 'committed');
const freshDay = (s: ZooGameState): ZooGameState => ({ ...s, owedSeconds: 0, daySecondsLeft: DAY_SECONDS });

describe('building costs the day', () => {
  it('charges the same whoever built it', () => {
    const s = sprint();
    const it = inSprint(s)[0];
    const byHand = buildItem(s, it.id, presetFor(it));
    const byTheGame = reducer(s, { type: 'BUILD_ITEM', id: it.id, byTheGame: true });
    expect(byHand.owedSeconds, 'a person built it and the Sprint paid nothing').toBeGreaterThan(0);
    expect(byTheGame.owedSeconds, 'the two of them building the same thing cost the Sprint differently')
      .toBe(byHand.owedSeconds);
  });

  it('charges what the item is sized at, in the same seconds the forecast is priced in', () => {
    const s = sprint();
    const it = inSprint(s)[0];
    expect(buildItem(s, it.id, presetFor(it)).owedSeconds)
      .toBe(Math.round(secondsPerPoint(s) * (it.estimate ?? 0)));
  });

  it('charges it once, not every time the design is touched', () => {
    const s = sprint();
    const it = inSprint(s)[0];
    const once = buildItem(s, it.id, presetFor(it));
    const again = buildItem(once, it.id, presetFor(it));
    expect(again.owedSeconds, 'placing it a second time was charged as a second build')
      .toBe(once.owedSeconds);
  });

  it('leaves the team visibly busy with it, so the seats do not work on top of them', () => {
    const s = sprint();
    expect(teamIsBusy(s), 'the team was busy before anybody started anything').toBe(false);
    expect(teamIsBusy(buildItem(s, inSprint(s)[0].id, presetFor(inSprint(s)[0]))),
      'work was taken on and nobody was working').toBe(true);
  });
});

describe('what a point of work costs', () => {
  // It used to be worked out from the team's own first-Sprint capacity guess, which was deliberately
  // an over-guess. So guessing high made every point cheaper in exactly the proportion you had
  // over-guessed: the mistake paid for itself, and the first Sprint's work came to about two thirds
  // of the days it had. An opinion about yourself cannot be allowed to change what the work costs.

  it('is a fact about the work, not the team’s opinion of themselves', () => {
    const s = sprint();
    expect(secondsPerPoint(s), 'a point is priced at something other than what a team can really do')
      .toBeCloseTo(DAY_SECONDS / TRUE_VELOCITY_PER_DAY, 5);
  });

  it('follows the team once they have measured themselves', () => {
    const s = sprint();
    const fast = { ...s, velocity: [30], velocityDays: [s.sprintDays] } as ZooGameState;
    const slow = { ...s, velocity: [8], velocityDays: [s.sprintDays] } as ZooGameState;
    expect(secondsPerPoint(fast), 'a team that got through more still pays the same for a point')
      .toBeLessThan(secondsPerPoint(s));
    expect(secondsPerPoint(slow), 'a team that got through less is not given longer for a point')
      .toBeGreaterThan(secondsPerPoint(s));
  });
});

describe('a Sprint takes a Sprint', () => {
  it('costs about a Sprint to build what the first Sprint was given', () => {
    // The report, as a number. The board hands you three items on day one; they have to be about
    // three days of work, or the days after the first have nothing in them.
    const s = sprint();
    const owed = inSprint(s).reduce((n, it) => n + secondsPerPoint(s) * (it.estimate ?? 0), 0);
    const aSprint = DAY_SECONDS * s.sprintDays;
    expect(owed, 'the first Sprint is not a Sprint of work').toBeGreaterThan(aSprint * 0.9);
    expect(owed, 'the first Sprint cannot be finished in the days it has').toBeLessThanOrEqual(aSprint);
  });

  it('gives every day of it something to build', () => {
    // Reported from playing it: "it only takes a day to get through the 3 PBIs." Played by somebody
    // who never dithers - the moment the day can pay for something, they start it - the work should
    // still run out at about the same time the Sprint does.
    let s = sprint();
    const startedOn: number[] = [];
    for (let i = 0; i < 2000 && s.phase === 'sprint'; i += 1) {
      if (s.dayStage === 'dailyScrum') { s = reducer(s, { type: 'SKIP_DAILY_SCRUM' }); continue; }
      if (s.dayStage !== 'building') { s = reducer(s, { type: 'START_DAY' }); continue; }
      const next = s.backlog.find((it) => it.status === 'committed' && !it.design && dayCanAfford(s, it));
      if (next) { s = reducer(s, { type: 'BUILD_ITEM', id: next.id, design: presetFor(next) }); startedOn.push(s.dayNumber); }
      s = reducer(s, { type: 'TICK_DAY' });
    }
    expect(s.phase, 'the Sprint never reached the Review').toBe('review');
    expect(new Set(startedOn).size, `the whole Sprint was built on day ${startedOn.join(', day ')}`)
      .toBe(s.sprintDays);
    expect(s.backlog.filter((it) => it.status === 'committed' && !it.design), 'and none of it was left unbuilt')
      .toEqual([]);
  });

  it('will not let a day start work it cannot pay for', () => {
    const s = sprint();
    const big = [...inSprint(s)].sort((a, b) => (b.estimate ?? 0) - (a.estimate ?? 0))[0];
    const nearlyOver = { ...s, daySecondsLeft: 8 } as ZooGameState;
    expect(dayCanAfford(nearlyOver, big), 'eight seconds of the day paid for the biggest item in it').toBe(false);
    expect(buildItem(nearlyOver, big.id, presetFor(big)), 'it was built anyway, on a day that had nothing left')
      .toBe(nearlyOver);
  });

  it('counts what is already owed as time that is spoken for', () => {
    // Otherwise everything in the Sprint can be started in the first seconds of Day 1 - each one
    // affordable on its own - and the debt evaporates when the day ends. That is a work-in-progress
    // limit with nothing behind it.
    const s = freshDay(sprint());
    const [first, second] = [...inSprint(s)].sort((a, b) => (b.estimate ?? 0) - (a.estimate ?? 0));
    expect(dayCanAfford(s, second), 'this test needs a second item a fresh day could take').toBe(true);
    const started = buildItem(s, first.id, presetFor(first));
    expect(dayCanAfford(started, second),
      'a day already spoken for offered to pay for another item as well').toBe(false);
  });

  it('says so on the board, rather than standing still without a reason', () => {
    const s = sprint();
    expect(nothingFitsToday(s), 'a fresh day had no room in it for anything').toBe(false);
    const spent = { ...s, daySecondsLeft: 4 } as ZooGameState;
    expect(nothingFitsToday(spent), 'the day was spent and the board said nothing').toBe(true);
  });
});
