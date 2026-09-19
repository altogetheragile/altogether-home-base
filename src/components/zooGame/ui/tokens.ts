// ============= The game's design tokens =============
//
// Built after an audit found eleven type sizes and twelve different panel recipes across the zoo
// game: `rounded-lg border-border bg-card` and `rounded-md border-border bg-card` and `bg-muted/20`
// and `/30` and `/40` were all "a quiet panel", at two radii. Every screen was re-inventing its
// shells because there was nothing to reuse.
//
// The rule that matters most is the colour one: a colour never appears except for its meaning. If
// something is amber it is asking for attention; if it is violet it is teaching. That single
// discipline does more for a consistent feel than any amount of spacing work.

/** What a colour MEANS. Never reach for a raw Tailwind colour in a zoo-game component - if the
 *  meaning you want is not here, it is probably not a meaning the game has. */
/** Every wizard button, in one colour.
 *
 *  A wizard is the game offering to write a first draft for you: suggest the tasks, word the Goal,
 *  propose the criteria. They had drifted into four different treatments - ghost here, outline
 *  there, violet on one screen - so the same offer looked like a different kind of button on every
 *  screen. One tone, everywhere, and it reads as an offer rather than the action you came for. */
export const WIZARD = 'bg-violet-600 text-white shadow-sm hover:bg-violet-700 dark:bg-violet-500 dark:text-white dark:hover:bg-violet-400';

export const TONE = {
  /** The thing to do next: primary actions, the current step. */
  action: {
    text: 'text-primary',
    soft: 'border-primary/30 bg-primary/5',
    strong: 'border-primary bg-primary/10 text-primary',
    chip: 'bg-primary/10 text-primary',
    solid: 'bg-primary',
  },
  /** Teaching: cards, the "?" panel, anything explaining Scrum itself. */
  teach: {
    text: 'text-violet-700 dark:text-violet-300',
    soft: 'border-violet-300/70 bg-violet-50/60 dark:border-violet-800/40 dark:bg-violet-950/20',
    strong: 'border-violet-400 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    chip: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
    solid: 'bg-violet-500',
  },
  /** The coach's voice: a nudge about what the screens do not say. */
  coach: {
    text: 'text-sky-900 dark:text-sky-100',
    soft: 'border-sky-300/70 bg-sky-50/70 dark:border-sky-800/40 dark:bg-sky-950/20',
    strong: 'border-sky-400 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    chip: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
    solid: 'bg-sky-500',
  },
  /** Attention: not ready, over capacity, a blocker, something waiting on you. */
  attention: {
    text: 'text-amber-700 dark:text-amber-400',
    soft: 'border-amber-300 bg-amber-50/70 dark:border-amber-800/50 dark:bg-amber-950/20',
    strong: 'border-amber-400 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    solid: 'bg-amber-500',
  },
  /** Done: met, delivered, live to visitors. */
  done: {
    text: 'text-emerald-700 dark:text-emerald-300',
    soft: 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-800/50 dark:bg-emerald-950/20',
    strong: 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    chip: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    solid: 'bg-emerald-500',
  },
  /** Reflection: the Retrospective's own voice - looking back rather than pushing forward. */
  reflect: {
    text: 'text-rose-700 dark:text-rose-300',
    soft: 'border-rose-500/25 bg-rose-500/5',
    strong: 'border-rose-400 bg-rose-500/10 text-rose-700 dark:text-rose-300',
    chip: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    solid: 'bg-rose-500',
  },
  /** Danger: removing something, a thing that has gone wrong. Kept on red rather than moved to the
   *  `destructive` variable, because that is the colour these controls already are. */
  danger: {
    text: 'text-red-600 dark:text-red-400',
    soft: 'border-red-300 bg-red-50/70 dark:border-red-900/50 dark:bg-red-950/20',
    strong: 'border-red-400 bg-red-500/10 text-red-600 dark:text-red-400',
    chip: 'bg-red-500/15 text-red-600 dark:text-red-400',
    solid: 'bg-red-500',
  },
  /** Quiet: structure, meta, anything that should recede. */
  quiet: {
    text: 'text-muted-foreground',
    soft: 'border-border bg-muted/30',
    strong: 'border-border bg-card',
    chip: 'bg-muted text-muted-foreground',
    solid: 'bg-muted-foreground',
  },
} as const;

export type Tone = keyof typeof TONE;

/** The ladder. Every step has a job; nothing sits between two of them.
 *
 *  An audit found twelve sizes in use, from 8px to 36px, two thirds of them written as arbitrary
 *  pixel values - `text-[10px]` and `text-[13px]` and `text-[11px]` - so there was no way to know
 *  which one a new screen should reach for. Twelve became these, plus two that other components
 *  already own:
 *
 *    9px   a chip                 - `Chip` owns it; do not write it by hand
 *    10px  an eyebrow             - `EYEBROW` owns it, below
 *    11px  micro     meta, labels, anything that should recede
 *    12px  small     dense UI: controls, lists, secondary prose
 *    14px  body      the default
 *    16px  lead      introduces a section
 *    18px  title     a panel's own heading
 *    30px  question  the one thing the screen is asking
 *
 *  The park's own labels are drawn smaller than this ladder goes, on purpose: they are painted onto
 *  a canvas that is scaled to fit, so they are drawing rather than chrome and are not bound by it.
 */
