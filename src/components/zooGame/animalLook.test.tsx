import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ParkOptions } from './ParkOptions';
import { IsoZoo } from './IsoZoo';
import { initialZooState } from './config';
import { currentDesign } from './design';
import type { ZooGameState, BacklogItem } from './types';
import type { ItemDesign } from './design';

// From the control to the drawing, in one go.
//
// This exists because the test it replaces was a lie. It rendered the park, looked for ANY element
// carrying a filter, and passed - on the trees, which carry one for their foliage. So it went green
// on a lion nothing had painted, and the report came back from playing it: "the lions on the
// isometric are not changing colour."
//
// A test of a chain has to follow the chain: press the control, take what it hands the game, put
// that into the park, and find THE LION.

const item = (over: Partial<BacklogItem>): BacklogItem => ({
  id: 'x', name: 'Thing', zone: 'Big Cats', category: 'enclosure', status: 'open',
  acceptance: [], acConfirmed: [], tasks: [], ...over,
} as BacklogItem);

const zoo = (lionDesign: ItemDesign): ZooGameState => ({
  ...initialZooState(), zones: ['Big Cats'],
  backlog: [
    item({ id: 'enc', name: 'Lion Enclosure', enclosureSize: 'medium', pos: { x: 300, y: 700 },
      design: { parts: {}, colors: { ground: '#c9a86a', fence: '#7a5230' } } }),
    item({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc', design: lionDesign }),
  ],
} as unknown as ZooGameState);

/** What the park draws ON THE LION, which is the only element this is about. */
const onTheLion = (s: ZooGameState): string[] => {
  const svg = render(<IsoZoo state={s} height={460} />).container.querySelector('svg[role="img"]')!;
  const lions = [...svg.querySelectorAll('[data-spot^="lion:"]')];
  expect(lions.length, 'there is no lion in the park to look at').toBeGreaterThan(0);
  // What is ON the lion: the `filter` attribute, which is how a tint reaches the screen in every
  // browser. As a CSS style it reached it in Chromium only, and this test was written in Chromium.
  return lions.map((g) => g.getAttribute('filter') ?? '');
};

const pride: ItemDesign = { parts: {}, colors: {}, group: { males: 1, females: 1, juveniles: 0, cubs: 0 } };

describe('choosing a look', () => {
  it('hands the game a colour, and the park paints the lion with it', () => {
    const s = zoo(pride);
    const lion = s.backlog[1];
    const onDesign = vi.fn();
    const { container } = render(
      <ParkOptions state={s} item={lion} inside={null}
        api={{ onDesign, onSetEnclosure: () => {}, onAddInside: () => {} }} />,
    );
    const white = container.querySelector('[data-part="look-white"]') as HTMLButtonElement | null;
    expect(white, 'there is no White to choose').toBeTruthy();
    fireEvent.click(white!);

    const [id, design] = onDesign.mock.calls[0] as [string, ItemDesign];
    expect(id, 'the look was written to something other than the animal').toBe('lion');
    expect(design.colors?.coat, 'choosing White handed the game no colour').toBeTruthy();

    // ...and that is what the park is given.
    const painted = onTheLion(zoo({ ...currentDesign(lion), ...design }));
    expect(painted.every(Boolean), 'a lion the game was told to paint white is drawn as it always was').toBe(true);
    expect(painted[0], 'every lion in the pride is the same lion').toBe(painted[1]);
  });

  it('leaves a lion nobody painted exactly as it was drawn', () => {
    expect(onTheLion(zoo(pride)).every((f) => !f),
      'an unpainted lion is being put through a filter for nothing').toBe(true);
  });

  it('paints a whole pride, not just the first one', () => {
    const many: ItemDesign = { parts: {}, colors: { coat: '#2a2622' }, group: { males: 1, females: 2, juveniles: 1, cubs: 2 } };
    const painted = onTheLion(zoo(many));
    expect(painted.length, 'a pride was drawn as one lion').toBeGreaterThan(3);
    expect(painted.every(Boolean), 'some of the pride kept the old coat').toBe(true);
  });
});
