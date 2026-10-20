import type { ComponentType, ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RADIUS, TONE } from '@/components/zooGame/ui/tokens';

// ============= One card for a Product Backlog item, wherever it is shown =============
//
// The zoo game drew this card first (see its PbiCard for why there is only one). The backlog tool
// draws the same card now, because a learner's Product Backlog becomes the zoo's, and an item that
// changes appearance at that moment says these are two different things (docs/ZOO_PO_ROUTE.md,
// One Item, One Look). The shell knows nothing about either: it takes an icon, a name, a size and
// a state, and the caller fills the slots. The two share a look, never a store.

/** Where an item is in its journey. Drives the card's treatment, and nothing else does. */
export type PbiState =
  | 'backlog'   // waiting in the Product Backlog, ready to be chosen
  | 'locked'    // in the Product Backlog but not ready - it cannot be forecast yet
  | 'forecast'  // pulled into this Sprint
  | 'doing'     // being built
  | 'built'     // built, waiting to be placed and released
  | 'live';     // released to visitors

/** How a card looks in each state.
 *
 *  The accent belongs to the work in hand, and to nothing else. Three To Do cards outlined in
 *  orange shout at you from a column you are not working in - and then the one card you ARE working
 *  on has nothing left to be. So To Do is a white card with a rule, Doing wears the accent, and
 *  what is Done says so in green on white rather than being washed in it. */
const STATE_STYLE: Record<PbiState, { shell: string; icon: string }> = {
  backlog: { shell: 'border-border bg-card hover:border-primary/60 hover:bg-primary/5', icon: 'text-muted-foreground' },
  locked: { shell: 'border-dashed border-border bg-muted/20 text-muted-foreground', icon: 'text-muted-foreground/60' },
  forecast: { shell: 'border-border bg-card hover:border-primary/50', icon: 'text-muted-foreground' },
  doing: { shell: 'border-primary bg-primary/5 shadow-sm', icon: 'text-primary' },
  built: { shell: 'border-sky-300/80 bg-card', icon: 'text-sky-700 dark:text-sky-400' },
  live: { shell: 'border-emerald-300/80 bg-card', icon: 'text-emerald-700 dark:text-emerald-300' },
};

export function PbiCardShell({
  icon: Icon, name, points, state = 'backlog', density = 'row', lead, trailing, badges, detail, note, onClick, label, className,
}: {
  icon: ComponentType<{ className?: string }>;
  name: string;
  /** Its size in points, or null while nobody has sized it ("?"). */
  points: number | null;
  state?: PbiState;
  /** `row` for lists, `card` for board columns. The difference is how much breathing room it gets,
   *  never how the item itself is drawn. */
  /** `line` is one 44px row - icon, name, type, ready, points - for a list you want to read 23 of
   *  at once. `row` gives the name its own line; `card` is the roomiest, for board columns. */
  density?: 'line' | 'row' | 'card';
  /** Before the icon: re-order handles, a star, an expand toggle. */
  lead?: ReactNode;
  /** Hard right: the action this card offers here. */
  trailing?: ReactNode;
  /** Extra chips beside the points. */
  badges?: ReactNode;
  /** Anything shown under the card's own line - a plan, acceptance criteria, an editor. */
  detail?: ReactNode;
  /** One quiet line under the name, e.g. why this cannot start yet. */
  note?: ReactNode;
  onClick?: () => void;
  label?: string;
  className?: string;
}) {
  const s = STATE_STYLE[state];
  const card = density === 'card';
  const line = density === 'line';
  return (
    <div
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? label : undefined}
      onClick={onClick}
      className={cn(RADIUS.panel, 'border text-sm transition-colors', s.shell,
        card ? 'p-2' : line ? 'px-2 py-1.5' : 'px-2 py-1.5', onClick && 'cursor-pointer', className)}>
      {/* A board column is a third of half a screen. Everything on one line meant the name wrapped
          to two and pushed the chips onto a third, so four cards no longer fitted a column that
          holds four; sharing the line with the button left the name a stub - "Big Cats...".
          So: the NAME gets a line of its own, the width of the whole card, and the chips and the
          action share the one below it. Two tidy lines, and the name is legible in both. */}
      {line ? (
        // One row, everything on it. Twenty-three items on a screen beats four items and a scroll:
        // the Product Owner's order is the thing being read, and you cannot read an order a page
        // at a time.
        <div className="flex h-[1.75rem] items-center gap-1.5">
          {lead}
          <Icon className={cn('h-4 w-4 shrink-0', s.icon)} />
          <span title={name} className="min-w-0 flex-1 truncate font-medium leading-tight">{name}</span>
          {badges}
          <Points points={points} />
          {state === 'locked' && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />}
          {trailing}
        </div>
      ) : card ? (
        <div className="flex items-start gap-2">
          {lead}
          <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', s.icon)} />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1">
            <span title={name} className="min-w-0 flex-1 basis-28 truncate font-medium leading-tight">{name}</span>
            {badges}
            <Points points={points} suffix />
            {state === 'locked' && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />}
          </div>
          {trailing}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            {lead}
            <Icon className={cn('h-4 w-4 shrink-0', s.icon)} />
            <span title={name} className="min-w-0 flex-1 truncate font-medium leading-tight">{name}</span>
            {state === 'locked' && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />}
          </div>
          {/* Wraps: with three chips and a button in a third of half a screen there is not always
              room for all four, and a button that runs out over the next column reads as broken. */}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {badges}
            <Points points={points} />
            {trailing && <span className="ml-auto flex shrink-0 items-center gap-1.5">{trailing}</span>}
          </div>
        </div>
      )}
      {note && <div className={cn(TONE.attention.text, "mt-1 pl-6 text-[11px] font-medium")}>{note}</div>}
      {detail}
    </div>
  );
}

/** Its size in points, or a "?" while the Developers have not sized it. */
function Points({ points, suffix = false }: { points: number | null; suffix?: boolean }) {
  const unsized = points === null;
  return (
    <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold',
      unsized ? TONE.attention.chip : 'bg-muted text-muted-foreground')}
      title={unsized ? 'Not sized yet - the Developers size it in refinement' : 'Size, in points'}>
      {unsized ? '?' : points}{suffix ? ' pts' : ''}
    </span>
  );
}

