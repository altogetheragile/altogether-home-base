import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkInspector } from './ParkInspector';
import { ParkPlan } from './ParkPlan';
import { checkCriterion, checkedAt } from './parkChecks';
import { initialZooState } from './config';
import { presetFor, addWaterTo, addFloraTo, HABITAT_FEATURE_TYPES } from './design';
import type { ItemDesign } from './design';
import type { ZooGameState, BacklogItem } from './types';

// Everything is built on the park.
//
// The takeover is gone. It put the object on a bench of its own, which meant building something
// without being able to see where it stood, and turning or moving it only after closing the window.
// What is left in its place: the park itself, one options strip under it, and a slim inspector
// docked on the park saying what the thing has to be.

const game = (over: Partial<ZooGameState> = {}): ZooGameState =>
  ({ ...initialZooState(3), phase: 'sprint', dayStage: 'building', sprintNumber: 1, ...over }) as ZooGameState;
const itemOf = (s: ZooGameState, category: string): BacklogItem =>
  s.backlog.find((it) => it.category === category)!;
/** The criteria panel, open. It is closed until it is asked for - it was always in the way on the
 *  park - so asking for it is part of rendering it here. */
const inspector = (state: ZooGameState, item: BacklogItem, props: Record<string, unknown> = {}) => {
  const out = render(
    <MemoryRouter><ParkInspector state={state} item={item} {...props} /></MemoryRouter>,
  );
  const shut = out.container.querySelector('[data-part="park-inspector"][data-collapsed="yes"]');
  if (shut) fireEvent.click(shut);
  return out;
};

describe('where each criterion is answered', () => {
  it('splits them into the object and the park', () => {
    expect(checkedAt('Can I see a fence with no way out of it?')).toBe('object');
    expect(checkedAt('Can an animal move about in here?')).toBe('object');
    expect(checkedAt('Can I walk right round it?'), 'a criterion about where it stands was answered off the park').toBe('park');
    expect(checkedAt('Can I find them in their habitat?')).toBe('park');
  });

  it('says so on every line, so the wait is not a mystery', () => {
    const s = game();
    const { container } = inspector(s, itemOf(s, 'enclosure'));
    const panel = container.querySelector('[data-part="park-inspector"]')!;
    expect(panel.textContent, 'the criteria are not headed as the item’s own').toMatch(/Acceptance criteria/);
    expect(panel.textContent).toMatch(/here/);
    expect(panel.textContent).toMatch(/park/);
    // Never merged with the Definition of Done, which is the product's bar and is shown at the gate.
    expect(panel.textContent, 'the Definition of Done was pulled into the item’s criteria')
      .not.toMatch(/Peer-reviewed by another Developer/);
  });
});

describe('what the park can already answer about a habitat', () => {
  const habitat = (design?: Partial<ItemDesign>) => {
    const s = game();
    const h = itemOf(s, 'enclosure');
    const item = { ...h, draftDesign: { ...presetFor(h), ...design } } as BacklogItem;
    return { s: { ...s, backlog: s.backlog.map((it) => (it.id === h.id ? item : it)) } as ZooGameState, item };
  };

  it('says what is holding them in, and whether it will', () => {
    // It used to answer `met: true` always - "a habitat is fenced by construction" - so the one
    // criterion about safety could not fail and Sprint 1 had no mistake in it to reflect on. What is
    // round a habitat is a choice now, and this says whether that choice holds what lives inside.
    const { s, item } = habitat();
    const v = checkCriterion(s, item, 'Can I see a fence with no way out of it?')!;
    expect(v.met, 'the habitat was built adequate and still failed').toBe(true);
    expect(v.evidence, 'the evidence does not say what is holding them').toMatch(/fence|wall|hedge|Glass/i);
  });

  it('says a home is not a home until it has ground, shelter and water', () => {
    const bare = habitat({ colors: {} as ItemDesign['colors'], flora: [], water: [] });
    const before = checkCriterion(bare.s, bare.item, 'Can I tell an animal lives here, not a shed?')!;
    expect(before.met, 'an empty pen counted as a home').toBe(false);
    expect(before.evidence, 'nothing says what is missing').toMatch(/no .* yet/);

    const base = presetFor(bare.item);
    const done = habitat({
      colors: { ...base.colors, ground: '#c8a06a' },
      flora: addFloraTo({ ...base, flora: [] }, HABITAT_FEATURE_TYPES[0]),
      water: addWaterTo({ ...base, water: [] }),
    });
    const after = checkCriterion(done.s, done.item, 'Can I tell an animal lives here, not a shed?')!;
    expect(after.met, 'ground, shelter and water in and it still read as a shed').toBe(true);
    expect(after.evidence).toMatch(/in$/);
  });
});

