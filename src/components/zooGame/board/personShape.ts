// The shape the board draws a person in.
//
// The board has a Product Owner, a Scrum Master and a Stakeholder, and they are one shape in three
// colours with three different labels on the body - head, shoulders, two letters. The game drew its
// own instead: a flat coloured circle with the initials in it, in four places.
//
// So a learner met the board's people on the diagram ten minutes before meeting the game's people
// on the seat band, and they were not the same picture of the same thing. The tabs already wear the
// board (`theTabsWearTheBoard`), and so does the Definition of Done on the build strip.
//
// The board has no single Developer - it has the stack of three, because the board is about the
// accountability and a stack is how it says "more than one of these". The game lists Ada, Ben and
// Cara by name, so it needs one of them at a time, which is this: the board's person in that
// Developer's shade of the stack.
//
// The geometry is here ONCE and the board is checked against it. There is no way to generate a
// single person out of the board pack - the pack has the finished icons, not the parts they are
// made of - so this is a second copy of a shape, which is the thing this repo has been bitten by
// nine times. `personIsTheBoards.test.ts` is the answer to that: it takes the board's own three
// people apart and insists they are this shape, in their own colour, with their own label. Change
// the board's person and the test says so.

/** The box the board draws a person in. */
export const PERSON_BOX = '-12.0 -14.8 24.0 29.5';
/** The head. */
export const PERSON_HEAD = { cx: '0', cy: '-4.5', r: '6' };
/** Head and shoulders. */
export const PERSON_BODY = 'M-10 15 V10 Q-10 1 0 1 Q10 1 10 10 V15 Z';
/** Where the two letters sit on the body, and how big they are. */
export const PERSON_LABEL = { x: '0', y: '12', fontSize: '6', fontWeight: '800' };
/** The whole figure is nudged up inside its box. */
export const PERSON_SHIFT = 'translate(0 -2.25)';

/** A person's box is taller than it is wide, so asking for a width settles the height. Used where
 *  the size is a number rather than a class - an avatar that several screens ask for at 16, 18 and
 *  24 across. */
export const personSize = (width: number) => ({ width, height: Math.round(width * 29.5 / 24) });

/** White or ink, whichever reads on this colour. White on the Product Owner's orange was 2.2:1; the
 *  board's ink on it is 7.5. Worked out from the colour rather than listed, so a new shade cannot
 *  bring the problem back. */
export function labelOn(hex: string): string {
  const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const lum = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  const INK = '#2b1d14';
  // Contrast with white is 1.05 / (lum + 0.05); with the ink (luminance about 0.014) it is
  // (lum + 0.05) / 0.064. Take whichever is higher.
  return 1.05 / (lum + 0.05) >= (lum + 0.05) / 0.064 ? '#fff' : INK;
}
