import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkPalette } from './ParkPalette';
import { initialZooState } from './config';
import { presetFor } from './design';
import type { ZooGameState, BacklogItem } from './types';

// Two tools, because two things have no object of their own.
//
// It was six. Then everything about an object moved into its takeover - footprint, ground, fence,
// water, planting inside, the animals - and a habitat, an animal and a facility stopped being tools
// at all: they are cards you build. What is left on the park is a path, which is a run between two
// points, and loose planting, which is scenery nobody wrote a Backlog item for.

const state = (): ZooGameState => initialZooState(3);
const itemOf = (category: string): BacklogItem =>
  state().backlog.find((it) => it.category === category)!;

const palette = (item: BacklogItem, props: Record<string, unknown> = {}) => render(
  <MemoryRouter>
    <ParkPalette state={state()} item={item} design={presetFor(item)}
      onDesign={() => {}} {...props} />
  </MemoryRouter>,
);

const tool = (container: HTMLElement, key: string) =>
  container.querySelector(`[data-tool="${key}"]`) as HTMLButtonElement;

describe('the palette on the park', () => {
  it('is two tools, and says what each does', () => {
    const { container } = palette(itemOf('path'));
    const tools = [...container.querySelectorAll('[data-tool]')];
    expect(tools.length, 'the park grew tools for things that are built on their cards').toBe(2);
    expect(container.textContent).toContain('Path');
    expect(container.textContent).toContain('Planting');
  });

  it('gives a pathway the pen', () => {
    const onDrawing = vi.fn();
    const { container } = palette(itemOf('path'), { onDrawing });
    expect(tool(container, 'path').disabled).toBe(false);
    fireEvent.click(tool(container, 'path'));
    expect(onDrawing, 'the pen was not picked up').toHaveBeenCalledWith(true);
    const drawing = palette(itemOf('path'), { drawing: true });
    expect(drawing.container.textContent, 'nothing says how a path is drawn')
      .toMatch(/click where it starts, then where it ends/);
  });

  it('dims a tool that has nothing to do with what is in hand, and says why', () => {
    const { container } = palette(itemOf('enclosure'));
    expect(tool(container, 'path').disabled, 'a habitat was offered the pen').toBe(true);
    expect(tool(container, 'path').title, 'the dimmed tool does not say why').toMatch(/built on the card/);
  });
});
