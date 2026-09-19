import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { IsoZoo } from './IsoZoo';
import { exampleZoo } from './exampleZoo';
import { standingOnPark, parkPositions, positionOf } from './parkModel';

// The zoo on the orientation screen is one the game really built.
//
// Asked for after reading the orientation: "can we show an example of a built zoo using a labelled
// isometric view?"
//
// The tempting way to do this is a hand-written state that looks like a built zoo, or a drawing of
// one. Both would be a second source of truth about what a zoo is, and a second source drifts: a
// picture showing a habitat with no perimeter, or an animal standing beside its enclosure rather
// than in it, used to teach people what the game does.
//
// So it is built by driving the engine down the same route `everyKindReachesLive` walks, and these
// tests hold that: if the route changes, the example changes with it or this fails.

describe('the example zoo', () => {
  const { state, labels } = exampleZoo();
  const find = (id: string) => state.backlog.find((it) => it.id === id);

  it('is open to visitors, which is the whole route walked', () => {
    // Not "built". Open: started, chosen, built, placed, accepted by the Product Owner, moved to
    // Done by the Developers and then released. Anything less is a building site.
    for (const l of labels) {
      expect(find(l.id)?.status, `${l.title} never opened`).toBe('open');
    }
  });

  it('has one of each thing the orientation talks about', () => {
    const kinds = labels.map((l) => find(l.id)?.category);
    expect(new Set(kinds)).toEqual(new Set(['enclosure', 'exhibit', 'amenity', 'path']));
  });

  it('puts the animal IN the habitat, because the game would not allow otherwise', () => {
    const animal = labels.map((l) => find(l.id)).find((it) => it?.category === 'exhibit')!;
    const home = labels.map((l) => find(l.id)).find((it) => it?.category === 'enclosure')!;
    expect(animal.enclosureId, 'the lion is standing next to its enclosure').toBe(home.id);
  });

  it('lays a run of path, because a habitat nobody can walk to is not Done', () => {
    expect((state.connectors ?? []).length, 'nothing was drawn').toBeGreaterThan(0);
  });

  it('is the same zoo every time, so a trainer can talk over it', () => {
    expect(exampleZoo().state).toBe(state);
  });
});

describe('the labels point at something', () => {
  // The one that matters. Every label carries a selector for finding its thing in the drawing, and
  // the park tags what it draws in more than one way: a habitat and a building by their item id, an
  // animal by its spot, a path by the run. A renderer change that drops one of those tags leaves a
  // numbered key beside a picture with nothing numbered on it, and nothing else would notice.
  const { state, labels } = exampleZoo();

  it('finds every labelled thing in the drawing', () => {
    const { container } = render(<IsoZoo state={state} height={320} />);
    const missing = labels.filter((l) => !container.querySelector(l.find));
    expect(missing.map((l) => `${l.title} (${l.find})`),
      'the drawing has nothing carrying these labels').toEqual([]);
  });

  it('reads the names off the items rather than writing them out again', () => {
    for (const l of labels) {
      expect(l.title, `${l.id} was labelled with prose instead of its name`)
        .toBe(state.backlog.find((it) => it.id === l.id)?.name);
    }
  });
});

