import { describe, it, expect } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RefineBacklog } from './RefineBacklog';
import { initialZooState, DEFAULT_BRIEF } from './config';
import { writeBacklog, splitEpic, estimateItem } from './engine';
import type { ZooGameState } from './types';

// "Enough to start, and no more" (docs/ZOO_GAME_FLOW.md). With a Sprint's worth Ready, every other
// epic still stood in red with "Not ready" and a red "Split it up", so the screen went on asking
// for the whole Product Backlog to be refined before the first Sprint.

const noop = () => {};
const refine = (state: ZooGameState) => render(
  <MemoryRouter>
    <RefineBacklog state={{ ...state, phase: 'refine' } as ZooGameState} onEstimate={noop} onAddPbi={noop} onRefinePbi={noop} onReorder={noop}
      onMoveZone={noop} onMoveBefore={noop} onSetUseStories={noop} onSplitEpic={noop} onDeletePbi={noop}
      onDuplicatePbi={noop} onPlan={noop} onSetDod={noop} onAgreeDod={noop} />
  </MemoryRouter>,
).container;

// The whole flow plays with refinement as a practice from the start (#964).
const written = () => writeBacklog({ ...initialZooState(1), adopted: ['refinement'] } as ZooGameState, DEFAULT_BRIEF);
const aSprintReady = () => {
  const w = written();
  let s = splitEpic(w, 'bigcats', (w.backlog.find((it) => it.id === 'bigcats')?.epicMembers ?? []).map((m) => m.id));
  for (const it of s.backlog.filter((x) => x.unsized && x.category !== 'epic' && x.category !== 'need')) s = estimateItem(s, it.id, 3);
  return s;
};

describe('enough to start', () => {
  it('asks for the epics to be split while there is not a Sprint\'s worth Ready', () => {
    const c = refine(written());
    expect(c.querySelector('[data-part="later"]')).toBeNull();
    expect(c.querySelector('[data-part="enough-to-start"]')).toBeNull();
    // Said by the frame, not a chip: the cards that are not Ready yet are dashed.
    expect(c.querySelector('[data-pbi-state="locked"]')).toBeTruthy();
  });

  it('stops asking once there is, and says so', () => {
    const c = refine(aSprintReady());
    expect(c.querySelector('[data-part="enough-to-start"]')?.textContent).toMatch(/Enough to start/);
    // What is for later folds into one row, and opens.
    const fold = c.querySelector('[data-part="later-fold"]') as HTMLButtonElement;
    expect(fold?.textContent).toMatch(/more, refined in later Sprints/);
    expect(c.querySelectorAll('[data-part="later"]').length, 'the later items are not folded').toBe(0);
    fireEvent.click(fold);
    // Every epic left is "Later", and none of them is drawn as the thing to do next.
    expect(c.querySelectorAll('[data-part="later"]').length).toBeGreaterThanOrEqual(4);
    expect(c.textContent).not.toMatch(/Not ready/);
    const split = [...c.querySelectorAll('button')].filter((b) => /Split it up/.test(b.textContent ?? ''));
    expect(split.length, 'the epics can still be split').toBeGreaterThan(0);
    expect(split.some((b) => /bg-rose/.test(b.className)), 'a split button still shouts').toBe(false);
  });
});
