import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ParkOptions } from './ParkOptions';
import { openGroup } from './openGroup';
import { structuresFor, picksAStructure, structureWord } from './toolboxItems';
import { chooseStructure, structureChosen, planSprint, startItem, setServices, buildItem, placeOnPark,
  addConnector, toggleItemTask, isSignOffTask, signOffReady, readyForDone, askToCheck, answerQuestion } from './engine';
import { applyParkChecks } from './parkChecks';
import { initialZooState } from './config';
import { presetFor, buildingTypeFor } from './design';
import type { ZooGameState, BacklogItem } from './types';

// The Developers start the work, rather than being handed it half-done.
//
// Reported from playing it: "as soon as I pick the card the studio has me placing an enclosure. I
// want to start the action myself from the toolbar. Go to structures, pick a structure, place it on
// the park, set size, set surface colour, set barrier type, add interior features, add paths."
//
// Picking the card put the thing in your hands: a ghost under the cursor, a shape already decided,
// and nothing to do but drop it. Every question after that was a setting on a thing the game had
// already chosen to build.

const seeded = (): ZooGameState => initialZooState(1) as ZooGameState;
const pen = (s: ZooGameState) => s.backlog.find((it) => it.category === 'enclosure')!;
const building = (s: ZooGameState, item: BacklogItem): ZooGameState => ({
  ...s, phase: 'sprint', sprintNumber: 1,
  backlog: s.backlog.map((it) => (it.id === item.id
    ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true } : it)),
} as ZooGameState);

describe('what the Developers choose first', () => {
  it('offers the kinds of thing, not the catalogue’s own list', () => {
    // The catalogue lists habitats by kind AND size in one row, because that is how a Product Owner
    // writes one down. A Developer asks what kind first and how big second, which is the order the
    // work happens in.
    const kinds = structuresFor('enclosure').map((k) => k.name);
    expect(kinds, 'the size is being asked in the same breath as the kind')
      .not.toEqual(expect.arrayContaining(['Small Enclosure', 'Large Enclosure']));
    expect(kinds).toEqual(expect.arrayContaining(['Paddock', 'Tank']));
  });

  it('knows which items are built by choosing something and which are not', () => {
    // Everything that gets PUT somewhere is chosen first: "the same with an animal or a plant. I
    // should have to pick from a list of fauna or flora."
    expect(picksAStructure('enclosure')).toBe(true);
    expect(picksAStructure('amenity')).toBe(true);
    expect(picksAStructure('exhibit')).toBe(true);
    expect(picksAStructure('flora')).toBe(true);
    // A path is drawn rather than placed: the run IS the choice.
    expect(picksAStructure('path')).toBe(false);
  });

  it('calls it what the thing being built would call it', () => {
    expect(structureWord('exhibit')).toBe('Species');
    expect(structureWord('flora')).toBe('Planting');
    expect(structureWord('enclosure')).toBe('Structure');
  });

  it('shelves the animals by the part of the zoo they belong to', () => {
    // A zoo has thirty-odd animals in it, and a flat list of thirty is not a list anybody reads.
    const fauna = structuresFor('exhibit');
    expect(fauna.length, 'there is barely a zoo to choose from').toBeGreaterThan(20);
    expect(new Set(fauna.map((f) => f.group)).size, 'they are all on one shelf').toBeGreaterThan(3);
    expect(fauna.map((f) => f.name)).toEqual(expect.arrayContaining(['Lion', 'Penguins']));
  });

  it('offers the things that grow, and the landscape among them', () => {
    const flora = structuresFor('flora').map((f) => f.name);
    expect(flora).toEqual(expect.arrayContaining(['Trees', 'Bushes', 'Pond', 'Bridge']));
    expect(flora, 'a pathway is drawn, not planted').not.toContain('Pathway');
  });
});

