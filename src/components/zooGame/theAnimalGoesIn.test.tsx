import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ParkPlan } from './ParkPlan';
import { initialZooState } from './config';
import { presetFor, footprintFor } from './design';
import type { ZooGameState, BacklogItem } from './types';

// An animal does not stand on the park. It lives in a habitat, so the habitat is what you aim at.
//
// Reported from playing it: "I cannot place the lions in the enclosure." Carrying a lion over its
// own enclosure drew a RED box reading "on top of Lion Enclosure" - the placement rule treating the
// one thing the player was trying to do as the reason they could not.
//
// The drop already knew better, and that was the whole fault: two rules for one gesture. The drop
// wanted the pointer strictly inside the habitat's own box, the ghost asked a rule that knows
// nothing about animals, and between them a lion let go where the ghost said no landed nowhere and
// nothing said why.
//
// Which animal this is about has since narrowed. An animal whose card already names its habitat is
// never handed to you at all - see `anAnimalIsStocked` - because dropping it on the pen it belongs
// to only writes down what the card already says. The gesture is for the animal nobody has given a
// home to: the drop is what names one, so it is the one case where carrying a lion decides
// anything. The lion here has no habitat, which is why it is in your hands.

const HOME = { x: 300, y: 800 };

const park = (): { s: ZooGameState; lion: BacklogItem; pen: BacklogItem } => {
  const base = initialZooState(1) as ZooGameState;
  const pen = base.backlog.find((it) => it.category === 'enclosure')!;
  const lion = base.backlog.find((it) => it.category === 'exhibit' && it.enclosureId === pen.id)!;
  const built = { ...pen, status: 'open' as const, started: true, sprintNumber: 1,
    enclosureSize: 'large' as const, design: presetFor(pen), pos: HOME } as BacklogItem;
  // No habitat named on the card: the one animal there is still a placement to make for.
  const held = { ...lion, status: 'committed' as const, started: true, sprintNumber: 1,
    enclosureId: undefined } as BacklogItem;
  return {
    s: { ...base, phase: 'sprint', sprintNumber: 1,
      backlog: base.backlog.map((it) => (it.id === pen.id ? built : it.id === lion.id ? held : it)) } as ZooGameState,
    lion: held, pen: built,
  };
};

const plan = (s: ZooGameState, lion: BacklogItem, onPlace: (...a: unknown[]) => void) => {
  const r = render(
    <ParkPlan state={s} placing={{ id: lion.id, ...footprintFor(lion) }}
      onPlace={onPlace as never} />,
  );
  const svg = r.container.querySelector('[data-part="park-plan"]')!;
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 820, height: 760,
    right: 820, bottom: 760, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  return { ...r, svg };
};

/** Where the habitat ended up ON SCREEN, so the test aims at the thing rather than at a guess.
 *
 *  The park draws in its own units and the pointer arrives in client pixels, so this goes through
 *  the viewBox the same way the park does. Aiming in park units put every press off the map, which
 *  the ghost said plainly: "off the park". */
const onScreen = (svg: Element, user: { x: number; y: number }) => {
  const [vx, vy, vw, vh] = (svg.getAttribute('viewBox') ?? '0 0 1 1').split(/\s+/).map(Number);
  const box = svg.getBoundingClientRect();
  // The park letterboxes its viewBox - one scale for both axes, the remainder split as a margin -
  // so a straight ratio per axis lands somewhere else entirely. Measured the hard way: aiming at
  // the middle of the habitat put the ghost a hundred units below it.
  const scale = Math.min(box.width / vw, box.height / vh);
  return {
    x: (user.x - vx) * scale + (box.width - vw * scale) / 2,
    y: (user.y - vy) * scale + (box.height - vh * scale) / 2,
  };
};

const penAt = (container: HTMLElement, svg: Element, penId: string) => {
  // The enclosure itself, by id. `[data-plan-item] rect` picked whatever the park drew first, which
  // is the lion's own plot - so the test was aiming the lion at the lion.
  const box = container.querySelector(`[data-plan-item="${penId}"] rect`)!;
  return onScreen(svg, {
    x: Number(box.getAttribute('x')) + Number(box.getAttribute('width')) / 2,
    y: Number(box.getAttribute('y')) + Number(box.getAttribute('height')) / 2,
  });
};

