import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkPalette } from './ParkPalette';
import { initialZooState } from './config';
import { presetFor, footprintFor } from './design';
import type { ZooGameState, BacklogItem } from './types';

// Ghost placement with a verdict.
//
// From the games where this is settled: the thing you are placing follows the cursor as a
// translucent copy, green where it can go and red where it cannot, with the reason on it. No dialog,
// no error after the fact - you can see the answer before you commit to the question.

const state = (): ZooGameState => initialZooState(3);
const enclosure = (): BacklogItem => state().backlog.find((it) => it.category === 'enclosure')!;

describe('placing a habitat', () => {
  it('is armed from the palette while it is standing nowhere', () => {
    const onPlacing = vi.fn();
    const item = { ...enclosure(), pos: undefined } as BacklogItem;
    const { container } = render(
      <MemoryRouter>
        <ParkPalette state={state()} item={item} design={presetFor(item)}
          onDesign={() => {}} onSetEnclosure={() => {}} onPlacing={onPlacing} />
      </MemoryRouter>,
    );
    fireEvent.click(container.querySelector('[data-tool="habitat"]')!);
    expect(onPlacing, 'the habitat tool did not pick the footprint up').toHaveBeenCalledWith(true);
  });

  it('says what the gesture is while it is armed', () => {
    const item = { ...enclosure(), pos: undefined } as BacklogItem;
    const { container } = render(
      <MemoryRouter>
        <ParkPalette state={state()} item={item} design={presetFor(item)} placing
          onDesign={() => {}} onSetEnclosure={() => {}} onPlacing={() => {}} />
      </MemoryRouter>,
    );
    expect(container.textContent, 'nothing says what green and red mean')
      .toMatch(/green is room, red is not/);
  });

  it('offers the footprint the park will draw', () => {
    // The ghost is the size the thing will actually be. A preview at the wrong size is a lie about
    // whether it fits, which is the only question the ghost exists to answer.
    const item = enclosure();
    const box = footprintFor(item);
    expect(box.w, 'a habitat has no footprint to preview').toBeGreaterThan(0);
    expect(box.h).toBeGreaterThan(0);
  });
});
