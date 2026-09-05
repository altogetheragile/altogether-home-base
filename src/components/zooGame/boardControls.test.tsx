import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// The board's controls sit in one place.
//
// Reported from playing it, with two screenshots of the same cluster: "I'm looking for the button
// press next, or the Plan / Product controls." The toolbar was one row that split left and right and
// wrapped when the pane narrowed, so Plan/Build was top-right on the board and top-left in Build -
// the same control in two places depending on which state you were in.

const noop = () => {};
const state = (over: Partial<ZooGameState> = {}): ZooGameState =>
  ({ ...initialZooState(3), phase: 'sprint', dayStage: 'building', ...over }) as ZooGameState;

const board = (mode: 'plan' | 'build') => render(
  <MemoryRouter>
    <SprintBoard state={state()} mode={mode} onMode={noop}
      onAddAnother={noop} onEstimate={noop} onToggleTask={noop} onConfirmAc={noop} onFinishItem={noop}
      onStartItem={noop} onSetLearnMode={noop} onSetScrumAt={noop} onPull={noop} onSplitEpic={noop}
      onAssignDev={noop} onRenameMember={noop} onOpen={noop} onPlaceOnPark={noop} onEndDay={noop}
      onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop} onBuilding={noop} />
  </MemoryRouter>,
);

const controls = (c: HTMLElement) => c.querySelector('[data-part="board-controls"]') as HTMLElement;

describe('the board controls', () => {
  it('keeps Plan, Build and the Product Backlog in one cluster', () => {
    const { container } = board('plan');
    const row = controls(container);
    expect(row, 'the board controls are not a cluster at all').toBeTruthy();
    const labels = [...row.querySelectorAll('button')].map((b) => (b.textContent ?? '').replace(/\s+/g, ' ').trim());
    expect(labels).toContain('Plan');
    expect(labels).toContain('Build');
    expect(labels.some((l) => /^Product Backlog/.test(l)), 'the Product Backlog is not with the other controls').toBe(true);
  });

  it('puts them in the same place in Plan and in Build', () => {
    // Same row, same side, whichever state the Sprint Backlog is in - and not a row that splits
    // left and right, which is what moved them when the pane narrowed.
    const spots = (['plan', 'build'] as const).map((mode) => {
      const { container } = board(mode);
      const row = controls(container);
      const toolbar = row.parentElement!;
      return {
        index: [...toolbar.children].indexOf(row),
        splits: /justify-between/.test(toolbar.className),
      };
    });
    expect(spots[0].index).toBe(spots[1].index);
    expect(spots[0].splits, 'the toolbar splits left and right, so the controls move when it wraps').toBe(false);
    expect(spots[1].splits).toBe(false);
  });
});
