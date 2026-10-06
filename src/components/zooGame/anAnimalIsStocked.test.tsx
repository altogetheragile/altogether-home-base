import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooShell } from './ZooShell';
import { initialZooState } from './config';
import { presetFor } from './design';
import { putDownByHand, groupsFor } from './buildGroups';
import type { ZooGameState, BacklogItem } from './types';

// An animal is stocked, not placed.
//
// Reported from playing it: "Placing lions in the Lion Enclosure is a step I thought we were going
// to remove." It had been removed - three times, in three places. The On the park menu does not
// appear over an animal; `structureChosen` says in as many words that an animal is "stocked, not
// placed"; the Lives in control says "an animal has no place of its own on the park". The one
// line that never heard was the one that puts a thing in your hands, which excluded a path and
// nothing else - so picking a lion's card handed you a lion with exactly one thing it could ever
// say, "an animal lives in a habitat - drop it on one", about the habitat already named on its
// own card.
//
// So the rule is written down once now, and both readers read it.

const inHand = (category: 'exhibit' | 'enclosure'): { state: ZooGameState; item: BacklogItem } => {
  const base = initialZooState(3);
  const found = base.backlog.find((it) => it.category === category)!;
  const item = { ...found, status: 'committed' as const, started: true, sprintNumber: 1,
    draftDesign: { ...presetFor(found), parts: { ...presetFor(found).parts, structure: found.template ?? found.id } },
  } as BacklogItem;
  return {
    state: { ...base, phase: 'sprint', dayStage: 'building', dayNumber: 1, sprintNumber: 1,
      committedIds: [item.id],
      backlog: base.backlog.map((it) => (it.id === item.id ? item : it)) } as ZooGameState,
    item,
  };
};

const shell = (state: ZooGameState, item: BacklogItem) => render(
  <MemoryRouter>
    <ZooShell state={state} building={item.id} onSetClockPaused={() => {}}
      edit={{ onDesign: () => {}, onSetEnclosure: () => {}, onAddInside: () => {} }}>
      <div>the board</div>
    </ZooShell>
  </MemoryRouter>,
);

/** The park only takes focus when something is waiting to be put down on it. */
const parkTakesFocus = (container: HTMLElement) =>
  container.querySelector('[data-part="park-plan"]')!.hasAttribute('tabindex');

describe('what you are handed to put down', () => {
  it('hands you a habitat, which does have a spot of its own', () => {
    // The control: without this the test below passes on a park that never hands you anything.
    const { state, item } = inHand('enclosure');
    const { container } = shell(state, item);
    expect(parkTakesFocus(container), 'nothing was put in your hands at all').toBe(true);
    fireEvent.focus(container.querySelector('[data-part="park-plan"]')!);
    expect(container.querySelector('[data-part="ghost"]'), 'no ghost showed where it would land').toBeTruthy();
  });

  it('does not hand you the lion', () => {
    const { state, item } = inHand('exhibit');
    expect(item.enclosureId, 'this lion has no habitat, so the test proves nothing').toBeTruthy();
    const { container } = shell(state, item);
    expect(parkTakesFocus(container), 'the lion was put in your hands to drop somewhere').toBe(false);
  });
});

describe('the rule itself', () => {
  it('says a habitat is put down and an animal is not', () => {
    const base = initialZooState(3);
    const of = (c: string) => base.backlog.find((it) => it.category === c)!;
    expect(putDownByHand(of('enclosure'))).toBe(true);
    expect(putDownByHand(of('amenity'))).toBe(true);
    expect(putDownByHand(of('exhibit')), 'an animal is carried to a spot').toBe(false);
    expect(putDownByHand(of('path')), 'a path is dropped rather than drawn').toBe(false);
  });

  it('is the same rule the On the park menu is offered by', () => {
    // The two used to disagree: no menu over a lion, and a lion under the cursor anyway.
    const base = initialZooState(3);
    for (const it of base.backlog) {
      expect(groupsFor(it).some((g) => g.id === 'park'), `${it.name} (${it.category})`)
        .toBe(putDownByHand(it));
    }
  });
});
