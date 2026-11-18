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

/** The shades the board's Developers icon is built from - three figures offset up and to the right,
 *  told apart by shade only, the front one lightest. The board's rule 3.
 *
 *  That rule is about a STACK: several people compressed into one figure, where shade is the only
 *  thing left to say there is more than one of them. It is not about a list of people. Where the
 *  game lists Ada, Ben and Cara by name, their names tell them apart and three teals say nothing a
 *  reader needs - "A, B, C on dev's is not needed and they should be the same colours, not
 *  different shades."
 *
 *  So this is the board's artwork, checked against the board's artwork, and nothing draws a person
 *  from it. A person who is a Developer is `SEAT.developers.hex`, like every other Developer. */
export const DEV_STACK = ['#0E8C8C', '#0A6D6D', '#095454'] as const;

export const SEAT = {
  productOwner: {
    /** For an SVG fill, a canvas, an avatar - somewhere that needs a value rather than a class. */
    hex: colors.orange,
    // Her orange, said as hers: inside the game `primary` is blue, the next thing to do.
    // The chip's letters in ink and her words in a darker orange (18 Nov 2026): white on her orange
    // was 2.2:1 and the orange as text on the paper 2.1:1, the lowest text in the game. The figure,
    // the chip and the fill keep the brand orange; only words drawn IN her colour take the shade.
    chip: 'bg-[hsl(var(--zoo-po))] text-[hsl(var(--zoo-ink))]',
    soft: 'bg-[hsl(var(--zoo-po)/0.15)] text-[#A84500]',
    text: 'text-[#A84500]',
    /** Her colour as words: 5.7:1 on the paper. */
    ink: '#A84500',
  },
  scrumMaster: {
    hex: '#7B2D7B',
    chip: 'bg-[#7B2D7B] text-white',
    soft: 'bg-[#7B2D7B]/15 text-[#7B2D7B] dark:text-[#C79BC7]',
    text: 'text-[#7B2D7B] dark:text-[#C79BC7]',
    ink: '#7B2D7B',
  },
  developers: {
    /** Every Developer, as a person and as a role. There was a time when a person took their own
     *  shade of the stack and this was only for the role; the shades said nothing beside a name,
     *  so they went, and the two are one colour again. */
    hex: DEV_STACK[0],
    // A deeper teal under white text and as text (18 Nov 2026): the figure's teal measured 4.1:1
    // with white and 3.9 on the paper, just short at the sizes these are.
    groupChip: 'bg-[#0A6E6E] text-white',
    soft: 'bg-[#0E8C8C]/15 text-[#0A6E6E] dark:text-[#5CC8C8]',
    text: 'text-[#0A6E6E] dark:text-[#5CC8C8]',
    /** The Developers' colour as words, or under white words: 5.8:1 on the paper, 6.1 with white. */
    ink: '#0A6E6E',
  },
  stakeholders: {
    hex: '#F07A2E',
    chip: 'bg-[#F07A2E] text-[hsl(var(--zoo-ink))]',
    soft: 'bg-[#F07A2E]/15 text-[#B3460F]',
    text: 'text-[#B3460F]',
    ink: '#B3460F',
  },
} as const;

// `devShade(i)` and `devChip(i)` used to live here - one shade of the stack per Developer, so that
// Ada, Ben and Cara were never drawn as one person. Four screens called them. They are gone, and
// nothing replaced them: a Developer is `SEAT.developers.hex`, and what tells them apart is their
// name, which is written next to every one of them.
