import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import { FlyThrough } from './FlyThrough';
import { IsoZoo } from './IsoZoo';
import { walkStops, canWalk, HOLD_MS, TRAVEL_MS } from './walkThrough';
import { initialZooState } from './config';
import { zoneSlices } from './engine';
import { ENTRANCE } from './parkNetwork';
import { PLAY_H } from './parkLayout';
import type { ZooGameState, BacklogItem } from './types';

// The walk round the Increment.
//
// It follows a visitor, not a list, and that is the whole reason it exists: something delivered that
// nobody can walk to is still a stop on the tour, and the caption says so. A Sprint that finished
// five things behind a river with no bridge looks finished on the board.

const delivered = (over: Partial<BacklogItem> = {}) => (it: BacklogItem): BacklogItem => ({
  ...it, status: 'open', started: true, sprintNumber: 1, openedIn: 1,
  design: { parts: {}, colors: { ground: '#c8a06a' } }, ...over,
});

/** A Sprint that delivered a habitat by the front of the park, and a kiosk further back. */
function afterASprint(): ZooGameState {
  const s = initialZooState(1);
  const habitat = s.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
  const kiosk = s.backlog.find((it) => it.category === 'amenity')!;
  const lion = s.backlog.find((it) => it.category === 'exhibit' && it.enclosureId === habitat.id)!;
  return {
    ...s, sprintNumber: 1,
    backlog: s.backlog.map((it) => {
      if (it.id === habitat.id) return delivered({ pos: { x: 400, y: PLAY_H - 200 } })(it);
      if (it.id === kiosk.id) return delivered({ pos: { x: 200, y: 120 } })(it);
      if (it.id === lion.id) return delivered()(it);
      return it;
    }),
    connectors: [{
      id: 'run', a: { x: 400, y: PLAY_H - 20 }, b: { x: 400, y: PLAY_H - 200 },
      bends: [], thickness: 14, color: '#c9a86a',
    }],
  } as ZooGameState;
}

const walked = (s: ZooGameState) => render(
  <FlyThrough state={s}>{(camera) => (
    <div data-part="picture" data-camera={camera ? `${Math.round(camera.x)},${Math.round(camera.y)},${camera.zoom}` : ''} />
  )}</FlyThrough>,
);

afterEach(() => { vi.useRealTimers(); });

describe('the stops on the walk', () => {
  it('starts at the gate, where a visitor starts', () => {
    const stops = walkStops(afterASprint());
    expect(stops.length, 'nothing to walk at all').toBeGreaterThan(1);
    expect(stops[0].caption).toBe('In at the gate');
    expect(stops[0].at, 'the walk begins somewhere other than the way in').toEqual(ENTRANCE);
  });

  it('says out loud when nobody can walk to something delivered', () => {
    // A river the width of the park, with no bridge over it, and the kiosk on the far side. This is
    // the Sprint that looks finished on the board: five things delivered, and a visitor coming
    // through the gate can reach none of them.
    const s = afterASprint();
    const kiosk = s.backlog.find((it) => it.category === 'amenity')!;
    const river: BacklogItem = {
      ...kiosk, id: 'river', name: 'River', category: 'flora', template: 'river',
      enclosureId: undefined, pos: { x: 410, y: PLAY_H - 120 },
      design: { parts: { type: 'river', piece: 'river' }, colors: {} },
    };
    const stops = walkStops({ ...s, connectors: [], backlog: [...s.backlog, river] } as ZooGameState);
    const stuck = stops.filter((st) => !st.reachable);
    expect(stuck.length, 'this test needs something delivered with no way to it').toBeGreaterThan(0);
    for (const st of stuck) {
      expect(st.why).toMatch(/nobody can walk to it/i);
      expect(st.visitable, 'the walk called it visitable and unreachable at once').toBe(false);
    }
  });

  it("is only this Sprint's work", () => {
    const s = afterASprint();
    const older = { ...s, sprintNumber: 2 } as ZooGameState;
    expect(walkStops(older), 'last Sprint’s work was walked as though it were new').toEqual([]);
  });

  it('has nothing to walk before anything is delivered', () => {
    expect(canWalk(initialZooState(1))).toBe(false);
    expect(walkStops(initialZooState(1))).toEqual([]);
  });
});

