import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkOptions } from './ParkOptions';
import { initialZooState } from './config';
import { openGroup } from './openGroup';
import type { ZooGameState, BacklogItem } from './types';

// From the twelfth scrum-master playtest (playtest-report-sm12), each one also in the eleventh.

const noop = () => {};
const game = (): ZooGameState => ({
  ...initialZooState(3), phase: 'sprint', dayStage: 'building', sprintNumber: 1,
} as ZooGameState);
const pen = (s: ZooGameState): BacklogItem => s.backlog.find((it) => it.category === 'enclosure')!;
const open = (s: ZooGameState, item: BacklogItem, api: Record<string, unknown> = {}) => render(
  <MemoryRouter><ParkOptions state={s} item={item}
    api={{ onDesign: noop, onSetEnclosure: noop, onAddInside: noop, onRemoveInside: noop, onTurn: noop, onUnplace: noop, onInside: noop, ...api }} /></MemoryRouter>,
);

describe('what goes inside a habitat', () => {
  // "I am not sure whether ticking the box adds one or whether I must use the 'One more' button."
  it('has one way to add a thing, not a tick box beside it', () => {
    const s = game();
    const onAddInside = vi.fn();
    open(s, pen(s), { onAddInside });
    const panel = openGroup('inside');
    expect(panel.querySelectorAll('[data-part^="inside-"] input[type="checkbox"]').length, 'the tick boxes are back').toBe(0);
    fireEvent.click(panel.querySelector('[data-part="more-water"]')!);
    expect(onAddInside).toHaveBeenCalledWith(pen(s).id, 'water');
  });
});

describe('the size of a habitat', () => {
  // "It is not clear whether '6 × 4 tiles' is the current size already set or just a label for S."
  it('says which size is chosen, and gives the tiles as that one\'s', () => {
    const s = game();
    open(s, { ...pen(s), enclosureSize: 'medium' });
    const panel = openGroup('footprint');
    const pressed = [...panel.querySelectorAll('[data-part="panel-footprint"] button[aria-pressed="true"]')].map((b) => b.textContent);
    expect(pressed).toEqual(['M']);
    expect(panel.querySelector('[data-part="size-now"]')?.textContent).toMatch(/^M is \d+ × \d+ tiles/);
  });

  // ...and nothing is pressed until somebody chooses. Showing the default as chosen said "M" while
  // the card said "no footprint chosen yet" (sm14, three times).
  it('shows nothing chosen when nobody has chosen', () => {
    const s = game();
    open(s, { ...pen(s), enclosureSize: undefined });
    const panel = openGroup('footprint');
    expect(panel.querySelectorAll('[data-part="panel-footprint"] button[aria-pressed="true"]').length).toBe(0);
    expect(panel.querySelector('[data-part="size-now"]')?.textContent).toMatch(/^No size chosen yet\. M would be \d+ × \d+ tiles/);
  });
});
