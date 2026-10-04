import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ActionRail } from './ActionRail';
import { enclosureAcceptance } from './design';
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

  it('carries the Developers’ question, with the answers on the line - to whoever it belongs to', () => {
    // Where a thing goes is the Product Owner's call. While the Sprint Backlog is being executed
    // the player is a Developer, so it is hers and she is played by the game: the question is not
    // put to the player at all. Hold her seat and it is yours again.
    const s = sprint({}, { design });
    const item = s.backlog.find((it) => it.started)!;
    const onAnswerPlacement = vi.fn();
    const asked = { ...s, pendingPlacement: { itemId: item.id, askedAt: 80 } } as unknown as ZooGameState;

    const alone = rail(asked, { onAnswerPlacement }).container;
    expect(alone.textContent, 'a Developer was asked where the Product Owner wants it')
      .not.toMatch(/Where should Lion Enclosure go/);

    const asPo = rail(asked, { onAnswerPlacement, seat: 'product_owner' }).container;
    expect(asPo.textContent, 'the question is not on the rail').toMatch(/Where should Lion Enclosure go/);
    expect(asPo.textContent, 'the rail does not say whose call it is').toMatch(/Product Owner/i);
    fireEvent.click(screen.getAllByRole('button', { name: 'You choose' })[0]);
    expect(onAnswerPlacement, 'the answer on the line did nothing').toHaveBeenCalledWith(item.id, 'them');
  });

  it('asks whether Done work goes live now or later', () => {
    // The Review is not the gate: work can go live the day it is Done, and holding it is a decision.
    const onOpen = vi.fn();
    const s = sprint({}, {
      // Every criterion, however many there are: a fixture that counts them by hand breaks the day
      // one is added, which is what happened when a habitat gained "can I walk to it".
      // Accepted by the Product Owner, which is what Done waits for now.
      design, status: 'done', signedOff: true, acConfirmed: enclosureAcceptance().map(() => true),
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
        ? { ...it, status: 'done' as const, sprintNumber: 1, design, signedOff: true, acConfirmed: it.acceptance.map(() => true),
          tasks: [{ id: 't', label: 'Get the PO’s sign-off', done: true }] }
        : it))),
    } as unknown as ZooGameState;
    // Held as the Product Owner, so both of her decisions reach the rail and there are two to
    // queue. A Developer is asked neither.
    const { container } = rail(both, { onAnswerPlacement: () => {}, onOpen: () => {}, seat: 'product_owner' });
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
