import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintReview } from './SprintReview';
import { SprintRetro } from './SprintRetro';
import { acceptSignal, declineSignal, decisionsIn, improvementsFrom, runDailyScrum, pullIntoSprint, dropFromSprint, splitEpic, estimateItem, reviewSprint } from './engine';
import { initialZooState, REFINE_COSTS } from './config';
import type { ZooGameState } from './types';

// The Review's decisions, the log's costs, and improvements with something behind them.
//
// Three things the live-app review asked for, and they are one idea: what a team decided, what it
// cost them, and what they might do differently - said with numbers rather than left to memory.

const noop = () => {};

const reviewed = (over: Partial<ZooGameState> = {}): ZooGameState => ({
  ...initialZooState(3), phase: 'review', sprintNumber: 1,
  lastReview: {
    overallHappiness: 46, totalAttendance: 900,
    segments: [{ segmentId: 'families', attendance: 450, happiness: 40, topExhibit: null, topExhibitShare: 0, truncationRate: 0, unmetNeeds: {} }],
    quotes: [], signals: [], nextAttendance: {},
  },
  signals: [
    { drivenBy: 'unmet:food', suggestion: 'Visitors want somewhere to eat', estimatedValue: 'high' },
    { drivenBy: 'crowding', suggestion: 'The Lion enclosure is crowded', estimatedValue: 'medium' },
  ],
  ...over,
} as unknown as ZooGameState);

describe('what the visitors said, as decisions', () => {
  it('offers both answers, not just the one the game wanted', () => {
    const state = reviewed();
    render(<MemoryRouter><SprintReview state={state} onTakeSignal={noop} onDeclineSignal={noop} onContinue={noop} /></MemoryRouter>);
    // The Review walks Done, then the visitors, then what we do about it.
    fireEvent.click(screen.getByRole('button', { name: /Next: the visitors/ }));
    fireEvent.click(screen.getByRole('button', { name: /Next: what we do about it/ }));
    expect(screen.getAllByRole('button', { name: 'Add to Backlog' }).length).toBe(2);
    expect(screen.getAllByRole('button', { name: 'Decline' }).length, 'declining was not offered at all').toBe(2);
  });

  it('records either answer, because the Retrospective reads them back', () => {
    const took = acceptSignal(reviewed(), 0);
    const one = decisionsIn(took, 1).filter((d) => d.kind === 'signal');
    expect(one.length, 'taking a signal was not recorded').toBe(1);
    expect(one[0].what).toMatch(/Took what the visitors said/);
    expect(one[0].by).toBe('product_owner');

    const turned = declineSignal(reviewed(), 0);
    const two = decisionsIn(turned, 1).filter((d) => d.kind === 'signal');
    expect(two.length, 'declining a signal was not recorded').toBe(1);
    expect(two[0].what).toMatch(/Turned down/);
    // ...and turning it down does not make the cause go away.
    expect(two[0].cost).toMatch(/comes back louder/);
    expect(turned.signals.length).toBe(1);
  });
});

describe('what the log costs', () => {
  const sprint = (over: Partial<ZooGameState> = {}): ZooGameState => ({
    ...initialZooState(3), phase: 'sprint', dayStage: 'dailyScrum', dayNumber: 2, sprintDays: 3,
    daySecondsLeft: 80, ...over,
  } as ZooGameState);

  it('says what holding the Daily Scrum cost, and what it caught', () => {
    // "Day 2: the Daily Scrum was held" teaches nothing. Beside "blocker cleared, 10% of the day"
    // it is the trade the event actually is.
    const s = sprint({ pendingImpediment: { id: 'i1', title: 'The paint is late', detail: 'stuck' } } as Partial<ZooGameState>);
    const held = decisionsIn(runDailyScrum(s), 1).find((d) => d.kind === 'daily-scrum')!;
    expect(held.cost, 'the Daily Scrum was logged with no cost beside it').toBeTruthy();
    expect(held.cost).toMatch(/The paint is late/);
    expect(held.cost).toMatch(/10% of the day/);
  });

  it('prices work pulled in and work dropped', () => {
    const base = { ...initialZooState(3), phase: 'sprint', sprintNumber: 1, dayNumber: 1 } as ZooGameState;
    const item = base.backlog.find((it) => !it.unsized && it.category !== 'epic')!;
    const pulled = pullIntoSprint(base, item.id);
    const pulledLog = decisionsIn(pulled, 1);
    expect(pulledLog[pulledLog.length - 1].cost, 'pulling work in was free in the log').toMatch(/points onto a forecast/);

    const dropped = dropFromSprint(pulled, item.id);
    const droppedLog = decisionsIn(dropped, 1);
    expect(droppedLog[droppedLog.length - 1].cost).toMatch(/came back out of the forecast/);
  });

  it('keeps one line a day for refining, and adds the seconds up', () => {
    // Four items sized on Tuesday is one thing that happened on Tuesday, not four log lines.
    const base = { ...initialZooState(3), phase: 'sprint', sprintNumber: 1, dayNumber: 2, daySecondsLeft: 90 } as ZooGameState;
    const items = base.backlog.filter((it) => it.status === 'backlog' && it.category !== 'epic').slice(0, 2);
    let s = base;
    for (const it of items) s = estimateItem(s, it.id, 3);
    const lines = decisionsIn(s, 1).filter((d) => d.kind === 'refinement');
    expect(lines.length, 'every act of refining took a line of its own').toBe(1);
    expect(lines[0].cost).toContain(`${REFINE_COSTS.estimate * items.length}s of build time`);
  });
});