describe('until they have chosen', () => {
  it('nothing has been chosen on a habitat that has just been started', () => {
    const s = seeded();
    expect(structureChosen(pen(s)), 'the game had already decided what to build').toBe(false);
  });

  it('draws no building for a facility nobody has decided the shape of', () => {
    // A Toilets item was drawn as a toilet block from the moment it was written: the name and what
    // it offers were enough for the game to guess, so the one decision the toolbar opens with had
    // been made and drawn already. Reported from playing it: "the toilets already appears as a
    // toilet structure. It should be like any other structure - the devs decide."
    const s = seeded();
    const loo = s.backlog.find((it) => it.category === 'amenity')!;
    expect(structureChosen(loo), 'the game had already decided what to build').toBe(false);
    expect(presetFor(loo).parts.type, 'it is drawn as something before anybody chose').toBeUndefined();
    // The guess is still right and still made - it is the advice the Developers act on, and what
    // the game picks when it is playing them.
    expect(buildingTypeFor(loo.name, loo.services)).toBe('toilets');
  });

  it('answers nothing about work nobody has started', () => {
    // The park answered for everything on the Product Backlog, so a Toilets card read "3 of 3,
    // ready for Priya" while its own card said "Next: design the toilets" - it was written with
    // what it offers, and the park counted that as work done. A preset is not work, and neither is
    // a field the item was born with.
    const s = seeded();
    const loo = s.backlog.find((it) => it.category === 'amenity')!;
    const before = applyParkChecks(s).backlog.find((it) => it.id === loo.id)!;
    expect((before.acConfirmed ?? []).some(Boolean),
      'the park ticked a criterion on work nobody had started').toBe(false);
    // Once it IS being built, the park answers as it always did.
    const after = applyParkChecks(building(s, loo)).backlog.find((it) => it.id === loo.id)!;
    expect((after.acConfirmed ?? []).some(Boolean),
      'the park stopped answering for work in hand').toBe(true);
  });

  it('draws it as what they chose, once they have', () => {
    const s = seeded();
    const loo = s.backlog.find((it) => it.category === 'amenity')!;
    const after = chooseStructure(building(s, loo), loo.id, 'cafe');
    const built = after.backlog.find((it) => it.id === loo.id)!;
    expect(built.draftDesign?.parts.type, 'a toilet block, whatever they picked').toBe('cafe');
  });

  it('is the first thing on the toolbar, and lit until it is answered', () => {
    // One toolbar, in the order the work happens: what it is, then how big, then what it is
    // surfaced in, what borders it and what goes inside. A toolbar of its own floating over the
    // park was a second place to look - "why is structure not on the main toolbar?"
    const s = seeded();
    const { container } = render(
      <ParkOptions state={building(s, pen(s))} item={pen(s)} inside={null}
        api={{ onDesign: () => {}, onSetEnclosure: () => {} }} />,
    );
    const first = container.querySelector('[data-part^="group-"]')!;
    expect(first.getAttribute('data-part'), 'the toolbar opens on something other than the first decision')
      .toBe('group-structure');
    expect(first.getAttribute('data-lit'), 'the one thing that has to happen is not lit').toBe('yes');
  });

  it('offers the kinds when it is opened, and hands the choice back', () => {
    const onChooseStructure = vi.fn();
    const s = seeded();
    render(
      <ParkOptions state={building(s, pen(s))} item={pen(s)} inside={null}
        api={{ onDesign: () => {}, onSetEnclosure: () => {}, onChooseStructure }} />,
    );
    const tank = openGroup('structure').querySelector('[data-part="structure-tank"]') as HTMLButtonElement;
    expect(tank, 'a habitat could not be built as a tank').toBeTruthy();
    fireEvent.click(tank);
    expect(onChooseStructure).toHaveBeenCalledWith(pen(s).id, 'tank');
  });
});

