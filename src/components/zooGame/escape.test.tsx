import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintReview } from './SprintReview';
import { initialZooState } from './config';
import { reviewSprint, whatGotOut, editItem, decisionsIn } from './engine';
import { currentDesign } from './design';
import type { ZooGameState, BacklogItem } from './types';

// What got out, and what it cost.
//
// The consequence the barrier decision exists for, and the one the design note builds Sprint 1
// around: do not open without something that holds them. It can only happen to a habitat that is
// OPEN - the mistake is not building a weak fence, it is opening a zone with one.
//
// What it costs is the ZONE, not the habitat. An escape shuts the place for the day: everybody is
// walked back to the gate, so nothing in there is seen by anybody, including what was finished and
// fine. That reuses what unreachable work already does rather than inventing a second penalty, and
// it says itself in one sentence - the Big Cats shut, and nobody saw anything in there.

const part = (over: Partial<BacklogItem>): BacklogItem => ({
  id: 'x', name: 'Thing', zone: 'Big Cats', category: 'enclosure', status: 'open',
  started: true, sprintNumber: 1, estimate: 5, acceptance: [], acConfirmed: [], tasks: [], ...over,
} as BacklogItem);

/** An open zone: a habitat, its lion, and its own path. `barrier` is what was chosen for the pen. */
const zoo = (barrier: string, extra: BacklogItem[] = []): ZooGameState => ({
  ...initialZooState(3), phase: 'sprint', sprintNumber: 1,
  backlog: [
    part({ id: 'enc', name: 'Lion Enclosure', enclosureSize: 'large', pos: { x: 400, y: 800 },
      design: { parts: { barrier }, colors: { ground: '#c9a86a', fence: '#8a6a3b' },
        flora: [{ x: 0.3, y: 0.4, s: 1, type: 'tree' }], water: [{ x: 0.6, y: 0.5, w: 0.2, h: 0.2 }] } }),
    part({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc',
      appeal: { families: 8, enthusiasts: 7, comfortSeekers: 6 },
      design: { parts: {}, colors: {}, group: { males: 1, females: 1, juveniles: 0, cubs: 0 } } }),
    part({ id: 'paths', name: 'Big Cats Paths', category: 'path' }),
    ...extra,
  ],
} as unknown as ZooGameState);

describe('an escape', () => {
  it('happens when what is open does not hold what lives in it', () => {
    const out = whatGotOut(zoo('hedge'));
    expect(out, 'a lion behind a low hedge stayed put').toHaveLength(1);
    expect(out[0].escapee).toBe('Lion');
    expect(out[0].zone).toBe('Big Cats');
  });

  it('does not happen to a habitat that holds them', () => {
    expect(whatGotOut(zoo('high')), 'a 4m fence let the lion out').toHaveLength(0);
  });

  it('does not happen while the habitat is still being built', () => {
    // The mistake is OPENING a zone with a weak fence, not building one. A pen still in hand has
    // nobody in it to get out and nobody looking at it.
    const building = {
      ...zoo('hedge'),
      backlog: zoo('hedge').backlog.map((it) => (it.category === 'enclosure'
        ? { ...it, status: 'committed' as const } : it)),
    } as ZooGameState;
    expect(whatGotOut(building), 'something got out of a building site').toHaveLength(0);
  });

  it('is how a pen that held the penguins fails when a leopard moves in', () => {
    // The honest route to it, and the one that needs no downgrade: the barrier was right for what
    // used to live here. Moving an animal is a decision, and this is its consequence.
    const penguins = {
      ...zoo('fence'),
      backlog: zoo('fence').backlog.map((it) => (it.id === 'lion'
        ? { ...it, name: 'Penguins', template: 'penguins' } : it)),
    } as ZooGameState;
    expect(whatGotOut(penguins), 'a 2m fence could not hold penguins').toHaveLength(0);
    const leopard = {
      ...penguins,
      backlog: penguins.backlog.map((it) => (it.id === 'lion'
        ? { ...it, name: 'Leopard', template: 'leopard' } : it)),
    } as ZooGameState;
    expect(whatGotOut(leopard)[0]?.escapee, 'the leopard stayed in the penguin pen').toBe('Leopard');
  });

  it('is how downgrading an open habitat fails too', () => {
    // The other route: it was built properly, opened, and then somebody changed what holds them.
    const built = zoo('high');
    expect(whatGotOut(built)).toHaveLength(0);
    const cheapened = editItem(built, 'enc',
      { ...currentDesign(built.backlog[0]), parts: { barrier: 'hedge' } });
    expect(whatGotOut(cheapened), 'swapping the fence for a hedge changed nothing').toHaveLength(1);
  });
});

describe('what it costs', () => {
  it('shuts the zone, so nothing in there is seen at all', () => {
    const got = reviewSprint(zoo('hedge'));
    const held = reviewSprint(zoo('high'));
    expect(got.lastReview!.overallHappiness,
      'a day with a lion loose pleased the visitors as much as a day without')
      .toBeLessThan(held.lastReview!.overallHappiness);
  });

  it('still counts the work as delivered - it is the opening that was the mistake', () => {
    const after = reviewSprint(zoo('hedge'));
    expect(after.velocity[after.velocity.length - 1],
      'the Sprint delivered nothing, apparently').toBeGreaterThan(0);
  });

  it('goes into the log in the team’s own words', () => {
    // So the Retrospective inspects "we opened the Big Cats with a hedge round a lion" rather than
    // a memory of a bad Review.
    const after = reviewSprint(zoo('hedge'));
    const said = decisionsIn(after, 1).map((d) => `${d.what} ${d.cost ?? ''}`).join(' | ');
    expect(said, 'the escape was not written down').toMatch(/got out of the Lion Enclosure/);
    expect(said, 'the log does not say what was round it').toMatch(/hedge/i);
  });
});

describe('the Review says it', () => {
  it('gives the keeper’s report, naming the animal and the zone', () => {
    const s = { ...reviewSprint(zoo('hedge')), phase: 'review' } as ZooGameState;
    const { container } = render(
      <MemoryRouter>
        <SprintReview state={s} onContinue={() => {}} onOpen={() => {}}
          onToggleTask={() => {}} onTakeSignal={() => {}} />
      </MemoryRouter>,
    );
    const said = container.querySelector('[data-part="escaped"]');
    expect(said, 'nothing on the Review says an animal got out').toBeTruthy();
    expect(said!.textContent).toMatch(/Lion/);
    expect(said!.textContent, 'it does not say the zone shut').toMatch(/shut for the day/i);
  });

  it('says nothing when everything stayed where it was put', () => {
    const s = { ...reviewSprint(zoo('high')), phase: 'review' } as ZooGameState;
    const { container } = render(
      <MemoryRouter>
        <SprintReview state={s} onContinue={() => {}} onOpen={() => {}}
          onToggleTask={() => {}} onTakeSignal={() => {}} />
      </MemoryRouter>,
    );
    expect(container.querySelector('[data-part="escaped"]'),
      'a Review with nothing loose is filing a keeper’s report').toBeNull();
  });
});
