import type { ComponentType, ReactNode } from 'react';
import { Check } from 'lucide-react';
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
 *  The frame is the state, and nothing else says it: no lock, no greying, no chip saying the same
 *  thing again (docs/ZOO_GAME_FLOW.md, One Card, Three Sizes). A card that is not Ready yet is a
 *  dashed outline you can still read - it used to be greyed and locked as well, so the item a
 *  newcomer most needed to read was the one drawn as though it did not matter.
 *
 *  The accent belongs to the work in hand. To Do is a plain card, Doing wears the accent, and what
 *  is Done says so in green. */
const STATE_STYLE: Record<PbiState, { shell: string; icon: string }> = {
  backlog: { shell: 'border-border bg-card hover:border-primary/60 hover:bg-primary/5', icon: 'text-muted-foreground' },
  locked: { shell: 'border-dashed border-muted-foreground/50 bg-card', icon: 'text-muted-foreground' },
  forecast: { shell: 'border-border bg-card hover:border-primary/50', icon: 'text-muted-foreground' },
  doing: { shell: 'border-primary bg-primary/5 shadow-sm', icon: 'text-primary' },
  built: { shell: 'border-sky-300/80 bg-card', icon: 'text-sky-700 dark:text-sky-400' },
  live: { shell: 'border-emerald-600/70 bg-emerald-50/60 dark:bg-emerald-950/20', icon: 'text-emerald-700 dark:text-emerald-300' },
};

export function PbiCardShell({
  icon: Icon, name, points, typeLine, stack = false, state = 'backlog', density = 'row', lead, trailing, badges, detail, note, onClick, label, className,
}: {
  icon: ComponentType<{ className?: string }>;
  name: string;
  /** Its size in points, or null while nobody has sized it ("?"). Drawn first, in a circle, in
   *  the same place on every card - the way a card game puts the cost in a corner, so a player
   *  learns where to look once. */
  points: number | null;
  /** What kind of thing it is and where it belongs, under the name: "Habitat · Big Cats". Said here
   *  once, rather than as chips beside the name. */
  typeLine?: ReactNode;
  /** An item with others inside it - an epic. Drawn as a stack of cards, because that is what it is. */
  stack?: boolean;
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
  const type = typeLine && (
    <span data-part="type-line" className={cn('flex min-w-0 items-center gap-1 truncate text-[11px] font-medium text-muted-foreground', line && 'shrink')}>
      <Icon className={cn('h-3 w-3 shrink-0', s.icon)} />
      <span className="truncate">{typeLine}</span>
    </span>
  );
  return (
    <div
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? label : undefined}
      onClick={onClick}
      // Hooks for a theme to draw on: the zoo inks its cards (index.css, `.zoo-theme .pbi-card`).
      data-pbi-state={state}
      data-stack={stack || undefined}
      className={cn('pbi-card', RADIUS.panel, 'border text-sm transition-colors', s.shell,
        card ? 'p-2' : 'px-2 py-1.5', onClick && 'cursor-pointer', className)}>
      {line ? (
        // One row, everything on it. Twenty-three items on a screen beats four items and a scroll:
        // the Product Owner's order is the thing being read, and you cannot read an order a page
        // at a time.
        <div className="flex h-[1.75rem] items-center gap-1.5">
          {lead}
          <Cost points={points} state={state} size="sm" />
          {!typeLine && <Icon className={cn('h-4 w-4 shrink-0', s.icon)} />}
          <span title={name} className="min-w-0 shrink-0 basis-auto truncate font-medium leading-tight">{name}</span>
          <span className="flex min-w-0 flex-1 items-center">{type}</span>
          {badges}
          {trailing}
        </div>
      ) : (
        // The name gets a line of its own, the width of the card, with what it is under it. A
        // board column is a third of half a screen, and a name sharing its line with chips and a
        // button was a stub - "Big Cats...".
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {lead}
            <Cost points={points} state={state} size={card ? 'lg' : 'md'} />
            {!typeLine && <Icon className={cn('h-4 w-4 shrink-0', s.icon)} />}
            <div className="flex min-w-0 flex-1 flex-col">
              <span title={name} className="truncate font-medium leading-tight">{name}</span>
              {type}
            </div>
            {trailing && !badges && <span className="ml-auto flex shrink-0 items-center gap-1.5">{trailing}</span>}
          </div>
          {badges && (
            // Wraps: with chips and a button in a third of half a screen there is not always room
            // for all of them, and a button that runs out over the next column reads as broken.
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              {badges}
              {trailing && <span className="ml-auto flex shrink-0 items-center gap-1.5">{trailing}</span>}
            </div>
          )}
        </div>
      )}
      {note && <div className={cn(TONE.attention.text, "mt-1 pl-6 text-[11px] font-medium")}>{note}</div>}
      {detail}
    </div>
  );
}

/** Its size in points, in a circle at the front of the card: a dashed "?" while the Developers
 *  have not sized it, and a tick once it is Done, because by then its size is history. */
export function Cost({ points, state, size }: { points: number | null; state: PbiState; size: 'sm' | 'md' | 'lg' }) {
  const unsized = points === null;
  const done = state === 'live';
  return (
    <span data-part="points" data-unsized={unsized || undefined}
      className={cn('flex shrink-0 items-center justify-center rounded-full border-2 font-mono font-bold leading-none',
        size === 'sm' ? 'h-6 w-6 text-[11px]' : size === 'md' ? 'h-7 w-7 text-xs' : 'h-8 w-8 text-sm',
        done ? 'border-emerald-600 bg-emerald-600 text-white'
          : unsized ? 'border-dashed border-muted-foreground/60 bg-background text-muted-foreground'
          : 'border-foreground/80 bg-background text-foreground')}
      title={done ? 'Done' : unsized ? 'Not sized yet - the Developers size it in refinement' : `${points} point${points === 1 ? '' : 's'}`}>
      {done ? <Check className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} /> : unsized ? '?' : points}
    </span>
  );
}
