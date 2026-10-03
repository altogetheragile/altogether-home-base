import { describe, it, expect } from 'vitest';
import { BOARD_ICONS } from './boardIcons';
import { SEAT } from '../seats';
import {
  PERSON_BOX, PERSON_HEAD, PERSON_BODY, PERSON_LABEL, PERSON_SHIFT,
} from './personShape';

// `Person` is a second drawing of a shape the board already draws, and this repo's notes record
// nine occasions when two drawings of one thing disagreed. It exists anyway because the board pack
// ships finished icons rather than the parts they are made of, and the game needs one Developer at
// a time where the board only has the stack of three.
//
// So the two are tied together here. The board's three people are taken apart and each one has to
// be `Person`'s shape, in its own colour, with its own two letters. Re-import a board where the
// head moved or the shoulders changed and this fails, naming what moved.

/** The board's three people, and what each of them should be wearing. */
const PEOPLE = [
  ['product_owner', SEAT.productOwner.hex, 'PO'],
  ['scrum_master', SEAT.scrumMaster.hex, 'SM'],
  ['stakeholder', SEAT.stakeholders.hex, 'SH'],
] as const;

describe("the game's person is the board's person", () => {
  it('finds all three of them on the board', () => {
    for (const [id] of PEOPLE) expect(BOARD_ICONS[id], `the board has no ${id}`).toBeTruthy();
  });

  it('draws them in the same box', () => {
    for (const [id] of PEOPLE) {
      expect(BOARD_ICONS[id].box, `${id} is drawn in a different box`).toBe(PERSON_BOX);
    }
  });

  it('gives them the same head and the same shoulders', () => {
    for (const [id] of PEOPLE) {
      const inner = BOARD_ICONS[id].inner;
      expect(inner, `${id}'s head is not where Person puts it`)
        .toContain(`cx="${PERSON_HEAD.cx}" cy="${PERSON_HEAD.cy}" r="${PERSON_HEAD.r}"`);
      expect(inner, `${id}'s shoulders are not Person's shoulders`).toContain(`d="${PERSON_BODY}"`);
      expect(inner, `${id} is not nudged up inside its box the way Person is`)
        .toContain(`transform="${PERSON_SHIFT}"`);
    }
  });

  it('writes the label in the same place, at the same size', () => {
    for (const [id] of PEOPLE) {
      expect(BOARD_ICONS[id].inner, `${id}'s label has moved or changed size`).toContain(
        `x="${PERSON_LABEL.x}" y="${PERSON_LABEL.y}" text-anchor="middle" `
        + `font-size="${PERSON_LABEL.fontSize}" font-weight="${PERSON_LABEL.fontWeight}"`);
    }
  });

  it('wears the colour and the letters the game says that accountability wears', () => {
    // The point of the one visual language: the Scrum Master is plum on the diagram and plum in the
    // game because both read it off `seats.ts`. The Product Owner's orange is the brand's, so the
    // board carries it as the token rather than as a hex.
    for (const [id, hex, letters] of PEOPLE) {
      const inner = BOARD_ICONS[id].inner;
      const wears = id === 'product_owner' ? 'hsl(var(--aa-orange-hsl))' : hex;
      expect(inner, `${id} is not drawn in ${wears}`).toContain(`fill="${wears}"`);
      expect(inner, `${id} does not say ${letters}`).toContain(`>${letters}</text>`);
    }
  });

  it('shades a Developer out of the same stack the board stacks', () => {
    // There is no single Developer on the board, so the one thing to check is that the stack the
    // game shades people from is the stack the board drew.
    const stack = BOARD_ICONS.developers.inner;
    for (const hex of ['#0E8C8C', '#0A6D6D', '#095454']) {
      expect(stack, `the board's Developers do not include ${hex}`).toContain(`fill="${hex}"`);
    }
    expect(stack, "the board's Developers are not Person's shape").toContain(`d="${PERSON_BODY}"`);
  });
});
