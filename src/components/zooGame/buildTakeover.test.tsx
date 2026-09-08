import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BuildTakeover } from './BuildTakeover';
import { checkCriterion, checkedAt } from './parkChecks';
import { initialZooState } from './config';
import { presetFor, addWaterTo, addFloraTo } from './design';
import type { ItemDesign } from './design';
import type { ZooGameState, BacklogItem } from './types';

// Everything about an object is built in the takeover, and nothing else is.
//
// Reported from playing it: building on the park is a fight - you zoom, you miss, you cannot find an
// animal. The park was being asked to be a drawing board as well as a zoo. So the park keeps
// placement and orientation, and the object - footprint, ground, fence, shelter, water, planting,
// the animals - is built here, at a size you can work at.

const noop = () => {};
const edit = {
  onDesign: noop, onRename: noop, onSetEnclosure: noop, onToggleTask: noop, onConfirmAc: noop,
  onFinishBuild: noop, onRelease: noop, onInspect: noop, copySources: () => [], onAddPlant: noop,
  onSetPlantPiece: noop, onRemovePlant: noop,
} as unknown as Parameters<typeof BuildTakeover>[0]['edit'];

const game = (over: Partial<ZooGameState> = {}): ZooGameState =>
  ({ ...initialZooState(3), phase: 'sprint', dayStage: 'building', sprintNumber: 1, ...over }) as ZooGameState;
const itemOf = (s: ZooGameState, category: string): BacklogItem =>
  s.backlog.find((it) => it.category === category)!;

const open = (state: ZooGameState, item: BacklogItem, props: Record<string, unknown> = {}) => render(
  <MemoryRouter>
    <BuildTakeover state={state} item={item} edit={edit} onClose={noop} {...props} />
  </MemoryRouter>,
);

