import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ParkOptions } from './ParkOptions';
import { openGroup } from './openGroup';
import { structuresFor, picksAStructure } from './toolboxItems';
import { chooseStructure, structureChosen } from './engine';
import { initialZooState } from './config';
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
    expect(picksAStructure('enclosure')).toBe(true);
    expect(picksAStructure('amenity')).toBe(true);
    // A path is drawn, not placed, and an animal goes into a habitat rather than onto the park.
    expect(picksAStructure('path')).toBe(false);
    expect(picksAStructure('exhibit')).toBe(false);
  });
});

describe('until they have chosen', () => {
  it('nothing has been chosen on a habitat that has just been started', () => {
    const s = seeded();
    expect(structureChosen(pen(s)), 'the game had already decided what to build').toBe(false);
  });

  it('says so on the strip, as the first thing there is to do', () => {
    const s = seeded();
    const { container } = render(
      <ParkOptions state={building(s, pen(s))} item={pen(s)} inside={null}
        api={{ onDesign: () => {}, onSetEnclosure: () => {} }} />,
    );
    const first = container.querySelector('[data-part^="group-"]')!;
    expect(first.getAttribute('data-part'), 'the strip opens on something other than the first decision')
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
    const panel = openGroup('structure');
    const tank = panel.querySelector('[data-part="structure-tank"]') as HTMLButtonElement;
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

  it('refuses a kind this item cannot be', () => {
    const s = seeded();
    const before = building(s, pen(s));
    expect(chooseStructure(before, pen(s).id, 'kiosk'), 'a habitat was built as a kiosk').toBe(before);
  });
});
