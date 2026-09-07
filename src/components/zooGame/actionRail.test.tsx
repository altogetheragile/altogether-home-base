import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ActionRail } from './ActionRail';
import { initialZooState } from './config';
import type { ZooGameState, BacklogItem } from './types';

// One line at the foot of the screen, and the only place the game asks for anything.
//
// The panel it replaces did three jobs at once - things to answer, things to know, and a log of what
// had happened - and took a quarter of the screen to do them badly. What needs a click is here. What
// needs no click is a note in Learn. What already happened is the decision log, also in Learn.

const sprint = (over: Partial<ZooGameState> = {}, item: Partial<BacklogItem> = {}): ZooGameState => {
  const base = initialZooState(3);
  const held = base.backlog.find((it) => !it.unsized && it.category === 'enclosure')!;
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1, daySecondsLeft: 80,
    committedIds: [held.id],
    backlog: base.backlog.map((it) => (it.id === held.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true, assignedDevs: ['dev1'], ...item }
      : it)),
    ...over,
  } as ZooGameState;
};
const design = { parts: {}, colors: {} } as unknown as BacklogItem['design'];

const rail = (state: ZooGameState, props: Record<string, unknown> = {}) => render(
  <MemoryRouter><ActionRail state={state} {...props} /></MemoryRouter>,
);

describe('the rail', () => {
  it('says what the team is on when nothing is waiting', () => {
    // A line that vanishes is a line you stop reading, so it always says something.
    const { container } = rail(sprint({}, { design }));
    const line = container.querySelector('[data-part="action-rail"]')!;
    expect(line, 'the rail is not on the screen').toBeTruthy();
    expect(line.textContent).toMatch(/Building Lion Enclosure/);
  });

  it('carries the Developers’ question, with the answers on the line', () => {
    const s = sprint({}, { design });
    const item = s.backlog.find((it) => it.started)!;
    const onAnswerPlacement = vi.fn();
    const asked = { ...s, pendingPlacement: { itemId: item.id, askedAt: 80 } } as unknown as ZooGameState;
    const { container } = rail(asked, { onAnswerPlacement });
    const line = container.querySelector('[data-part="action-rail"]')!;
    expect(line.textContent, 'the question is not on the rail').toMatch(/Where should Lion Enclosure go/);
    expect(line.textContent, 'the rail does not say whose call it is').toMatch(/Product Owner/i);
    fireEvent.click(screen.getByRole('button', { name: 'You choose' }));
    expect(onAnswerPlacement, 'the answer on the line did nothing').toHaveBeenCalledWith(item.id, 'them');
  });

  it('asks whether Done work goes live now or later', () => {
    // The Review is not the gate: work can go live the day it is Done, and holding it is a decision.
    const onOpen = vi.fn();
    const s = sprint({}, {
      design, status: 'done', acConfirmed: [true, true, true, true],
      tasks: [{ id: 't', label: 'Get the PO’s sign-off', done: true }],
    } as Partial<BacklogItem>);
    const { container } = rail(s, { onOpen });
    expect(container.textContent).toMatch(/Done and visitors cannot see it/);
    fireEvent.click(screen.getByRole('button', { name: /Open it now/ }));
    expect(onOpen).toHaveBeenCalled();
  });

  it('shows one at a time, and counts what is still waiting', () => {
    const s = sprint({}, { design });
    const item = s.backlog.find((it) => it.started)!;
    const both = {
      ...s,
      pendingPlacement: { itemId: item.id, askedAt: 80 },
      backlog: s.backlog.map((it) => (it.id === item.id ? it : (it.status === 'backlog' && it.category === 'path'
        ? { ...it, status: 'done' as const, sprintNumber: 1, design, acConfirmed: it.acceptance.map(() => true),
          tasks: [{ id: 't', label: 'Get the PO’s sign-off', done: true }] }
        : it))),
    } as unknown as ZooGameState;
    const { container } = rail(both, { onAnswerPlacement: () => {}, onOpen: () => {} });
    expect(container.textContent, 'both were shown at once, which is a panel again').toMatch(/more/);
    const first = container.querySelector('[data-part="action-rail"]')!.textContent;
    fireEvent.click(screen.getByRole('button', { name: /more/ }));
    expect(container.querySelector('[data-part="action-rail"]')!.textContent,
      'the rail does not move on to the next one').not.toBe(first);
  });

  it('has nothing to dismiss - an action is answered or it waits', () => {
    const s = sprint({}, { design });
    const item = s.backlog.find((it) => it.started)!;
    const asked = { ...s, pendingPlacement: { itemId: item.id, askedAt: 80 } } as unknown as ZooGameState;
    const { container } = rail(asked, { onAnswerPlacement: () => {} });
    const labels = [...container.querySelectorAll('button')].map((b) => (b.textContent ?? '').toLowerCase());
    expect(labels.some((l) => /dismiss|got it|close|ok\b/.test(l)),
      'the rail let somebody make the question go away without answering it').toBe(false);
  });
});