describe('improvements drawn from the log', () => {
  const after = (over: Partial<ZooGameState> = {}): ZooGameState =>
    ({ ...initialZooState(3), phase: 'retro', sprintNumber: 1, ...over } as ZooGameState);

  it('offers what the Sprint gives evidence for, and says what put it there', () => {
    const skippedTwice = after({ decisions: [
      { sprint: 1, kind: 'daily-scrum', what: 'Day 1: the Daily Scrum was skipped.' },
      { sprint: 1, kind: 'daily-scrum', what: 'Day 2: the Daily Scrum was skipped.' },
    ] } as Partial<ZooGameState>);
    const opts = improvementsFrom(skippedTwice);
    const scrum = opts.find((o) => /Daily Scrum every day/.test(o.text));
    expect(scrum, 'a Sprint with two skipped Daily Scrums did not offer the habit').toBeTruthy();
    expect(scrum!.because, 'the option does not say what put it on the list').toMatch(/skipped 2 times/);
    expect(opts.every((o) => !!o.effect), 'an improvement with no effect is a poster').toBe(true);
  });

  it('always leaves a choice, and never invents a reason for it', () => {
    // A Retrospective with one option on it is not a Retrospective.
    const empty = improvementsFrom(after());
    expect(empty.length, 'a clean Sprint was offered nothing to choose between').toBeGreaterThanOrEqual(3);
    expect(empty.every((o) => !!o.effect)).toBe(true);
    expect(empty.every((o) => o.because === undefined), 'the game invented a reason from an empty log').toBe(true);

    // ...and with one thing in the log, that one leads and the rest follow it.
    const one = improvementsFrom(after({ decisions: [
      { sprint: 1, kind: 'refinement', what: 'No time set aside this Sprint to refine the Backlog.' },
    ] } as Partial<ZooGameState>));
    expect(one.length).toBeGreaterThanOrEqual(3);
    expect(one[0].because, 'the option the log pointed at was not first').toBeTruthy();
  });

  it('shows them on the screen with their effects', () => {
    const state = after({ decisions: [{ sprint: 1, kind: 'unready', what: 'Something not ready went in.' }] } as Partial<ZooGameState>);
    render(<MemoryRouter><SprintRetro state={state} onNextSprint={noop} onSetDod={noop} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Next: what we will change/ }));
    const ready = screen.getByRole('button', { name: /Definition of Ready/ });
    expect(within(ready).getByText(/Planning warns/)).toBeTruthy();
    expect(ready.textContent).toMatch(/not ready went into a Sprint/);
  });
});

describe('two defects the review found', () => {
  it('puts what was split above what is left of the epic', () => {
    const base = initialZooState(3);
    const epic = base.backlog.find((it) => it.category === 'epic' && (it.epicMembers ?? []).length > 1)!;
    const one = epic.epicMembers![0];
    const after = splitEpic(base, epic.id, [one.id]);
    const ids = after.backlog.map((it) => it.id);
    const made = ids.findIndex((id) => id === one.id || id === `${one.id}-enc`);
    const left = ids.indexOf(epic.id);
    expect(left, 'the epic vanished when only part of it was split').toBeGreaterThan(-1);
    expect(made, 'what was split out is still listed under the epic it came from').toBeLessThan(left);
  });

  it('remembers what a carried-over item was sized at', () => {
    // It came back as 3 having been 5, with nothing saying why. The number is right - the
    // Developers re-size what is left of a thing every day - so the fault was the silence.
    const base = { ...initialZooState(3), phase: 'sprint', sprintNumber: 1, dayNumber: 3, sprintDays: 3 } as ZooGameState;
    const item = base.backlog.find((it) => !it.unsized && it.category !== 'epic')!;
    const inSprint = {
      ...base,
      committedIds: [item.id],
      backlog: base.backlog.map((it) => (it.id === item.id
        ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true, estimate: 5, trueSize: 5,
          tasks: [{ id: 'a', label: 'one', done: true }, { id: 'b', label: 'two', done: false }] }
        : it)),
    } as ZooGameState;
    const after = reviewSprint(inSprint).backlog.find((it) => it.id === item.id)!;
    expect(after.carriedOver, 'unfinished work did not come back to the Backlog').toBe(true);
    expect(after.estimate, 'it came back at its old size, as though nothing had been built').toBeLessThan(5);
    expect(after.wasEstimate, 'nothing remembers what it was, so the change cannot be explained').toBe(5);
  });
});
