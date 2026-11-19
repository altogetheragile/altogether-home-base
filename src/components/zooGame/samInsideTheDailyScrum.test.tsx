import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { SamSays } from './SamSays';
import { forgetQuiet, samScreen } from './samLines';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// Sam at the Daily Scrum, inside the event rather than over it.
//
// From the scrum-master playtest sm7: 24 steps with nothing it could press. Sam's prompt was a
// modal dialog opened over the Daily Scrum's modal dialog, and each hides everything outside itself
// from assistive technology - so a screen reader was left with neither "Got it" nor the stand-up
// answers. `getByRole` leaves out what assistive technology cannot reach, which is the point here.

const noop = () => {};
const morning = (): ZooGameState => {
  const base = initialZooState(3);
  const take = base.backlog.filter((it) => !it.unsized && it.category !== 'epic').slice(0, 2);
  return {
    ...base, phase: 'sprint', dayStage: 'dailyScrum', dayNumber: 2, sprintDays: 3,
    sprintGoal: 'Deliver the Big Cats zone so visitors have more to enjoy',
    scrumSecondsLeft: 17, daySecondsLeft: 60,
    committedIds: take.map((it) => it.id),
    forecastPoints: take.reduce((s, it) => s + it.estimate, 0),
    backlog: base.backlog.map((it) => (take.some((t) => t.id === it.id)
      ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)),
  } as ZooGameState;
};

/** The page as a solo game draws it at the Daily Scrum: the board with the event open, and Sam. */
const page = (state: ZooGameState) => render(
  <MemoryRouter>
    <SprintBoard state={state} solo
      onEstimate={noop} onToggleTask={noop} onFinishItem={noop} onStartItem={noop} onPull={noop}
      onSplitEpic={noop} onAssignDev={noop} onOpen={noop} onEndDay={noop} onHoldDailyScrum={noop}
      onSkipDailyScrum={noop} onStartDay={noop} onBuilding={noop} onDropFromSprint={noop} onSay={noop} />
    <SamSays screen={samScreen(state, { beforeStart: false, building: null, metTeam: true })} name={state.team.scrumMaster.name} />
  </MemoryRouter>,
);

beforeEach(() => { forgetQuiet(); });

describe('Sam at the Daily Scrum', () => {
  it('is the Daily Scrum screen Sam speaks on', () => {
    expect(samScreen(morning(), { beforeStart: false, building: null, metTeam: true })).toBe('daily-scrum');
  });

  it('speaks inside the event, so a screen reader can reach Sam and the event together', () => {
    page(morning());
    expect(screen.getAllByRole('dialog'), 'a second dialog over the Daily Scrum').toHaveLength(1);
    const event = screen.getByRole('dialog');
    expect(event.querySelector('[data-part="sam-says"]'), 'Sam is not inside the Daily Scrum').not.toBeNull();
    expect(screen.getByRole('button', { name: 'Got it' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Where I am against the Goal/ })).toBeTruthy();
  });

  it('goes on "Got it" and leaves the event as it was', () => {
    page(morning());
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    expect(screen.queryByRole('button', { name: 'Got it' })).toBeNull();
    expect(screen.getByRole('button', { name: /Where I am against the Goal/ })).toBeTruthy();
  });

  it('does not come back the next morning in the same visit', () => {
    const first = page(morning());
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    first.unmount();
    page({ ...morning(), dayNumber: 3 });
    expect(screen.queryByRole('button', { name: 'Got it' })).toBeNull();
  });
});