describe('the caption', () => {
  it('says what the rest of the game says about who can visit', () => {
    // "Open to visitors" means the item was released. A ZONE opens on three things, and the Review
    // says so in a panel beside this very picture - so a caption reading "open to visitors" next to
    // it would be the game contradicting itself in one glance.
    const s = afterASprint();
    const stop = walkStops(s).find((st) => st.item?.category === 'exhibit');
    expect(stop, 'this test needs a released animal').toBeTruthy();
    const zone = zoneSlices(s).find((z) => z.zone === stop!.item!.zone);
    expect(zone?.open, 'this test needs a zone that is not open yet').toBe(false);
    expect(stop!.why, 'the walk called it open while the Review called the zone shut')
      .toMatch(new RegExp(`${zone!.missing[0]}`, 'i'));
    expect(stop!.visitable).toBe(false);
  });
});

describe('walking it', () => {
  it('is offered once something has been delivered, and not before', () => {
    expect(walked(initialZooState(1)).container.querySelector('[data-part="walk-start"]'),
      'the walk was offered on an empty park').toBeNull();
    expect(walked(afterASprint()).container.querySelector('[data-part="walk-start"]'),
      'a Sprint delivered work and there was no way to walk it').toBeTruthy();
  });

  it('moves the camera from stop to stop, and says what it is looking at', () => {
    vi.useFakeTimers();
    const { container } = walked(afterASprint());
    const camera = () => container.querySelector('[data-part="picture"]')!.getAttribute('data-camera');
    const caption = () => container.querySelector('[data-part="walk-caption"]')?.textContent ?? '';
    expect(camera(), 'the camera was moved before anybody asked').toBe('');

    fireEvent.click(container.querySelector('[data-part="walk-start"]')!);
    expect(caption()).toMatch(/In at the gate/);
    const first = camera();
    expect(first, 'pressing walk moved nothing').toBeTruthy();

    act(() => { vi.advanceTimersByTime(HOLD_MS + TRAVEL_MS + 10); });
    expect(camera(), 'the camera stayed at the gate').not.toBe(first);
    expect(caption(), 'the caption did not follow the camera').not.toMatch(/In at the gate/);
  });

  it('ends where the last thing is, and gives the park back', () => {
    vi.useFakeTimers();
    const { container } = walked(afterASprint());
    fireEvent.click(container.querySelector('[data-part="walk-start"]')!);
    const total = walkStops(afterASprint()).length;
    for (let i = 0; i < total; i += 1) {
      act(() => { vi.advanceTimersByTime(HOLD_MS + TRAVEL_MS + 10); });
    }
    expect(container.querySelector('[data-part="walk-caption"]'), 'the walk never ended').toBeNull();
    expect(container.querySelector('[data-part="picture"]')!.getAttribute('data-camera'),
      'the camera kept hold of the park after the walk finished').toBe('');
  });

  it('can be stopped, because it is their zoo and not a screensaver', () => {
    vi.useFakeTimers();
    const { container } = walked(afterASprint());
    fireEvent.click(container.querySelector('[data-part="walk-start"]')!);
    fireEvent.click(container.querySelector('[data-part="walk-stop"]')!);
    expect(container.querySelector('[data-part="walk-caption"]')).toBeNull();
    expect(container.querySelector('[data-part="picture"]')!.getAttribute('data-camera')).toBe('');
  });
});

describe('walking closer', () => {
  it('moves the window on the drawing, so what you walk up to is drawn at the size you see it', async () => {
    // Reported from playing it: "the zoomed image is out of focus." The camera was a CSS transform,
    // and a scaled-up picture of a picture is what that gets you - the browser draws the scene at
    // the size it is laid out and then stretches the result. The viewBox moves instead, so the
    // scene is re-drawn at the size it is being looked at.
    const s = afterASprint();
    const { container, rerender } = render(<IsoZoo state={s} />);
    const svg = () => container.querySelector('svg')!;
    const boxOf = () => (svg().getAttribute('viewBox') ?? '').split(' ').map(Number);
    const whole = boxOf();
    expect(whole[2], 'the picture has no size at all').toBeGreaterThan(0);
    expect(svg().getAttribute('style') ?? '', 'the camera is still stretching a bitmap')
      .not.toMatch(/scale\(/);

    const stop = walkStops(s)[1];
    rerender(<IsoZoo state={s} camera={{ ...stop.at, zoom: stop.zoom }} />);
    await waitFor(() => {
      expect(boxOf()[2], 'walking closer did not narrow what the picture shows')
        .toBeLessThan(whole[2]);
    });
    expect(svg().getAttribute('style') ?? '', 'the camera went back to stretching a bitmap')
      .not.toMatch(/scale\(/);
  });
});
