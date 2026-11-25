import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { initialZooState } from './config';
import { writeBacklog, reviewSprint, openReview, openGround } from './engine';
import { checkCriterion } from './parkChecks';
import { presetFor } from './design';
import { plotOrder } from './parkZones';
import { SprintReview } from './SprintReview';
import type { ZooGameState, BacklogItem } from './types';

// The 24th scrum-master playtest.
//
// "The Interior panel shows Water at 1 but the acceptance criterion says 'no shelter or planting
// yet'. Water counts as shelter or planting presumably": the habitat check needs all three - ground,
// shelter or planting, and water - and said what was missing joined with "or", which read as a
// choice. It now says what is in, and that it still needs the rest, joined with "and".
//
// "No item was starred as essential to the Sprint Goal... But it also says 'Left unfinished:
// nothing', so this warning seems..." (sm23 and sm24): the warning is about unfinished work, so it
// is only said when some was left.

const asks = 'Can I tell an animal lives here, not a shed?';
const habitat = (design: Record<string, unknown>): { s: ZooGameState; item: BacklogItem } => {
  const s = writeBacklog({ ...initialZooState(1), backlog: [] } as ZooGameState,
    { zones: ['Big Cats', 'Forest'], audience: 'families' as const, firstZone: 'Big Cats' }, { firstAreaRefined: true });
  const pen = s.backlog.find((it) => it.category === 'enclosure')!;
  const item = { ...pen, design: { ...presetFor(pen), ...design } } as BacklogItem;
  return { s: { ...s, backlog: s.backlog.map((it) => (it.id === pen.id ? item : it)) } as ZooGameState, item };
};

describe('a home needs all three, and says so', () => {
  it('joins what is missing with "and", never "or" between them', () => {
    const { s, item } = habitat({ flora: [], water: [], colors: {} });
    const v = checkCriterion(s, item, asks)!;
    expect(v.met).toBe(false);
    expect(v.evidence).toMatch(/^still needs ground, shelter or planting and water - under Surface and Interior$/);
  });

  it('with water in, says the water is in and what is still needed', () => {
    const { s, item } = habitat({ flora: [], water: [{ type: 'pond', x: 0.5, y: 0.5 }], colors: { ground: '#c9a36b' } });
    const v = checkCriterion(s, item, asks)!;
    expect(v.met).toBe(false);
    expect(v.evidence).toBe('ground and water in; still needs shelter or planting - under Interior');
  });
});

describe('the Review only warns about unfinished work when some was left', () => {
  const reviewed = (open: number): ZooGameState => {
    let s = initialZooState(3) as ZooGameState;
    for (const zone of plotOrder(s)) s = openGround({ ...s, value: 99_999 } as ZooGameState, zone);
    const take = s.backlog.filter((it) => !it.unsized && it.category !== 'epic').slice(0, 6);
    s = {
      ...s, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 3, sprintDays: 3,
      daySecondsLeft: 4, forecastPoints: take.reduce((n, it) => n + it.estimate, 0),
      sprintGoal: 'Open the first area with something worth walking to.',
      committedIds: take.map((it) => it.id),
      backlog: s.backlog.map((it) => {
        const k = take.findIndex((t) => t.id === it.id);
        return k < 0 ? it : { ...it, status: (k < open ? 'open' : 'committed') as 'open', sprintNumber: 1, started: k < open,
          signedOff: k < open, design: k < open ? { parts: {}, colors: {} } as never : undefined };
      }),
    } as ZooGameState;
    return openReview(reviewSprint(s));
  };
  const text = (s: ZooGameState) => render(
    <MemoryRouter><SprintReview state={s} onTakeSignal={() => {}} onContinue={() => {}} onSay={() => {}} onCallGoal={() => {}} /></MemoryRouter>,
  ).container.textContent!;

  it('says nothing about it when everything got Done', () => {
    expect(text(reviewed(6))).not.toMatch(/cannot tell which of the unfinished work/);
  });
  it('still says it when work was left', () => {
    expect(text(reviewed(4))).toMatch(/cannot tell which of the unfinished work/);
  });
});