describe('carrying an animal over its habitat', () => {
  it('says it is going IN, not that it is on top of something', () => {
    const { s, lion, pen } = park();
    const { container, svg } = plan(s, lion, () => {});
    const at = penAt(container, svg, pen.id);
    fireEvent.pointerMove(svg, { clientX: at.x, clientY: at.y });
    const ghost = container.querySelector('[data-part="ghost"]')!;
    expect(ghost, 'nothing is drawn under the cursor at all').toBeTruthy();
    expect(ghost.textContent, 'the habitat is still being called an obstacle').not.toMatch(/on top of/);
    expect(ghost.textContent, 'it does not say where the animal is going').toMatch(/into/i);
    // Green, not red: this is the gesture, not a refusal of it.
    expect(ghost.querySelector('rect')?.getAttribute('stroke')).toBe('#059669');
  });

  it('moves in when it is let go there', () => {
    const onPlace = vi.fn();
    const { s, lion, pen } = park();
    const { container, svg } = plan(s, lion, onPlace);
    const at = penAt(container, svg, pen.id);
    fireEvent.pointerDown(svg, { clientX: at.x, clientY: at.y });
    expect(onPlace, 'the lion was let go over its habitat and nothing happened').toHaveBeenCalled();
    const [, , , into] = onPlace.mock.calls[0] as [string, unknown, unknown, string];
    expect(into, 'it landed on the park instead of in the habitat').toBe(pen.id);
  });

  it('says what is wrong when it is let go on the grass', () => {
    // Nothing used to be said at all: the drop returned silently and the animal stayed in hand.
    const onPlace = vi.fn();
    const { s, lion } = park();
    const { container, svg } = plan(s, lion, onPlace);
    // Grass in its OWN area, clear of the habitat: aiming outside the Big Cats gets a different
    // refusal, which is also true and is not what this is about.
    const far = onScreen(svg, { x: 800, y: 800 });
    fireEvent.pointerMove(svg, { clientX: far.x, clientY: far.y });
    const ghost = container.querySelector('[data-part="ghost"]')!;
    expect(ghost.textContent, 'an animal on the grass is refused with no reason').toMatch(/habitat/i);
    expect(ghost.querySelector('rect')?.getAttribute('stroke')).toBe('#dc2626');
  });
});

// ...and the same gesture when the animal is already out there.
//
// An animal with no habitat stands on the grass of its own area rather than vanishing, and it can
// be picked up. That drag drew the same green ghost promising "into the Lion Enclosure" and then
// wrote a POSITION, which is the one thing an animal does not have: the park draws it inside its
// habitat or not at all, so the position was read by nothing and the lion stayed on the grass.
describe('dragging an animal that is already standing', () => {
  const outside = (): { s: ZooGameState; lion: BacklogItem; pen: BacklogItem } => {
    const { s, lion, pen } = park();
    // Built, so visitors could walk to it - and the lion beside it, belonging nowhere.
    const out = { ...lion, status: 'open' as const } as BacklogItem;
    return { s: { ...s, backlog: s.backlog.map((it) => (it.id === lion.id ? out : it)) } as ZooGameState,
      lion: out, pen };
  };

  const standing = (s: ZooGameState, onPlace: (...a: unknown[]) => void) => {
    const r = render(<ParkPlan state={s} onPlaceItem={() => {}} onPlace={onPlace as never} />);
    const svg = r.container.querySelector('[data-part="park-plan"]')!;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 820, height: 760,
      right: 820, bottom: 760, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    return { ...r, svg };
  };

  it('moves it in, rather than writing down a spot nothing reads', () => {
    const onPlace = vi.fn();
    const { s, lion, pen } = outside();
    const { container, svg } = standing(s, onPlace);
    const from = container.querySelector(`[data-plan-item="${lion.id}"]`);
    expect(from, 'the homeless lion is not on the park to pick up').toBeTruthy();
    const at = penAt(container, svg, pen.id);
    // Taken hold of by its middle. A drag carries whatever the grab offset was, so pressing a
    // corner of the park and letting go over the pen aims the lion that far off the pen.
    const grab = penAt(container, svg, lion.id);
    fireEvent.pointerDown(from!, { clientX: grab.x, clientY: grab.y });
    // Far enough to count as a drag: a press that does not move opens the card instead.
    fireEvent.pointerMove(window, { clientX: at.x, clientY: at.y });
    fireEvent.pointerUp(window, { clientX: at.x, clientY: at.y });
    expect(onPlace, 'the lion was dropped on the habitat and nothing happened').toHaveBeenCalled();
    const [, , , into] = onPlace.mock.calls[0] as [string, unknown, unknown, string];
    expect(into, 'it was given a position instead of a home').toBe(pen.id);
  });
});
