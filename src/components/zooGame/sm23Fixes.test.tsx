import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DailyScrum } from './DailyScrum';
import { askIfDue } from './engine';
import { initialZooState, DAY_SECONDS } from './config';
import type { ZooGameState } from './types';

// The 23rd scrum-master playtest.
//
// "The screen says 'WAITING ON PRODUCT OWNER' and 'Ada: Rounded or octagon for Tiger Enclosure?'
// but Ada is listed as a Developer (YOU)": the game had the player's own Developer ask the Product
// Owner, so the player was asking and being asked at once. A teammate asks now.
//
// "The timebox is 0:30 left but also says '15 minutes in the Guide'... ambiguous" (also sm21, sm22):
// the label now says the clock is the game's seconds and the fifteen minutes are the Guide's.

const building = (assigned: number[]): ZooGameState => {
  const base = initialZooState(3);
  const enc = base.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    daySecondsLeft: DAY_SECONDS, committedIds: [enc.id],
    backlog: base.backlog.map((it) => (it.id === enc.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true, assignedDevs: assigned.map((i) => base.team.developers[i].id) }
      : it)),
  } as ZooGameState;
};

describe('a teammate asks the Product Owner, not you', () => {
  it('is asked by somebody else working the item when there is one', () => {
    const s = askIfDue(building([0, 2]));
    expect(s.questions?.[0].from).toBe(s.team.developers[2].name);
  });
  it('is asked by another Developer when only you are on the item', () => {
    const s = askIfDue(building([0]));
    expect(s.questions?.[0].from, 'your own Developer asked the question').not.toBe(s.team.developers[0].name);
  });
});

describe('the Daily Scrum timebox says whose clock it is', () => {
  it('names the game seconds and the Guide’s fifteen minutes', () => {
    const s = { ...initialZooState(3), phase: 'sprint', dayStage: 'dailyScrum', sprintNumber: 1, dayNumber: 2 } as ZooGameState;
    const { container } = render(<MemoryRouter><DailyScrum state={s} onHold={() => {}} onSkip={() => {}} onDrop={() => {}} onAnswer={() => {}} /></MemoryRouter>);
    expect(container.querySelector('[data-part="timebox-scale"]')?.textContent).toMatch(/Game seconds\. The Guide’s timebox is 15 minutes\./);
  });
});
