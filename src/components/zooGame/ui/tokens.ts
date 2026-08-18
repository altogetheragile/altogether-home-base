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
  },
  /** Teaching: cards, the "?" panel, anything explaining Scrum itself. */
  teach: {
    text: 'text-violet-700 dark:text-violet-300',
    soft: 'border-violet-300/70 bg-violet-50/60 dark:border-violet-800/40 dark:bg-violet-950/20',
    strong: 'border-violet-400 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    chip: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  },
  /** The coach's voice: a nudge about what the screens do not say. */
  coach: {
    text: 'text-sky-900 dark:text-sky-100',
    soft: 'border-sky-300/70 bg-sky-50/70 dark:border-sky-800/40 dark:bg-sky-950/20',
    strong: 'border-sky-400 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    chip: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  },
  /** Attention: not ready, over capacity, a blocker, something waiting on you. */
  attention: {
    text: 'text-amber-700 dark:text-amber-400',
    soft: 'border-amber-300 bg-amber-50/70 dark:border-amber-800/50 dark:bg-amber-950/20',
    strong: 'border-amber-400 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  },
  /** Done: met, delivered, live to visitors. */
  done: {
    text: 'text-emerald-700 dark:text-emerald-300',
    soft: 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-800/50 dark:bg-emerald-950/20',
    strong: 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    chip: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
  /** Quiet: structure, meta, anything that should recede. */
  quiet: {
    text: 'text-muted-foreground',
    soft: 'border-border bg-muted/30',
    strong: 'border-border bg-card',
    chip: 'bg-muted text-muted-foreground',
  },
} as const;

export type Tone = keyof typeof TONE;

/** Four sizes, not eleven. `micro` is for chips and meta; `body` is the default; `lead` introduces
 *  a section; `question` is the one thing the screen is asking. */
export const TEXT = {
  micro: 'text-[11px] leading-snug',
  body: 'text-sm',
  lead: 'text-base font-semibold',
  question: 'text-3xl font-bold leading-tight tracking-tight',
} as const;

/** Three radii, tied to what a thing IS rather than how big it is. */
export const RADIUS = {
  chip: 'rounded-full',
  panel: 'rounded-lg',
  inner: 'rounded-md',
} as const;

/** The eyebrow above a question: small, bold, spaced, in the tone of what follows. */
export const EYEBROW = 'text-[10px] font-bold uppercase tracking-[0.08em]';