export const TEXT = {
  micro: 'text-[11px] leading-snug',
  small: 'text-xs',
  body: 'text-sm',
  lead: 'text-base font-semibold',
  title: 'text-lg font-semibold leading-tight',
  /** A whole screen's name, when the screen is an event rather than a panel. */
  screen: 'text-2xl font-bold leading-tight',
  /** A number the screen exists to show. Same size as a screen's name and a different job. */
  figure: 'text-2xl font-bold',
  question: 'text-3xl font-bold leading-tight tracking-tight',
  /** The two title screens, which are the only pages that get bigger on a wide window. */
  hero: 'text-3xl font-bold md:text-4xl',
} as const;

/** Three radii, tied to what a thing IS rather than how big it is. */
export const RADIUS = {
  chip: 'rounded-full',
  panel: 'rounded-lg',
  inner: 'rounded-md',
} as const;

/** How a box is drawn. One recipe each, so a screen cannot invent a ninth.
 *
 *  The audit found eight: `bg-card` at six different paddings, and `bg-muted` at three opacities -
 *  the Sprint Review used /20, /30 and /40 within eighty lines of itself. They all meant the same
 *  thing. `Panel` is the component to reach for in new work; these are what it is made of, for the
 *  places that already draw their own box.
 */
export const SURFACE = {
  /** A panel that holds its own against the page. */
  card: 'rounded-lg border border-border bg-card',
  /** A panel that recedes into it. */
  quiet: 'rounded-lg border border-border bg-muted/30',
  /** A box nested inside another box. */
  inset: 'rounded-md border border-border bg-background',
} as const;

/** Three paddings, not six. `tight` is a bar of read-outs; `roomy` is a panel of prose. */
export const PADDING = {
  tight: 'px-3 py-1.5',
  default: 'px-3 py-2.5',
  roomy: 'px-4 py-3',
} as const;

/** The focus ring, matching the one the shared Button already uses.
 *
 *  An audit found 126 hand-rolled buttons in the game and not one of them showed where the keyboard
 *  was. They are hand-rolled for good reasons - a card, a park feature, a poker card are not the
 *  same shape as a button - but a control you cannot see yourself land on is a control somebody
 *  navigating by keyboard cannot use. This is what the shared Button does, in a form the others can
 *  borrow. */
export const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/** A control you tap: 44 square, whatever the glyph inside it measures.
 *
 *  This game is taught on a tablet in a training room, and ordering a Backlog is the Product
 *  Owner's central act - it was a 12px chevron, then a 36px box, and 36 is still under a fingertip.
 *  The glyph stays small; the target it sits in is one you can hit. Two of these side by side or
 *  stacked never overlap, which an invisible halo around a small button would. */
export const TAP = 'h-11 w-11 shrink-0';

/** The eyebrow above a question: small, bold, spaced, in the tone of what follows. */
export const EYEBROW = 'text-[10px] font-bold uppercase tracking-[0.08em]';

/** The floating bar at the foot of a screen that has a way onward.
 *
 *  Three screens had hand-rolled the same class string and it was a pill: one row, the quiet escape
 *  on the left and the action you came for on the right. On a phone the two buttons wrapped, and a
 *  `rounded-full` box two rows tall is an oval - a big soft blob sitting over the text behind it,
 *  which is how a careful screen ends up looking broken on the device most people meet it on.
 *
 *  So it stacks on a phone and is a pill from the small breakpoint up. The buttons go full width
 *  when stacked, which is the difference between "two rows because it ran out of room" and "two
 *  rows because that is the shape". Reading order is kept: the quiet one first, the action last,
 *  so it is the same order down a phone as it is across a desktop - and the action is the one
 *  nearest the thumb. */
export const ACTION_BAR = 'sticky bottom-4 z-20 flex flex-col gap-2 rounded-2xl border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:rounded-full';

/** ...and what every button inside one wears, so a stacked bar is not a ragged column. */
export const BAR_ACTION = 'w-full justify-center sm:w-auto';

/** The line a tab row sits on, and the outline a tab is drawn with.
 *
 *  In the PRIMARY, by the rule at the top of this file: a colour never appears except for its
 *  meaning, and `action` is "the thing to do next, the current step". An active tab is exactly
 *  that - the one of three you are looking at - so it is the one colour in the game that already
 *  means what a tab is saying. It was a dark slate, which is legible and means nothing.
 *
 *  ONE value, because the whole illusion is that the active tab is a piece of the panel below it
 *  standing up: its outline and the row's rule have to be the same line, in the same colour, at the
 *  same weight, or the join reads as two lines that nearly meet.
 *
 *  It was `border-border` at 2px - the same hairline every quiet panel in the game wears - and the
 *  report was the obvious one: "can the tab outline be thicker and darker, it is still too subtle".
 *  A tab is not a quiet panel. It is the control that says which of three things you are looking
 *  at, and it should be legible across a room, because in a classroom it is. */
export const TAB_EDGE = 'border-primary';
/** The row itself: tabs sit ON the line, so the active one can break it.
 *
 *  It SCROLLS rather than squashing. Three tabs need about 440px and a phone has 390, so the row
 *  was letting them shrink: "Product Backlog" and "Sprint Backlog" wrapped to two lines inside
 *  their own outlines while "Increment" stayed one, leaving three tabs at two different heights.
 *  That has been true of the game's row since it was drawn as tabs - a thicker outline only made it
 *  twelve pixels worse - and it is the same fault the way-in row had, so it is fixed in the one
 *  place both of them read from. */
export const TAB_ROW = `flex items-end gap-1 overflow-x-auto border-b-[3px] ${TAB_EDGE}`
  + ' [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
