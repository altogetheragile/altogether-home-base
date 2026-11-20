import { describe, it, expect } from 'vitest';
import { initialZooState, DAY_SECONDS } from './config';
import { reducer } from './useZooGame';
import { splitEpic, planSprint } from './engine';
import { inspect, answerable } from './parkChecks';
import { emptyDesign } from './design';
import type { ZooGameState } from './types';

// sm12, sm15: "Priya accepted it · still to do: build it on the park ... she accepted it before it
// is built?" Seating's criteria are all the Product Owner's to judge, and the park inspector counted
// only the ones the park settles, so with none of those it offered "Ask Priya to check" before
// anything was on the park - and she said yes.

/** Under way, started, not built, with criteria only the Product Owner can judge. */
function startedNotBuilt(): { s: ZooGameState; id: string } {
  let s = splitEpic(initialZooState(1), 'bigcats', ['tiger', 'leopard', 'kiosk']);
  for (const it of s.backlog.filter((x) => x.unsized)) s = reducer(s, { type: 'ESTIMATE_ITEM', id: it.id, points: it.trueSize ?? 3 });
  const id = s.backlog.find((it) => it.category === 'enclosure')!.id;
  s = planSprint({ ...s, phase: 'planning' }, [id]);
  s = { ...s, dayStage: 'building', daySecondsLeft: DAY_SECONDS };
  s = reducer(s, { type: 'START_ITEM', id });
  const judged = ['Does it feel like a place to stop for a while?', 'Would you bring your family here?'];
  s = { ...s, backlog: s.backlog.map((it) => (it.id === id ? { ...it, acceptance: judged, design: undefined } : it)) };
  return { s, id };
}

describe('nothing built, nothing to check', () => {
  it('the criteria in this setup are all the Product Owner\'s to judge', () => {
    const { s, id } = startedNotBuilt();
    expect(s.backlog.find((it) => it.id === id)!.acceptance.some(answerable)).toBe(false);
  });

  it('the park inspector does not offer to ask before it is built', () => {
    const { s, id } = startedNotBuilt();
    expect(inspect(s, s.backlog.find((it) => it.id === id)!).ready).toBe(false);
  });

  it('asking anyway puts no question to the Product Owner', () => {
    const { s, id } = startedNotBuilt();
    const asked = reducer(s, { type: 'ASK_TO_CHECK', id });
    expect((asked.questions ?? []).some((q) => q.id === `check-${id}`)).toBe(false);
  });

  it('once it is built, it can be asked', () => {
    const { s, id } = startedNotBuilt();
    const built = { ...s, backlog: s.backlog.map((it) => (it.id === id ? { ...it, design: emptyDesign(it) } : it)) };
    expect(inspect(built, built.backlog.find((it) => it.id === id)!).ready).toBe(true);
    const asked = reducer(built, { type: 'ASK_TO_CHECK', id });
    expect((asked.questions ?? []).some((q) => q.id === `check-${id}`)).toBe(true);
  });
});
