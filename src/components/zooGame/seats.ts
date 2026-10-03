import { colors } from '@/theme/colors';

// ============= What each accountability wears =============
//
// One language across the board, the game and the course material: `docs/scrum-board/
// COURSE-AND-BOARD.md` sets it out, and the point of it is that a learner meets the same colours
// on the diagram, in the game and on a lesson card.
//
//   Priya          Product Owner   orange
//   Sam            Scrum Master    plum
//   Ada, Ben, Cara Developers      a teal stack, lightest at the front
//   Visitors       Stakeholders    coral
//
// They were scattered before: the Product Owner happened to be right, the Scrum Master was Tailwind's
// sky-600 in nine places, and the Developers were a six-colour rainbow that started with an orange
// almost exactly the Product Owner's. Two accountabilities in near enough the same colour is the
// one thing a board teaching WHO DOES WHAT must not do.
//
// The Product Owner's orange is the brand's, so it comes from the token package - that is what
// `brandColoursComeFromTokens.test.ts` is for, and a rebrand should move the Product Owner with it.
// Plum, teal and coral are the board's own language rather than the brand's, and are written here.

/** Several people in one role are a stack, told apart by shade - the board's rule 3. Front first. */
export const DEV_STACK = ['#0E8C8C', '#0A6D6D', '#095454'] as const;

export const SEAT = {
  productOwner: {
    /** For an SVG fill, a canvas, an avatar - somewhere that needs a value rather than a class. */
    hex: colors.orange,
    chip: 'bg-primary text-primary-foreground',
    soft: 'bg-primary/15 text-primary',
    text: 'text-primary',
  },
  scrumMaster: {
    hex: '#7B2D7B',
    chip: 'bg-[#7B2D7B] text-white',
    soft: 'bg-[#7B2D7B]/15 text-[#7B2D7B] dark:text-[#C79BC7]',
    text: 'text-[#7B2D7B] dark:text-[#C79BC7]',
  },
  developers: {
    hex: DEV_STACK[0],
    /** The Developers AS A ROLE - a legend, a heading, a key. For a PERSON use `devChip(i)`:
     *  three people in one flat colour is the thing this file exists to stop, and reaching for
     *  this by mistake has now caused it three times. */
    groupChip: 'bg-[#0E8C8C] text-white',
    soft: 'bg-[#0E8C8C]/15 text-[#0E8C8C] dark:text-[#5CC8C8]',
    text: 'text-[#0E8C8C] dark:text-[#5CC8C8]',
  },
  stakeholders: {
    hex: '#F07A2E',
    chip: 'bg-[#F07A2E] text-white',
    soft: 'bg-[#F07A2E]/15 text-[#F07A2E]',
    text: 'text-[#F07A2E]',
  },
} as const;

/** Which of the stack this Developer is. Position, not identity: the front one is the lightest, and
 *  a fourth Developer starts round again rather than inventing a colour the board does not have. */
export const devShade = (i: number) => DEV_STACK[Math.max(0, i) % DEV_STACK.length];

/** One Developer's badge. A style rather than a class: the shade depends on which of them this is,
 *  and a class name has to exist before it can be used.
 *
 *  For a badge standing for the Developers as a GROUP - a seat band, a legend - use
 *  `SEAT.developers.groupChip` instead. The stack tells people apart, not roles. */
export const devChip = (i: number) => ({ backgroundColor: devShade(i), color: '#fff' });
