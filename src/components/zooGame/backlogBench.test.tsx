import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BacklogTab } from './BacklogBench';
import { initialZooState, REFINE_COSTS } from './config';
import { addPbi, estimateItem, splitEpic } from './engine';
import type { ZooGameState } from './types';

// The Product Backlog tab is a place you can work.
//
// It was a read-only list: epics at the top, no Product Goal, nothing to do - which meant Backlog
// refinement could only happen before Sprint 1. The Guide has refinement as "an ongoing activity",
// and the game's own rule is that doing it during a Sprint costs the Developers build time. Both of
// those have to be true on the screen, not just in the engine.

const noop = () => {};
const at = (phase: ZooGameState['phase'], over: Partial<ZooGameState> = {}): ZooGameState =>
  ({ ...initialZooState(3), phase, productGoal: 'Open a zoo that visitors love and come back to.', ...over }) as ZooGameState;

const tab = (state: ZooGameState, props: Partial<Parameters<typeof BacklogTab>[0]> = {}) => render(
  <MemoryRouter>
    <BacklogTab state={state} onEstimate={noop} onAddPbi={noop} onRefinePbi={noop} onReorder={noop}
      onMoveZone={noop} onMoveBefore={noop} onSetUseStories={noop} onSplitEpic={noop}
      onDeletePbi={noop} onDuplicatePbi={noop} {...props} />
  </MemoryRouter>,
);

/** The bench card, by the thing only it says. */
const bench = () => screen.getByText(/The conversation|The refinement bench/i).closest('section')!;

describe('the Product Backlog tab as a bench', () => {
  it('carries the commitment of the Product Backlog', () => {
    // An artifact and its commitment belong together. This tab had no Product Goal on it at all.
    const { container } = tab(at('sprint'));
    expect(container.textContent).toMatch(/Product Goal/);
    expect(container.textContent).toContain('Open a zoo that visitors love and come back to.');
  });

  it('opens an item on the bench when you pick it', () => {
    // Picking an item used to do nothing whatsoever.
    tab(at('sprint'));
    expect(bench().textContent, 'the bench was already full before anything was picked').toMatch(/Pick an item on the left/i);
    fireEvent.click(screen.getAllByRole('button', { name: /^Refine Lion Enclosure$/ })[0]);
    const open = bench();
    expect(open.textContent).toContain('Lion Enclosure');
    // ...and it is the refinement conversation, not a form: who wants it, and what it would take.
    expect(open.textContent, 'the bench does not say who is talking').toMatch(/\(PO\)/);
    expect(within(open as HTMLElement).getByRole('button', { name: /Size it/i })).toBeTruthy();
  });

  it('says what refining costs, during a Sprint and not before one', () => {
    // The cost is the lesson: a team that never feels the trade-off learns refinement is free.
    const running = tab(at('sprint', { refinePenalty: 24, daySecondsLeft: 60 })).container;
    expect(running.textContent).toMatch(/costs the Developers build time/i);
    expect(running.textContent, 'the day’s spend is not shown').toContain('24s spent today');

    const before = tab(at('refine')).container;
    expect(before.textContent, 'refinement was charged for outside a Sprint').not.toMatch(/costs the Developers build time/i);
  });

  it('prices each act on the control that spends it', () => {
    tab(at('sprint'));
    fireEvent.click(screen.getAllByRole('button', { name: /^Refine Lion Enclosure$/ })[0]);
    const acts = within(bench() as HTMLElement);
    expect(acts.getByRole('button', { name: /Size it/i }).textContent).toContain(`${REFINE_COSTS.estimate}s`);
    expect(acts.getByRole('button', { name: /Word it/i }).textContent).toContain(`${REFINE_COSTS.refinePbi}s`);
  });

  it('lets the Developers size an item from the bench', () => {
    const onEstimate = vi.fn();
    tab(at('sprint'), { onEstimate });
    fireEvent.click(screen.getAllByRole('button', { name: /^Refine Lion Enclosure$/ })[0]);
    fireEvent.click(within(bench() as HTMLElement).getByRole('button', { name: /Size it/i }));
    // Planning poker: the Developers show their hands, and the size is committed from the bench.
    const commit = screen.getAllByRole('button').find((b) => /Commit|Agree|Size it as/i.test(b.textContent ?? ''));
    expect(commit, 'the bench opens no way to actually size it').toBeTruthy();
    fireEvent.click(commit!);
    expect(onEstimate).toHaveBeenCalled();
  });
});

describe('what refining during a Sprint costs', () => {
  // The screen says the price; this is the price actually being charged. Both, or the number on
  // the button is decoration.
  const running = (): ZooGameState => ({ ...initialZooState(3), phase: 'sprint', daySecondsLeft: 200, refinePenalty: 0 }) as ZooGameState;

  it('takes it out of the day', () => {
    const before = running();
    const item = before.backlog.find((it) => it.unsized)!;
    const after = estimateItem(before, item.id, 5);
    expect(after.refinePenalty).toBe(REFINE_COSTS.estimate);
    expect(after.daySecondsLeft).toBe(before.daySecondsLeft - REFINE_COSTS.estimate);

    const epic = before.backlog.find((it) => it.category === 'epic')!;
    expect(splitEpic(before, epic.id, [epic.epicMembers![0].id]).refinePenalty).toBe(REFINE_COSTS.split);
    expect(addPbi(before, { name: 'A new bench', category: 'amenity', zone: 'Waterside', acceptance: [] }).refinePenalty).toBe(REFINE_COSTS.addPbi);
  });

  it('charges nothing before the first Sprint, where refining is the work of the hour', () => {
    const before = { ...running(), phase: 'refine' } as ZooGameState;
    const item = before.backlog.find((it) => it.unsized)!;
    expect(estimateItem(before, item.id, 5).daySecondsLeft).toBe(before.daySecondsLeft);
  });
});