describe('the inspector on the park', () => {
  it('does not offer the ask while a fact is outstanding, and says which', () => {
    const s = game();
    const { container } = inspector(s, itemOf(s, 'enclosure'));
    expect(screen.queryByRole('button', { name: /Ask Priya to check/ }),
      'work with facts outstanding was offered for acceptance').toBeNull();
    expect(container.textContent, 'nothing says what is holding it up').toMatch(/Not ready to ask/);
  });

  it('says who judges the rest once every fact is in', () => {
    const s = game();
    const h = itemOf(s, 'enclosure');
    const p = presetFor(h);
    const built = { ...h, design: { ...p, colors: { ...p.colors, ground: '#c8a06a' },
      flora: addFloraTo({ ...p, flora: [] }, HABITAT_FEATURE_TYPES[0]), water: addWaterTo({ ...p, water: [] }) },
      pos: { x: 300, y: 300 } } as BacklogItem;
    const standing = { ...s, backlog: s.backlog.map((it) => (it.id === h.id ? built : it)) } as ZooGameState;
    const { container } = inspector(standing, built, { onAskToCheck: () => {} });
    expect(container.textContent, 'the facts are in and it still will not ask').toMatch(/Ask Priya to check/);
  });

  it('collapses to a pill inside a habitat, so it does not cover the pen', () => {
    const s = game();
    const { container } = inspector(s, itemOf(s, 'enclosure'), { collapsed: true });
    const panel = container.querySelector('[data-part="park-inspector"]')!;
    expect(panel.getAttribute('data-collapsed')).toBe('yes');
    expect(panel.textContent).toMatch(/Acceptance criteria/);
    expect(panel.textContent, 'the whole list is still covering the enclosure').not.toMatch(/judges/);
  });
});

describe('an animal', () => {
  it('moves in when it is dropped on a habitat that is standing', () => {
    // No picker, no dialog: carry it and let go. The habitat is on the park, and the animal goes
    // where you put it - which is the same gesture as everything else.
    const onPlace = vi.fn();
    const s = game();
    const h = itemOf(s, 'enclosure');
    const lion = s.backlog.find((it) => it.category === 'exhibit' && it.enclosureId === h.id)!;
    const standing = {
      ...s,
      backlog: s.backlog.map((it) => (it.id === h.id
        ? { ...it, status: 'open' as const, design: presetFor(it), pos: { x: 300, y: 300 } } : it)),
    } as ZooGameState;
    const { container } = render(
      <ParkPlan state={standing} placing={{ id: lion.id, w: 40, h: 40 }} onPlace={onPlace} />,
    );
    const svg = container.querySelector('[data-part="park-plan"]')!;
    // jsdom has no layout, so the pointer lands at the origin of the box - which is inside the
    // habitat as far as the maths is concerned once the box is stubbed.
    // The picture is fitted to whatever room it is given and carries a margin of countryside, so a
    // park coordinate is not a client coordinate. Worked out from the viewBox the park actually
    // drew: written as literals, this test dropped the lion on the habitat until the plot grew, and
    // then dropped it on the grass.
    const [vx, vy, vw, vh] = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
    const W = 820, H = 700;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: W, height: H, right: W, bottom: H, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    const k = Math.min(W / vw, H / vh);
    const client = (x: number, y: number) => ({ clientX: (x - vx) * k + (W - vw * k) / 2, clientY: (y - vy) * k + (H - vh * k) / 2 });
    fireEvent.pointerDown(svg, client(300, 300));
    expect(onPlace, 'an animal dropped on a habitat did not move in').toHaveBeenCalledWith(
      lion.id, expect.anything(), undefined, h.id,
    );
  });
});

describe('when the ask disappears', () => {
  it('says which fact took it away', () => {
    // Reported from playing it: "if I choose a family of lions I lose the Priya check option. If I
    // change it to a pair the option reappears." The game was right - six lions do not fit in a
    // medium pen - but the button vanishing says nothing, so it reads as the game losing the
    // option rather than as the work not being finished.
    const s = game();
    const h = itemOf(s, 'enclosure');
    const lion = s.backlog.find((it) => it.category === 'exhibit' && it.enclosureId === h.id)!;
    const family = {
      ...lion,
      design: { ...presetFor(lion), group: { males: 2, females: 3, juveniles: 1, cubs: 2 } },
    } as BacklogItem;
    const crowded = {
      ...s,
      backlog: s.backlog.map((it) => (it.id === h.id ? { ...it, enclosureSize: 'small' as const } : it)),
    } as ZooGameState;
    const { container } = inspector(crowded, family);
    expect(container.textContent, 'nothing says why it cannot be asked for yet').toMatch(/Not ready to ask/);
    expect(container.textContent, 'nothing says what would fix it').toMatch(/they need a (small|medium|large) one/);
  });
});
