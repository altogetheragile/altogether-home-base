import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { SprintReview } from './SprintReview';
import { ProductBacklogSidebar } from './Board';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// Reachable without a pointer, and readable without eyes on a colour.
//
// This is taught on a tablet and shown on a projector, so it is not an abstract standard: a 12px
// chevron is a miss under a fingertip, a bar drawn as two coloured divs is a number that is not
// there to be read, and a card that can only be CARRIED between columns is work a keyboard cannot
// move. Every one of these was a control the game already had - it just could not be operated.

const noop = () => {};

const sprint = (): ZooGameState => {
  const s = initialZooState(3);
  const take = s.backlog.filter((it) => !it.unsized && it.category !== 'epic').slice(0, 2);
  return {
    ...s, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1, daySecondsLeft: 80,
    committedIds: take.map((it) => it.id),
    backlog: s.backlog.map((it) => (take.some((t) => t.id === it.id)
      ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)),
  } as ZooGameState;
};

const board = (props: Record<string, unknown> = {}) => render(
  <MemoryRouter>
    <SprintBoard state={sprint()}
      onEstimate={noop} onToggleTask={noop} onConfirmAc={noop} onFinishItem={noop} onStartItem={noop}
      onSetLearnMode={noop} onSetScrumAt={noop} onPull={noop} onSplitEpic={noop} onAssignDev={noop}
      onRenameMember={noop} onOpen={noop} onEndDay={noop} onHoldDailyScrum={noop} onSkipDailyScrum={noop}
      onStartDay={noop} onBuilding={noop} {...props} />
  </MemoryRouter>,
).container;

describe('moving work without a pointer', () => {
  it('can hand a card back to the Product Backlog', () => {
    // Carrying it onto the hand-back strip was the only way, and a keyboard could start work and
    // finish it and never give it back.
    const onDropFromSprint = vi.fn();
    const container = board({ onDropFromSprint });
    const card = [...container.querySelectorAll('[data-part="board-card"]')][0] as HTMLElement;
    fireEvent.click(card);
    const dialog = screen.getByRole('dialog');
    const back = within(dialog).getByRole('button', { name: /Hand it back/ });
    fireEvent.click(back);
    expect(onDropFromSprint, 'the only way back was a drag').toHaveBeenCalled();
  });
});

describe('what a finger has to hit', () => {
  it('gives the Product Backlog’s ordering a target, not a glyph', () => {
    // Ordering the Backlog is the Product Owner's central act and it was a 12px chevron.
    const s = initialZooState(3);
    const { container } = render(
      <MemoryRouter>
        <ProductBacklogSidebar state={s} mode="refine" onReorder={noop}
          onAddPbi={noop} onRefinePbi={noop} onSetUseStories={noop} />
      </MemoryRouter>,
    );
    const up = [...container.querySelectorAll('button')].find((b) => /Move .* up/.test(b.getAttribute('aria-label') ?? ''));
    expect(up, 'nothing says what the chevron does').toBeTruthy();
    expect(up!.className, 'the target is still the size of the glyph in it').toMatch(/h-9/);
  });
});

describe('a bar', () => {
  it('is a number a screen reader can read, not a shape', () => {
    const s = {
      ...initialZooState(3), phase: 'review', sprintNumber: 1,
      lastReview: {
        totalAttendance: 900, overallHappiness: 62,
        segments: [{ segmentId: 'families', happiness: 71, attendance: 300 }],
      },
    } as unknown as ZooGameState;
    const { container } = render(
      <MemoryRouter><SprintReview state={s} onTakeSignal={noop} onContinue={noop} /></MemoryRouter>,
    );
    const bars = [...container.querySelectorAll('[role="progressbar"]')];
    expect(bars.length, 'every bar is still a coloured div').toBeGreaterThan(0);
    for (const bar of bars) {
      expect(bar.getAttribute('aria-valuenow'), 'a bar with no value on it').toBeTruthy();
      expect(bar.getAttribute('aria-valuetext'), 'a number with nothing saying what it counts').toBeTruthy();
    }
  });
});
