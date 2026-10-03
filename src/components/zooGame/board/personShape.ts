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
