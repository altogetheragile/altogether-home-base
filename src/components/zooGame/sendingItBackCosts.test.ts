import { describe, it, expect } from 'vitest';
import { initialZooState, DAY_SECONDS } from './config';
import { startItem, sendItemBack, otherDevs, heldBy, stillBuilding, workOwed } from './engine';
import { aiDevTurn } from './aiSeats';
import { readyToAsk } from './parkChecks';
import type { ZooGameState } from './types';

// Not accepting the work costs the Sprint the time it took.
//
// "The toilets and seating area are placed wrongly but when I reject them they are immediately
// submitted for approval again."
//
// The copy said "finishing it again costs Sprint time" and it did not. A card a colleague is
// holding carries the seconds it owes, counted down by the day's clock - and once it was built
// those seconds were nought. Sending it back cleared the design and left the clock at nought, so
// the colleague rebuilt it on the very next beat, for free, and asked again. A rejection with no
// cost is not a rejection; it is a button that puts the same question back on the screen.

const building = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const ready = base.backlog
    .filter((it) => !it.unsized && !['epic', 'exhibit'].includes(it.category)).slice(0, 4);
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    daySecondsLeft: DAY_SECONDS, wipLimit: 0,
    committedIds: ready.map((it) => it.id),
    backlog: base.backlog.map((it) => (ready.some((r) => r.id === it.id)
      ? { ...it, status: 'committed' as const, sprintNumber: 1, pos: { x: 200, y: 300 } } : it)),
    ...over,
  } as ZooGameState;
};

/** A colleague's card, built, with one criterion the park cannot answer left unmet - which is what
 *  a Product Owner sends something back over. */
const builtByBen = () => {
  let s = building();
  const [ben] = otherDevs(s);
  const card = s.backlog.find((it) => it.status === 'committed')!;
  s = startItem(s, card.id, 'developer', ben.id);
  // Time passing, without spending a day the Sprint has not got: a large enclosure owes more
  // seconds than a day holds, and ticking through would end the day rather than build the card.
  // What the owed seconds mean is tested in `theOtherDevsAreWorking`; this is about what happens
  // when the work comes back.
  s = { ...s, backlog: s.backlog.map((it) => (it.id === card.id ? { ...it, owedSeconds: 0 } : it)) };
  s = { ...s, backlog: s.backlog.map((it) => (it.id === card.id
    ? { ...it, design: { parts: {}, colors: {} } as never,
      acceptance: ['Is it what you asked for?'], acConfirmed: [false] } : it)) } as ZooGameState;
  return { s, ben, card };
};

describe('sending it back', () => {
  it('puts the build on the bench rather than throwing it away', () => {
    const { s, card } = builtByBen();
    const back = sendItemBack(s, card.id);
    const now = back.backlog.find((it) => it.id === card.id)!;
    expect(now.design, 'it is still Done, so nothing was sent anywhere').toBeUndefined();
    expect(now.draftDesign, 'the work they did was thrown away').toBeTruthy();
    expect(now.status).toBe('committed');
  });

  it('costs them the time it took, all over again', () => {
    const { s, ben, card } = builtByBen();
    expect(heldBy(s, ben.id), 'it is still in his hands, so it was never built').toBeUndefined();
    const back = sendItemBack(s, card.id);
    const now = back.backlog.find((it) => it.id === card.id)!;
    expect(now.owedSeconds, 'building the wrong thing cost the Sprint nothing').toBeGreaterThan(0);
    expect(now.owedSeconds, 'it costs a different amount the second time')
      .toBe(now.workSeconds ?? workOwed(back, now, ben.id));
  });

  it('so it is not handed straight back for approval', () => {
    // The whole of the report. One beat after the rejection, the colleague was rebuilding it and
    // the question was back on the rail.
    const { s, ben, card } = builtByBen();
    const back = sendItemBack(s, card.id);
    const move = aiDevTurn(back, ben);
    expect(move?.action.type, 'he rebuilt it the instant it came back, for nothing')
      .not.toBe('BUILD_ITEM');
    expect(readyToAsk(back, back.backlog.find((it) => it.id === card.id)!),
      'it is ready to be asked about again before anybody has touched it').toBe(false);
    expect(stillBuilding(back.backlog.find((it) => it.id === card.id)!),
      'it owes no time, so the next beat finishes it').not.toBeNull();
  });

  it('and he does finish it again, once the time has actually been spent', () => {
    // Not a punishment and not a wall: the work gets done, it just costs what it cost.
    const { s, ben, card } = builtByBen();
    const sent = sendItemBack(s, card.id);
    const back = { ...sent, backlog: sent.backlog.map((it) => (it.id === card.id
      ? { ...it, owedSeconds: 0 } : it)) } as ZooGameState;
    expect(aiDevTurn(back, ben)?.action, 'the time was spent and he still has not rebuilt it')
      .toMatchObject({ type: 'BUILD_ITEM', id: card.id });
  });

  it('charges nothing extra for YOUR own card, because the day already does', () => {
    // What yours costs is however long you spend on it, and the day's clock charges you for that.
    // Priced as well and you would pay twice.
    let s = building();
    const card = s.backlog.find((it) => it.status === 'committed')!;
    s = startItem(s, card.id);
    s = { ...s, backlog: s.backlog.map((it) => (it.id === card.id
      ? { ...it, design: { parts: {}, colors: {} } as never,
        acceptance: ['Is it what you asked for?'], acConfirmed: [false] } : it)) } as ZooGameState;
    const back = sendItemBack(s, card.id);
    expect(back.backlog.find((it) => it.id === card.id)!.owedSeconds,
      'your own rebuild was priced, so you pay for it twice').toBeUndefined();
  });

  it('refuses to send back work that meets every criterion', () => {
    // A Product Owner who wants something else says so by changing the criteria, not by refusing
    // work that meets them. This was already true and is worth keeping true.
    const { s, card } = builtByBen();
    const met = { ...s, backlog: s.backlog.map((it) => (it.id === card.id
      ? { ...it, acConfirmed: [true] } : it)) } as ZooGameState;
    expect(sendItemBack(met, card.id), 'work that met every criterion was sent back').toBe(met);
  });
});