describe('choosing one', () => {
  it('makes it the thing they chose, and only then is there something to place', () => {
    const s = seeded();
    const after = chooseStructure(building(s, pen(s)), pen(s).id, 'tank');
    const built = after.backlog.find((it) => it.id === pen(s).id)!;
    expect(structureChosen(built), 'choosing settled nothing').toBe(true);
    expect(built.template, 'a tank was chosen and the park would draw a paddock').toBe('tank');
  });

  it('leaves everything after it for the Developers, which is the point', () => {
    const s = seeded();
    const after = chooseStructure(building(s, pen(s)), pen(s).id, 'paddock');
    const built = after.backlog.find((it) => it.id === pen(s).id)!;
    // Size, surface, barrier and what goes inside are the steps after this one, in that order.
    expect(built.enclosureSize, 'choosing a paddock decided how big it is').toBeFalsy();
    expect(built.draftDesign?.parts.barrier, 'choosing a paddock decided what borders it').toBeFalsy();
    expect(built.draftDesign?.colors.ground, 'choosing a paddock decided what it is surfaced in').toBeFalsy();
  });

  it('plants a bush as a bush, in its own colours', () => {
    // The kind used to be picked on a second control that also set the piece and the default
    // colours. Picking it here has to do the same, or a bush comes out drawn as a tree.
    const s = seeded();
    const tree = s.backlog.find((it) => it.category === 'flora' && it.template === 'tree')!;
    const after = chooseStructure(building(s, tree), tree.id, 'bush');
    const built = after.backlog.find((it) => it.id === tree.id)!;
    expect(built.draftDesign?.parts.type, 'it is still a tree').toBe('bush');
    expect(built.draftDesign?.parts.piece, 'it is made of the wrong pieces').toBe('bush');
    expect(Object.keys(built.draftDesign?.colors ?? {}).length,
      'a bush in no colours at all').toBeGreaterThan(0);
  });

  it('refuses a kind this item cannot be', () => {
    const s = seeded();
    const before = building(s, pen(s));
    expect(chooseStructure(before, pen(s).id, 'kiosk'), 'a habitat was built as a kiosk').toBe(before);
  });
});

describe('nothing reaches Done without the Product Owner', () => {
  // "There was no PO check on toilets needed to move it to Done."
  //
  // The sign-off followed the acceptance criteria alone, which works while one of them is a
  // judgement: a habitat is asked whether you can walk right round it, and only a person can say.
  // A toilet block is asked three questions and the park can answer all three - so nothing was ever
  // asked of anybody, the sign-off ticked itself, and the card walked into Done without the Product
  // Owner appearing at all.
  const built = () => {
    const s0 = seeded();
    const loo = s0.backlog.find((it) => it.category === 'amenity')!;
    let s = planSprint({ ...s0, phase: 'sprint', sprintNumber: 1 } as ZooGameState, [loo.id], 0);
    s = startItem(s, loo.id, 'developer');
    s = setServices(s, loo.id, 'toilet');
    const p = presetFor(loo);
    s = buildItem(s, loo.id, { ...p, parts: { ...p.parts, type: 'toilets', structure: 'toilets', sign: 'on' },
      colors: { ...p.colors, sign: '#3f6f4f' } });
    s = placeOnPark(s, loo.id);
    s = addConnector(s, { id: 'r', itemId: loo.id, a: { x: 300, y: 1050 }, b: { x: 300, y: 700 },
      bends: [], thickness: 9, color: '#c9a86a' } as never);
    s = applyParkChecks(s);
    for (const t of s.backlog.find((x) => x.id === loo.id)!.tasks ?? []) {
      if (!t.done && !isSignOffTask(t.label)) s = toggleItemTask(s, loo.id, t.id);
    }
    return { s: applyParkChecks(s), id: loo.id };
  };

  it('meets every criterion the park can answer, and still is not signed off', () => {
    const { s, id } = built();
    const it = s.backlog.find((x) => x.id === id)!;
    expect(it.acceptance.every((_, i) => it.acConfirmed?.[i]), 'the park has not answered them').toBe(true);
    expect(signOffReady(it), 'it signed itself off').toBe(false);
    expect(readyForDone(it), 'it walked into Done on its own').toBe(false);
  });

  it('is signed off once the Product Owner has looked at it', () => {
    const { s, id } = built();
    const after = answerQuestion(askToCheck(s, id, 'developer'), `check-${id}`, 'accept', 'product_owner');
    const it = after.backlog.find((x) => x.id === id)!;
    expect(it.signedOff, 'the Product Owner accepted it and nothing recorded that').toBe(true);
    expect(readyForDone(it), 'accepted, and still not ready to move').toBe(true);
  });
});