describe('where each criterion is answered', () => {
  it('splits them into the object and the park', () => {
    expect(checkedAt('Can I see a fence with no way out of it?')).toBe('object');
    expect(checkedAt('Can an animal move about in here?')).toBe('object');
    expect(checkedAt('Can I walk right round it?'), 'a criterion about where it stands was answered off the park').toBe('park');
    expect(checkedAt('Can I find them in their habitat?')).toBe('park');
  });

  it('says so on every line, so the wait is not a mystery', () => {
    const s = game();
    const { container } = open(s, itemOf(s, 'enclosure'));
    const panel = container.querySelector('[data-part="takeover-criteria"]')!;
    expect(panel.textContent, 'the criteria are not headed as the item’s own').toMatch(/Acceptance criteria/);
    expect(panel.textContent).toMatch(/here/);
    expect(panel.textContent).toMatch(/on the park/);
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

  it('states the fence rather than asking anybody to certify it', () => {
    const { s, item } = habitat();
    const v = checkCriterion(s, item, 'Can I see a fence with no way out of it?')!;
    expect(v.met).toBe(true);
    expect(v.evidence, 'the evidence does not say what was built').toMatch(/Closed/);
  });

  it('says a home is not a home until it has ground, shelter and water', () => {
    const bare = habitat({ colors: {} as ItemDesign['colors'], flora: [], water: [] });
    const before = checkCriterion(bare.s, bare.item, 'Can I tell an animal lives here, not a shed?')!;
    expect(before.met, 'an empty pen counted as a home').toBe(false);
    expect(before.evidence, 'nothing says what is missing').toMatch(/no .* yet/);

    const base = presetFor(bare.item);
    const done = habitat({
      colors: { ...base.colors, ground: '#c8a06a' },
      flora: addFloraTo({ ...base, flora: [] }, 'rocks'),
      water: addWaterTo({ ...base, water: [] }),
    });
    const after = checkCriterion(done.s, done.item, 'Can I tell an animal lives here, not a shed?')!;
    expect(after.met, 'ground, shelter and water in and it still read as a shed').toBe(true);
    expect(after.evidence).toMatch(/in$/);
  });

  it('measures room against the animals that will actually live there', () => {
    const s = game();
    const h = itemOf(s, 'enclosure');
    const lion = s.backlog.find((it) => it.category === 'exhibit' && it.enclosureId === h.id)!;
    const crowded = {
      ...s,
      backlog: s.backlog.map((it) => (it.id === lion.id
        ? { ...it, draftDesign: { ...presetFor(it), group: { males: 2, females: 3, juveniles: 2, cubs: 3 } } }
        : it.id === h.id ? { ...it, enclosureSize: 'small' as const } : it)),
    } as ZooGameState;
    const v = checkCriterion(crowded, crowded.backlog.find((it) => it.id === h.id)!, 'Can an animal move about in here?')!;
    expect(v.met, 'a small pen held a whole pride').toBe(false);
    expect(v.evidence, 'the evidence is arithmetic rather than a sentence').toMatch(/needs a (small|medium|large) one/);
  });
});

describe('an animal', () => {
  it('is built here and chooses the habitat it lives in', () => {
    const s = game();
    const lion = itemOf(s, 'exhibit');
    const { container } = open(s, lion, { onPutIn: noop });
    const where = container.querySelector('[data-part="where-it-goes"]')!;
    expect(where.textContent, 'an animal was asked where on the park to stand').toMatch(/Which habitat/);
    expect(container.querySelectorAll('[data-habitat]').length, 'no habitats to choose from').toBeGreaterThan(0);
  });

  it('will not go into a habitat that is not standing yet, and says why', () => {
    const s = game();
    const lion = itemOf(s, 'exhibit');
    const { container } = open(s, lion, { onPutIn: noop });
    const choice = container.querySelector('[data-habitat]') as HTMLButtonElement;
    expect(choice.disabled, 'an animal moved into a habitat nobody had built').toBe(true);
    expect(choice.textContent).toMatch(/not built yet/);
  });

  it('goes in once the habitat is standing', () => {
    const onPutIn = vi.fn();
    const s = game();
    const h = itemOf(s, 'enclosure');
    const lion = itemOf(s, 'exhibit');
    // Built and standing, not yet accepted: an animal needs somewhere to live, not a signature.
    const built = {
      ...s,
      backlog: s.backlog.map((it) => (it.id === h.id
        ? { ...it, status: 'committed' as const, started: true, design: presetFor(it), pos: { x: 300, y: 300 } } : it)),
    } as ZooGameState;
    const { container } = open(built, lion, { onPutIn });
    const choice = [...container.querySelectorAll('[data-habitat]')]
      .find((b) => (b.textContent ?? '').includes(h.name)) as HTMLButtonElement;
    expect(choice.disabled).toBe(false);
    fireEvent.click(choice);
    expect(onPutIn, 'choosing a built habitat put nothing anywhere').toHaveBeenCalledWith(lion.id, h.id);
  });
});

describe('the takeover and the seat looking at it', () => {
  it('offers the controls to a Developer', () => {
    const s = game();
    const { container } = open(s, itemOf(s, 'enclosure'));
    expect(container.textContent).toMatch(/Footprint/);
    expect(screen.getByRole('button', { name: /Place on the park/ })).toBeTruthy();
  });

  it('offers a Product Owner what it has to be, and no controls', () => {
    const s = game();
    const { container } = open(s, itemOf(s, 'enclosure'), { canBuild: false });
    expect(container.querySelector('[data-part="takeover-criteria"]'),
      'the Product Owner cannot see what it has to be').toBeTruthy();
    expect(screen.queryByRole('button', { name: /Place on the park/ }),
      'a Product Owner was offered the Developers’ work').toBeNull();
    expect(container.textContent).toMatch(/How it gets made is theirs/);
  });

  it('keeps it in hand when it is kept as a draft', () => {
    const onClose = vi.fn();
    const s = game();
    open(s, itemOf(s, 'enclosure'), { onClose });
    fireEvent.click(screen.getByRole('button', { name: 'Keep as draft' }));
    expect(onClose).toHaveBeenCalled();
    expect(within(document.body).getByText(/Nothing is on the park until you place it/)).toBeTruthy();
  });
});
