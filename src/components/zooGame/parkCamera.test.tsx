import { describe, it, expect } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { ParkPlan } from './ParkPlan';
import { ParkInspector } from './ParkInspector';
import { initialZooState } from './config';
import { zonePlots, plotOrder } from './parkZones';
import { CANVAS_W } from './parkLayout';
import type { ZooGameState } from './types';

// The park has a camera, not a set of levels.
//
// It began as a toggle - "the Big Cats" or "the whole zoo" - and a toggle cannot show a path that
// runs from one area into the next, which is a thing people build. Worse, every new level is another
// state for the rest of the park to reason about, and there were already two.
//
// So there is one box, the box IS the viewBox, and everything that used to be a level is now
// something that moves it: framing an area, looking inside a habitat, the wheel, a drag. The player
// can always go somewhere else from wherever they have been put.
//
// The box being the viewBox is the part that matters beyond tidiness: `worldAt` reads the same box
// the picture is drawn from, so a thing lands where it was dropped at any magnification. A camera
// kept anywhere else is a second opinion about where the park is.

const game = (): ZooGameState => ({ ...initialZooState(3), phase: 'sprint' } as ZooGameState);

const viewOf = (c: HTMLElement) =>
  (c.querySelector('[data-part="park-plan"]')?.getAttribute('viewBox') ?? '').split(' ').map(Number);

describe('the park’s camera', () => {
  it('starts on the whole zoo', () => {
    const [, , w] = viewOf(render(<ParkPlan state={game()} />).container);
    expect(w, 'the park does not open on the whole plot').toBeGreaterThanOrEqual(CANVAS_W);
  });

  it('goes where it is pointed, and frames what it was given', async () => {
    const s = game();
    const plot = zonePlots(s).get(plotOrder(s)[0])!;
    const { container } = render(
      <ParkPlan state={s} frame={{ x0: plot.x0, y0: plot.y0, x1: plot.x1, y1: plot.y1 }} />,
    );
    // It MOVES there rather than jumping - a picture that changes under you without anything
    // appearing to move is what makes a zoom disorienting - so this waits for it to arrive.
    const width = plot.x1 - plot.x0;
    await waitFor(() => expect(viewOf(container)[2]).toBeLessThan(width * 1.3));
    const [x, y, w, h] = viewOf(container);
    // Framed means the area is in the picture with a little room round it - not that the numbers
    // match exactly, because the picture is fitted to a pane whose shape it does not choose.
    expect(x, 'the area is off the left of the picture').toBeLessThanOrEqual(plot.x0);
    expect(y).toBeLessThanOrEqual(plot.y0);
    expect(x + w, 'the area is off the right of the picture').toBeGreaterThanOrEqual(plot.x1);
    expect(y + h).toBeGreaterThanOrEqual(plot.y1);
    expect(w, 'framing one area showed the whole zoo').toBeLessThan(CANVAS_W);
  });

  it('is a place to go, not a mode to be in: the whole zoo is always one press away', async () => {
    const s = game();
    const plot = zonePlots(s).get(plotOrder(s)[0])!;
    const { container } = render(
      <ParkPlan state={s} frame={{ x0: plot.x0, y0: plot.y0, x1: plot.x1, y1: plot.y1 }} />,
    );
    await waitFor(() => expect(viewOf(container)[2]).toBeLessThan((plot.x1 - plot.x0) * 1.3));
    fireEvent.click(container.querySelector('[data-part="park-fit"]')!);
    expect(viewOf(container)[2], 'there is no way back out to the whole zoo')
      .toBeGreaterThanOrEqual(CANVAS_W);
  });

  it('zooms in and out from its own controls', () => {
    const { container } = render(<ParkPlan state={game()} />);
    const wide = viewOf(container)[2];
    fireEvent.click(container.querySelector('[aria-label="Zoom in"]')!);
    const closer = viewOf(container)[2];
    expect(closer, 'zooming in showed no more of the park than before').toBeLessThan(wide);
    fireEvent.click(container.querySelector('[aria-label="Zoom out"]')!);
    expect(viewOf(container)[2], 'zooming out did not undo it').toBeGreaterThan(closer);
  });

  it('will not be zoomed out past the plot, or lost off the edge of it', () => {
    const { container } = render(<ParkPlan state={game()} />);
    const out = container.querySelector('[aria-label="Zoom out"]')!;
    for (let i = 0; i < 12; i += 1) fireEvent.click(out);
    const [x, y, w] = viewOf(container);
    expect(w, 'the park can be zoomed out into empty space').toBeLessThanOrEqual(CANVAS_W + 120);
    expect(x, 'the camera wandered off the plot').toBeLessThan(CANVAS_W);
    expect(Number.isFinite(y)).toBe(true);
  });
});

describe('the acceptance criteria panel', () => {
  const open = () => {
    const s = initialZooState(3);
    const item = s.backlog.find((it) => (it.acceptance ?? []).length > 0)!;
    return render(<div style={{ position: 'relative' }}>
      <ParkInspector state={s} item={item} onAskToCheck={() => {}} />
    </div>).container;
  };

  it('can be put away, and got back', () => {
    // "Can the AC dialog also be hideable?" - and anything put away has to be something you can get
    // back, or it is gone.
    const c = open();
    expect(c.querySelector('[data-part="hide-inspector"]'), 'there is no way to put it away').toBeTruthy();
    fireEvent.click(c.querySelector('[data-part="hide-inspector"]')!);
    const pill = c.querySelector('[data-part="park-inspector"]') as HTMLElement;
    expect(pill.getAttribute('data-collapsed'), 'the panel is still taking up the park').toBe('yes');
    expect(pill.textContent, 'nothing says what the pill would bring back').toMatch(/Acceptance criteria/);
    fireEvent.click(pill);
    expect(c.querySelector('[data-part="hide-inspector"]'), 'the panel could not be got back').toBeTruthy();
  });
});
