import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { ZooShell } from './ZooShell';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// The controls sit in one place.
//
// Reported from playing it, with two screenshots of the same cluster: "I'm looking for the button
// press next, or the Plan / Product controls." The board toolbar was one row that split left and
// right and wrapped when the pane narrowed, so Plan/Build was top-right on the board and top-left in
// Build - the same control in two places depending on which state you were in.
//
// Plan and Build are two states of the Sprint Backlog, so the switch belongs to that tab and rides
// on the tab row. What is left on the board is one cluster, left-aligned, under the question.

const noop = () => {};
const state = (over: Partial<ZooGameState> = {}): ZooGameState =>
  ({ ...initialZooState(3), phase: 'sprint', dayStage: 'building', ...over }) as ZooGameState;

const board = (mode: 'plan' | 'build') => render(
  <MemoryRouter>
    <SprintBoard state={state()} mode={mode}
      onAddAnother={noop} onEstimate={noop} onToggleTask={noop} onConfirmAc={noop} onFinishItem={noop}
      onStartItem={noop} onSetLearnMode={noop} onSetScrumAt={noop} onPull={noop} onSplitEpic={noop}
      onAssignDev={noop} onRenameMember={noop} onOpen={noop} onPlaceOnPark={noop} onEndDay={noop}
      onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop} onBuilding={noop} />
  </MemoryRouter>,
);

const controls = (c: HTMLElement) => c.querySelector('[data-part="board-controls"]') as HTMLElement;

describe('the board controls', () => {
  it('keeps the Backlog, the horizon and the settings in one cluster', () => {
    const { container } = board('plan');
    const row = controls(container);
    expect(row, 'the board controls are not a cluster at all').toBeTruthy();
    const labels = [...row.querySelectorAll('button')].map((b) => (b.textContent ?? '').replace(/\s+/g, ' ').trim());
    expect(labels.some((l) => /^Product Backlog/.test(l)), 'the Product Backlog is not with the other controls').toBe(true);
    // ...and it is a row of its own rather than one that splits left and right, which is what moved
    // them when the pane narrowed.
    expect(/justify-between/.test(row.parentElement!.className),
      'the toolbar splits left and right, so the controls move when it wraps').toBe(false);
  });
});

describe('the Plan and Build switch', () => {
  const shell = (buildMode: 'plan' | 'build', canBuild = true) => render(
    <MemoryRouter>
      <ZooShell state={state()} buildMode={buildMode} canBuild={canBuild} onSetBuildMode={noop} onEndDay={noop}>
        <div>the board</div>
      </ZooShell>
    </MemoryRouter>,
  );

  it('rides on the tab row, because it is a state of that tab', () => {
    // Not on the board: the board is what one of the two states shows, so a switch drawn inside it
    // has to move when that state changes what is on the screen.
    const { container } = shell('plan');
    const tabs = container.querySelector('header .flex.items-end')!;
    const labels = [...tabs.querySelectorAll('button')].map((b) => (b.textContent ?? '').trim());
    expect(labels, 'Plan is not on the tab row').toContain('Plan');
    expect(labels, 'Build is not on the tab row').toContain('Build');
    expect(board('plan').container.textContent, 'the board still draws its own switch').not.toMatch(/^Plan$/m);
  });

  it('is in the same place in both states', () => {
    const at = (m: 'plan' | 'build') => {
      const { container } = shell(m);
      const tabs = container.querySelector('header .flex.items-end')!;
      return [...tabs.children].findIndex((el) => /Plan/.test(el.textContent ?? '') && /Build/.test(el.textContent ?? ''));
    };
    expect(at('plan')).toBe(at('build'));
    expect(at('plan')).toBeGreaterThan(-1);
  });

  it('refuses Build when there is nothing in hand, and says why', () => {
    shell('plan', false);
    const build = screen.getAllByRole('button', { name: 'Build' })[0];
    expect(build).toBeDisabled();
    expect(build.getAttribute('title')).toMatch(/Start something first/);
  });

  it('switches the state it names', () => {
    let mode: string | null = null;
    render(
      <MemoryRouter>
        <ZooShell state={state()} buildMode="plan" canBuild onSetBuildMode={(m) => { mode = m; }} onEndDay={noop}>
          <div>the board</div>
        </ZooShell>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Build' })[0]);
    expect(mode).toBe('build');
  });
});