describe('where the camera stands', () => {
  const { camera } = exampleZoo();

  it('walks up to the zoo, because the park is mostly grass', () => {
    // Four areas wide, and this zoo is one corner of one of them. At the whole-park shot the built
    // work is a speck with four labels piled on it.
    expect(Number.isFinite(camera.x) && Number.isFinite(camera.y), 'the camera is aimed at nothing').toBe(true);
    expect(camera.zoom, 'it is not walked up to at all').toBeGreaterThan(1);
  });

  it('is not dragged off to the car park by a path', () => {
    // The first real recording framed itself halfway to the way in, because the run drawn from
    // there to the habitat was counted as part of the work. The habitat, the animal in it and the
    // toilets beside it all went off the top of the picture to make room for a car park nobody was
    // pointing at.
    const { state, labels, camera } = exampleZoo();
    const ids = new Set(labels.map((l) => l.id));
    const spots = standingOnPark(state).filter((st) => ids.has(st.item.id));
    expect(spots.length, 'nothing labelled is standing on the park').toBeGreaterThan(1);
    const at = parkPositions(spots, new Map());
    const xs = spots.map((st) => positionOf(st, at).x);
    const ys = spots.map((st) => positionOf(st, at).y);
    // The shot sits among the things it is pointing at, not somewhere between them and the gate.
    const room = 160;
    expect(camera.x, 'the camera wandered off the labelled work').toBeGreaterThan(Math.min(...xs) - room);
    expect(camera.x).toBeLessThan(Math.max(...xs) + room);
    expect(camera.y).toBeGreaterThan(Math.min(...ys) - room);
    expect(camera.y).toBeLessThan(Math.max(...ys) + room);
  });

  it('walks in far enough to see what it is pointing at', () => {
    // Fitted to what is labelled rather than a number tuned once: a recording can be tucked in a
    // corner or spread across an area, and a fixed zoom that flatters one halves the other.
    expect(exampleZoo().camera.zoom, 'it is showing the whole park and calling it an example')
      .toBeGreaterThan(1.4);
  });

  it('stands there from the first frame rather than swooping in', () => {
    // A camera given at MOUNT means "stand here". It used to start at the whole park and walk in,
    // which is a swoop nobody asked for - and it is an ANIMATION, so on a tab nobody is looking at
    // it never ran and the picture was simply the wrong one. Anything measured against the picture
    // was measured against the wide shot and left behind when it landed.
    const { state } = exampleZoo();
    const wide = render(<IsoZoo state={state} height={320} />).container.querySelector('svg');
    const near = render(<IsoZoo state={state} height={320} camera={camera} />).container.querySelector('svg');
    expect(near?.getAttribute('viewBox'), 'it opened on the wide shot and meant to walk in')
      .not.toBe(wide?.getAttribute('viewBox'));
  });
});

describe('when somebody records one', () => {
  // "Can the orientation zoo images be based upon actual zoo footage? We record steps so can the
  // example view be based upon how a player actually places and builds features?"
  //
  // They can. The game already keeps its own account of what was pressed - the seed and the actions
  // in order - and replays it, because the reducer is pure. A recorded trail dropped into
  // exampleZooTrail.ts is replayed here, so the example stops being a zoo this repo describes and
  // becomes the zoo somebody built.
  //
  // What is held here is the part that makes that safe: a recording is somebody else's play, and a
  // screen that renders whatever it is handed is a screen that can ship a half-built zoo with four
  // labels pointing at nothing.

  it('replays to a state, not to a description', async () => {
    const { replay } = await import('./replay');
    const { initialZooState } = await import('./config');
    // A trail of nothing still replays: the seed alone is a game that has not started.
    const walked = replay({ seed: 3, actions: [] });
    expect(walked).toHaveLength(1);
    expect(walked[0].backlog.length, 'a replayed game has no Product Backlog').toBe(
      (initialZooState(3) as { backlog: unknown[] }).backlog.length);
  });

  it('keeps the whole game when it is being recorded, and a window when it is not', async () => {
    const { remember, trail, forgetTrail, recordEverything } = await import('./trail');
    const press = (n: number) => ({ type: 'SET_PHASE', phase: `p${n}` } as never);
    try {
      // The ordinary game: a window on the end, short enough to paste into a message.
      forgetTrail(); recordEverything(false);
      for (let i = 0; i < 200; i++) remember(press(i));
      expect(trail().actions.length, 'an ordinary game keeps everything and cannot be pasted').toBe(80);

      // Recording: the whole build, because an example is the finished thing and a window on the
      // end of it replays to a zoo with no beginning.
      forgetTrail(); recordEverything(true);
      for (let i = 0; i < 200; i++) remember(press(i));
      expect(trail().actions.length, 'a recording lost the start of the build').toBe(200);
    } finally {
      forgetTrail(); recordEverything(false);
    }
  });

  it('holds a recorded zoo to the same bar as one built here', () => {
    // Whichever way the state arrived, the screen asks the zoo what is in it and labels that. The
    // checks above - everything labelled is open, the animal is in the habitat, a path is drawn -
    // are the ones that would catch a recording of a half-built zoo, and they run over whatever
    // exampleZoo() returns rather than over the fallback specifically.
    const { state, labels } = exampleZoo();
    expect(labels.length, 'a zoo with nothing worth labelling reached the screen').toBeGreaterThan(2);
    for (const l of labels) {
      expect(state.backlog.find((it) => it.id === l.id)?.status, `${l.title} is not open`).toBe('open');
    }
  });
});
