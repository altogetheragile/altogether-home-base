import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { TaskEditor } from './Board';
import { initialZooState } from './config';
import { generateImpediment, endDay, answerImpediment, planSprint, setItemTasks, availableItems, readyForDone } from './engine';
import type { BacklogItem, SprintTask, ZooGameState } from './types';

// Three more from the scrum-master playtest sm7.

describe('a plan written by hand keeps the Definition of Done\'s sign-off', () => {
  it('so the item cannot reach Done without the Product Owner being asked', () => {
    // The Lion reached Done on one hand-written step, then sat "not open to visitors yet" for the
    // rest of the Sprint: opening waits for an acceptance nobody had been able to ask for.
    const base = initialZooState(1);
    const id = availableItems(base)[0].id;
    let s = setItemTasks(base, id, [{ id: 'x', label: 'Build it', done: false }]);
    s = planSprint(s, [id]);
    const it = s.backlog.find((x) => x.id === id)!;
    expect(it.tasks!.map((t) => t.label)).toContain("Get the PO's sign-off");
    const built = { ...it, tasks: it.tasks!.map((t) => (t.label === 'Build it' ? { ...t, done: true } : t)) };
    expect(readyForDone(built), 'Done with the sign-off outstanding').toBe(false);
  });
});

describe('a blocker dealt with is not handed over again the next morning', () => {
  /** A game, Sprint and pair of days on which the daily roll lands on the same blocker twice. */
  function twice(): { seed: number; day: number } {
    for (let seed = 1; seed < 400; seed += 1) {
      for (let day = 2; day <= 4; day += 1) {
        const a = generateImpediment(seed, 1, day), b = generateImpediment(seed, 1, day + 1);
        if (a && b && a.title === b.title) return { seed, day };
      }
    }
    throw new Error('no repeat found to test with');
  }

  it('removed one morning, it does not surface again in the same Sprint', () => {
    const { seed, day } = twice();
    const base = initialZooState(1);
    const id = availableItems(base)[0].id;
    let s: ZooGameState = { ...planSprint({ ...base, gameSeed: seed }, [id]), phase: 'sprint', dayStage: 'building',
      dayNumber: day - 1, sprintDays: day + 3, dailyScrumAt: 'start', trainerLed: false } as ZooGameState;
    s = endDay(s);
    expect(s.dayNumber).toBe(day);
    const first = s.pendingImpediment;
    expect(first?.title, 'the roll this test was built on').toBe(generateImpediment(seed, 1, day)?.title);
    s = answerImpediment(s, 'remove');
    s = endDay({ ...s, dayStage: 'building' });
    expect(s.dayNumber).toBe(day + 1);
    expect(s.pendingImpediment?.title ?? null, 'the same blocker again, the morning after it was removed').not.toBe(first?.title);
  });
});

describe('Enter in a step box', () => {
  const lion = (tasks: SprintTask[]): BacklogItem => ({
    id: 'enc', name: 'Lion Enclosure', category: 'enclosure', zone: 'Big Cats', status: 'committed',
    sprintNumber: 1, estimate: 5, acceptance: [], acConfirmed: [], tasks,
  } as unknown as BacklogItem);
  function Editor() {
    const [tasks, setTasks] = useState<SprintTask[]>([{ id: 'a', label: 'Fence it', done: false }]);
    return <TaskEditor item={lion(tasks)} onSetTasks={(_id, next) => setTasks(next)} />;
  }

  it('adds the next step and puts the cursor in it', () => {
    render(<Editor />);
    const first = screen.getByDisplayValue('Fence it');
    first.focus();
    fireEvent.keyDown(first, { key: 'Enter' });
    const boxes = screen.getAllByPlaceholderText('A step to build it');
    expect(boxes).toHaveLength(2);
    expect(document.activeElement).toBe(boxes[1]);
  });

  it('does nothing on an empty step', () => {
    render(<Editor />);
    fireEvent.keyDown(screen.getByDisplayValue('Fence it'), { key: 'Enter' });
    const empty = screen.getAllByPlaceholderText('A step to build it')[1];
    fireEvent.keyDown(empty, { key: 'Enter' });
    expect(screen.getAllByPlaceholderText('A step to build it')).toHaveLength(2);
  });
});
