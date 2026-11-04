import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { initialZooState } from './config';
import { reviewSprint, openReview, openGround } from './engine';
import { plotOrder } from './parkZones';
import { SprintReview } from './SprintReview';
import type { ZooGameState } from './types';

// "Open with the Sprint Goal as the headline, met or not met. Then what got Done. Everything else
// folds under More detail, and Round the room moves into the team chat." (Agreed 4 Nov 2026.)
//
// The first step opened on the bet, then the Product Goal's progress bar and its measures, and the
// Sprint Goal was a box under all of them: the one thing the Sprint promised was the fourth thing
// you read about it.

const reviewed = (open = 6, over: Partial<ZooGameState> = {}): ZooGameState => {
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
    ...over,
  } as ZooGameState;
  return openReview(reviewSprint(s));
};

const screen = (s: ZooGameState) => render(
  <MemoryRouter>
    <SprintReview state={s} onTakeSignal={() => {}} onContinue={() => {}} onSay={() => {}} />
  </MemoryRouter>,
).container;

describe('the Sprint Review opens on the Sprint Goal', () => {
  it('as the headline, before anything else the step says', () => {
    const c = screen(reviewed());
    const h = c.querySelector('h2')!;
    expect(h.closest('[data-part="review-goal"]'), 'the first heading is not the Sprint Goal').toBeTruthy();
    expect(h.textContent).toBe('Sprint Goal met');
    expect(c.querySelector('[data-part="review-goal"]')!.textContent).toMatch(/Open the first area/);
  });

  it('says not met when it was not', () => {
    const c = screen(reviewed(0));
    expect(c.querySelector('[data-part="review-goal"]')!.getAttribute('data-met')).toBe('no');
    expect(c.querySelector('h2')!.textContent).toBe('Sprint Goal not met');
  });

  it('says so when there was none, rather than claiming one was missed', () => {
    const c = screen(reviewed(6, { sprintGoal: '' }));
    expect(c.querySelector('h2')!.textContent).toBe('There was no Sprint Goal');
  });
});

describe('then what got Done', () => {
  it('lists it, and counts it against what was taken on', () => {
    const s = reviewed(4);
    const done = screen(s).querySelector('[data-part="review-done"]')!;
    expect(done.textContent).toMatch(/4 items/);
    for (const it of s.backlog.filter((x) => x.sprintNumber === 1 && x.status === 'open')) {
      expect(done.textContent, `${it.name} was Done and is not listed`).toContain(it.name);
    }
  });

  it('says nothing was Done when nothing was', () => {
    const done = screen(reviewed(0)).querySelector('[data-part="review-done"]')!;
    expect(done.textContent).toMatch(/Nothing met the Definition of Done/);
  });
});

describe('and everything else is folded', () => {
  it('under More detail, closed, naming what is in it', () => {
    const c = screen(reviewed());
    const more = c.querySelector('details[data-part="review-more"]') as HTMLDetailsElement;
    expect(more, 'nothing is folded').toBeTruthy();
    expect(more.open).toBe(false);
    expect(more.querySelector('summary')!.textContent).toMatch(/More detail/);
    expect(more.querySelector('summary')!.textContent).toMatch(/Product Goal progress/);
    // Nothing that used to open the step is in front of the fold.
    expect(more.textContent).toMatch(/Product Goal/);
    const before = c.querySelector('[data-part="review-done"]')!;
    expect(before.compareDocumentPosition(more) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('round the room', () => {
  it('is the team chat, not a card in the middle of the Review', () => {
    const c = screen(reviewed());
    const room = c.querySelector('[data-part="review-room"]')!;
    expect(room.querySelector('[data-part="team-chat"]'), 'the room is not a chat').toBeTruthy();
    expect(c.querySelector('[data-part="review-main"]')!.contains(room), 'the room is still inside the Review').toBe(false);
  });
});

describe('the header, once the Sprint is over', () => {
  it('gives the same verdict as the Review, not "Goal safe"', async () => {
    const { goalLine } = await import('./header');
    expect(goalLine(reviewed(0))).toEqual({ line: 'Sprint Goal not met', risk: true });
    expect(goalLine(reviewed())).toEqual({ line: 'Sprint Goal met', risk: false });
  });
});
