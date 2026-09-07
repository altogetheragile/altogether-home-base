import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkPalette } from './ParkPalette';
import { initialZooState } from './config';
import { presetFor } from './design';
import type { ZooGameState, BacklogItem } from './types';

// A palette, not a menu.
//
// From the screen flow of 7 September, borrowed from the games where this is settled: six tools
// along the foot of the park, each a glyph with a word under it, and no second level to go looking
// in. Six is the whole catalogue - expression is in what you do with them, not in more of them.
//
// A tool that has nothing to do with what is in your hands is dimmed and says why rather than
// disappearing: learning that a habitat has no route to draw is part of learning what a pathway is.

const state = (): ZooGameState => initialZooState(3);
const itemOf = (category: string): BacklogItem =>
  state().backlog.find((it) => it.category === category)!;

const palette = (item: BacklogItem, props: Record<string, unknown> = {}) => render(
  <MemoryRouter>
    <ParkPalette state={state()} item={item} design={presetFor(item)}
      onDesign={() => {}} onSetEnclosure={() => {}} {...props} />
  </MemoryRouter>,
);

const tool = (container: HTMLElement, key: string) =>
  container.querySelector(`[data-tool="${key}"]`) as HTMLButtonElement;

describe('the palette on the park', () => {
  it('is six tools, on the surface, with a word under each', () => {
    const { container } = palette(itemOf('enclosure'));
    const tools = [...container.querySelectorAll('[data-tool]')];
    expect(tools.length, 'the catalogue is not six tools any more').toBe(6);
    for (const label of ['Path', 'Habitat', 'Animal', 'Facility', 'Planting', 'Water']) {
      expect(container.textContent, `${label} is not on the palette`).toContain(label);
    }
  });

  it('dims what this item cannot be built with, and says why', () => {
    const { container } = palette(itemOf('enclosure'));
    expect(tool(container, 'habitat').disabled, 'a habitat cannot set its own footprint').toBe(false);
    expect(tool(container, 'path').disabled, 'a habitat was offered the pen').toBe(true);
    expect(tool(container, 'path').title, 'the dimmed tool does not say why').toMatch(/pathway/i);
    expect(tool(container, 'animal').disabled, 'a habitat was offered an animal to stock').toBe(true);
  });

  it('gives a pathway the pen, and nothing else', () => {
    const onDrawing = vi.fn();
    const { container } = palette(itemOf('path'), { onDrawing });
    expect(tool(container, 'path').disabled).toBe(false);
    expect(tool(container, 'habitat').disabled, 'a pathway was offered a footprint').toBe(true);
    fireEvent.click(tool(container, 'path'));
    expect(onDrawing, 'the pen was not picked up').toHaveBeenCalledWith(true);
  });

  it('adds water in one press, because there is nothing to choose', () => {
    const onDesign = vi.fn();
    const item = itemOf('enclosure');
    const { container } = palette(item, { onDesign });
    fireEvent.click(tool(container, 'water'));
    expect(onDesign, 'the water tool asked a question instead of doing it').toHaveBeenCalled();
    expect(onDesign.mock.calls[0][0]).toBe(item.id);
    expect(onDesign.mock.calls[0][1].water, 'nothing was added to the design').toBeTruthy();
  });

  it('asks how many and which coat for an animal, and says what the park will check', () => {
    const onDesign = vi.fn();
    const { container } = palette(itemOf('exhibit'), { onDesign });
    fireEvent.click(tool(container, 'animal'));
    fireEvent.click(screen.getByRole('button', { name: 'A pair' }));
    expect(onDesign.mock.calls[0][1].group, 'stocking the habitat changed nothing').toBeTruthy();
    expect(screen.getByText(/the park checks it/i), 'nothing says the criterion is measured').toBeTruthy();
  });

  it('says what the tool in hand does, once, where the tools are', () => {
    const { container } = palette(itemOf('enclosure'));
    fireEvent.click(tool(container, 'planting'));
    expect(container.textContent).toMatch(/place trees, bushes and rocks/);
  });
});
