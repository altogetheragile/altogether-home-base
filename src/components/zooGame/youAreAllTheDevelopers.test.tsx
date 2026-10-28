import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ActionRail } from './ActionRail';
import { initialZooState } from './config';
import { standUp, yourDev, otherDevs } from './engine';
import type { ZooGameState, BacklogItem } from './types';

// Playing alone, nobody builds beside you.
//
// Ben and Cara used to pull their own cards and build them at your pace. Al, 26 Oct 2026: "I don't
// think the AI builds are very realistic. Should we just simplify things and have single player
// play all the roles." So alone you are all three Developers, and the two things the colleagues
// did that the player could not are handed back: who gives a card its second pair of eyes, and
// who speaks at the Daily Scrum.

const PEER = 'Peer-reviewed by another Developer';
const design = { parts: {}, colors: {} } as unknown as BacklogItem['design'];

const sprint = (item: Partial<BacklogItem> = {}): ZooGameState => {
  const base = initialZooState(3);
  const you = yourDev(base)!;
  const held = base.backlog.find((it) => !it.unsized && it.category === 'enclosure')!;
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1, daySecondsLeft: 80,
    definitionOfDone: [PEER], committedIds: [held.id],
    backlog: base.backlog.map((it) => (it.id === held.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true, pulledBy: you.id, assignedDevs: [you.id], ...item }
      : it)),
  } as ZooGameState;
};

describe('you are all the Developers', () => {
  it('asks who gives a built card its second pair of eyes, and puts them on it', () => {
    const s = sprint({ design });
    const card = s.backlog.find((it) => it.started)!;
    const ben = otherDevs(s)[0];
    const onAssignDev = vi.fn();
    const { container } = render(<MemoryRouter><ActionRail state={s} onAssignDev={onAssignDev} /></MemoryRouter>);
    expect(container.textContent, 'the rail does not ask for the review').toMatch(/Who gives it the second pair of eyes/);
    expect(screen.queryByRole('button', { name: yourDev(s)!.name }), 'the author is offered as their own reviewer').toBeNull();
    fireEvent.click(screen.getByRole('button', { name: ben.name }));
    expect(onAssignDev).toHaveBeenCalledWith(card.id, ben.id);
  });

  it('does not ask while the card is still being built', () => {
    const { container } = render(<MemoryRouter><ActionRail state={sprint()} onAssignDev={vi.fn()} /></MemoryRouter>);
    expect(container.textContent).not.toMatch(/second pair of eyes/);
  });

  it('leaves a colleague with no cards out of the Daily Scrum', () => {
    const s = standUp({ ...sprint(), dayStage: 'dailyScrum' });
    const spoke = (s.chat ?? []).filter((m) => m.kind === 'stand-up').map((m) => m.from);
    for (const d of otherDevs(s)) expect(spoke, `${d.name} stood up to say nothing`).not.toContain(d.name);
  });

  it('still hears from a colleague you gave a card to', () => {
    const base = sprint();
    const ben = otherDevs(base)[0];
    const given = { ...base, dayStage: 'dailyScrum' as const,
      backlog: base.backlog.map((it) => (it.started ? { ...it, assignedDevs: [...(it.assignedDevs ?? []), ben.id] } : it)) };
    const spoke = (standUp(given).chat ?? []).filter((m) => m.kind === 'stand-up').map((m) => m.from);
    expect(spoke).toContain(ben.name);
  });
});
