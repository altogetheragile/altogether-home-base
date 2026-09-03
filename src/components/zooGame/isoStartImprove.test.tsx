import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { IsoZoo } from './IsoZoo';
import { initialZooState } from './config';
import { splitEpic } from './engine';
import { CANVAS_W, PLAY_H } from './parkLayout';
import type { BacklogItem, ZooGameState } from './types';

// Starting work somewhere, and asking for something live to be better.
//
// Two things the blueprint could do and the Increment view could not: drop a card from the Sprint
// Backlog onto a patch of park to start it there, and raise an Improve item for something already
// standing. Both are about a particular place or a particular thing, which is why they belong on
// the park at all rather than in a list beside it.

const LIVE = 'e-live';

function park(): ZooGameState {
  const base = splitEpic(initialZooState(1), 'bigcats', ['tiger', 'leopard', 'kiosk']);
  const one = base.backlog.find((it) => it.category === 'enclosure')!;
  const live: BacklogItem = {
    ...one, id: LIVE, name: 'Lion Enclosure', status: 'open', enclosureSize: 'large', pos: { x: 320, y: 300 },
  } as BacklogItem;
  return { ...base, backlog: [live, ...base.backlog.filter((it) => it.id !== one.id)] } as ZooGameState;
}

function sized(svg: SVGElement) {
  svg.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, right: 900, bottom: 700,
    width: 900, height: 700, toJSON: () => ({}) }) as DOMRect;
  return svg;
}

/** A Sprint Backlog card let go over a point on the park.
 *
 *  Built by hand: jsdom has no DragEvent, so a drop fired the usual way arrives with no coordinates
 *  at all - which is a fair imitation of nothing and a poor one of a browser. */
function drop(zone: Element, id: string, at?: [number, number]) {
  const ev = at
    ? new MouseEvent('drop', { bubbles: true, cancelable: true, clientX: at[0], clientY: at[1] })
    : new Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'dataTransfer', { value: { getData: () => id, dropEffect: 'move' } });
  fireEvent(zone, ev);
}

describe('starting a card where it was dropped', () => {
  it('starts it on the patch it landed on, inside the park', () => {
    const onStartHere = vi.fn();
    const { container } = render(<IsoZoo state={park()} onPlaceItem={() => {}} onStartHere={onStartHere} />);
    sized(container.querySelector('svg')!);
    drop(container.firstElementChild!, 'lion', [430, 330]);

    expect(onStartHere, 'a card dropped on the park started nothing').toHaveBeenCalled();
    const [id, pos] = onStartHere.mock.calls[onStartHere.mock.calls.length - 1] as [string, { x: number; y: number }];
    expect(id).toBe('lion');
    expect(pos.x, 'the site was put off the side of the park').toBeGreaterThan(0);
    expect(pos.x).toBeLessThan(CANVAS_W);
    expect(pos.y).toBeGreaterThan(0);
    expect(pos.y).toBeLessThan(PLAY_H);
  });

  it('starts nothing on a drop that landed nowhere', () => {
    // A browser gives a drop its coordinates; something that does not is not a place on the park,
    // and a site at no coordinates would be drawn at none.
    const onStartHere = vi.fn();
    const { container } = render(<IsoZoo state={park()} onPlaceItem={() => {}} onStartHere={onStartHere} />);
    sized(container.querySelector('svg')!);
    drop(container.firstElementChild!, 'lion');
    expect(onStartHere, 'a site was started at no coordinates').not.toHaveBeenCalled();
  });

  it('takes no drop when there is nowhere to start things', () => {
    const { container } = render(<IsoZoo state={park()} />);
    // Nothing to assert but that this does not throw: a view with no way to start work must not
    // pretend to be one.
    drop(container.firstElementChild!, 'lion', [430, 330]);
    expect(container.querySelector('svg')).toBeTruthy();
  });
});

describe('asking for something live to be better', () => {
  const pill = (c: HTMLElement, re: RegExp) =>
    [...c.querySelectorAll('g')].find((g) => re.test(g.querySelector('title')?.textContent ?? ''));

  it('offers it on the thing you picked, and raises it for that thing', () => {
    const onImprove = vi.fn();
    const { container } = render(
      <IsoZoo state={park()} selected={LIVE} onPlaceItem={() => {}} onImprove={onImprove} />,
    );
    const p = pill(container, /Raise an Improve item/);
    expect(p, 'nothing on the park to ask for an improvement with').toBeTruthy();
    fireEvent.click(p!);
    expect(onImprove).toHaveBeenCalledWith(LIVE);
  });

  it('says so, once, when one is already waiting', () => {
    const onImprove = vi.fn();
    const { container } = render(
      <IsoZoo state={park()} selected={LIVE} onPlaceItem={() => {}} onImprove={onImprove} improving={new Set([LIVE])} />,
    );
    const p = pill(container, /already waiting/);
    expect(p, 'an Improve item was raised and the park said nothing about it').toBeTruthy();
    fireEvent.click(p!);
    expect(onImprove, 'the same improvement was asked for twice').not.toHaveBeenCalled();
  });

  it('is not offered for work still being built', () => {
    // There is nothing to improve about a construction site: you are still building that one.
    const state = park();
    const site = { ...state.backlog.find((it) => it.id === LIVE)!, status: 'committed' as const, started: true };
    const { container } = render(
      <IsoZoo state={{ ...state, backlog: state.backlog.map((it) => (it.id === LIVE ? site : it)) }}
        selected={LIVE} onPlaceItem={() => {}} onImprove={() => {}} />,
    );
    expect(!!pill(container, /Improve/), 'a building site was offered an improvement').toBe(false);
  });
});
