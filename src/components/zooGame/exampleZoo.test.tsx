import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { IsoZoo } from './IsoZoo';
import { exampleZoo } from './exampleZoo';

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
