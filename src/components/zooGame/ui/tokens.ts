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

/** The eyebrow above a question: small, bold, spaced, in the tone of what follows. */
export const EYEBROW = 'text-[10px] font-bold uppercase tracking-[0.08em]';
