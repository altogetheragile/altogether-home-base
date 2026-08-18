import type { ReactNode } from 'react';
import { Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BacklogItem } from './types';
import { ICONS, iconKey } from './itemIcons';
import { Chip } from './ui/Chip';
import { RADIUS, TONE } from './ui/tokens';

// ============= One card for one Product Backlog item =============
//
// A Product Backlog item used to be drawn by six different pieces of code - two card components,
// the Backlog sidebar row, and three hand-rolled rows on Planning and the Review - each with its
// own padding, icon size and badges. It is the most repeated object in the game, so its
// inconsistency was the game's inconsistency, multiplied.
//
// It is also the thing the game is teaching. An item travelling from the Product Backlog into a
// forecast, into Doing, to Done and out to visitors IS the Scrum loop. When it changes appearance
// at every step, the learner is quietly told these are different things. One card that visibly
// picks up state says the opposite, and says it without a word of explanation.

/** Where an item is in its journey. Drives the card's treatment, and nothing else does. */
export type PbiState =
  | 'backlog'   // waiting in the Product Backlog, ready to be chosen
  | 'locked'    // in the Backlog but not ready - it cannot be forecast yet
  | 'forecast'  // pulled into this Sprint
  | 'doing'     // being built
  | 'built'     // built, waiting to be placed and released
  | 'live';     // released to visitors

const STATE_STYLE: Record<PbiState, { shell: string; icon: string }> = {
  backlog: { shell: 'border-border bg-card hover:border-primary/60 hover:bg-primary/5', icon: 'text-muted-foreground' },
  locked: { shell: 'border-dashed border-border bg-muted/20 text-muted-foreground', icon: 'text-muted-foreground/60' },
  forecast: { shell: 'border-primary bg-primary/5', icon: 'text-primary' },
  doing: { shell: 'border-amber-400/70 bg-amber-500/5', icon: 'text-amber-700 dark:text-amber-400' },
  built: { shell: 'border-sky-400/70 bg-sky-500/5', icon: 'text-sky-700 dark:text-sky-400' },
  live: { shell: 'border-emerald-400/70 bg-emerald-500/5', icon: 'text-emerald-700 dark:text-emerald-300' },
};

/** The category, as a word - what this item becomes in the park. */
const CATEGORY_LABEL: Record<string, string> = {
  epic: 'Epic', enclosure: 'Habitat', exhibit: 'Animal', amenity: 'Facility', flora: 'Planting', path: 'Path',
};

export function PbiCard({
  item, state = 'backlog', density = 'row', lead, trailing, badges, detail, note, onClick, label, className,
}: {
  item: BacklogItem;
  state?: PbiState;
  /** `row` for lists, `card` for board columns. The difference is how much breathing room it gets,
   *  never how the item itself is drawn. */
  density?: 'row' | 'card';
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
  const Icon = ICONS[iconKey(item)];
  const s = STATE_STYLE[state];
  const card = density === 'card';
  return (
    <div
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? label : undefined}
      onClick={onClick}
      className={cn(RADIUS.panel, 'border text-sm transition-colors', s.shell,
        card ? 'p-2' : 'px-2.5 py-2', onClick && 'cursor-pointer', className)}>
      <div className={cn('flex gap-2', card ? 'items-start' : 'items-center')}>
        {lead}
        <Icon className={cn('h-4 w-4 shrink-0', card && 'mt-0.5', s.icon)} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1">
          <span className={cn('min-w-0 flex-1 basis-28 break-words font-medium leading-tight', card && 'truncate')}>{item.name}</span>
          {badges}
          {state === 'live' && <Chip tone="done" icon={<Check className="h-2.5 w-2.5" />}>Live</Chip>}
          <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold',
            item.unsized ? TONE.attention.chip : 'bg-muted text-muted-foreground')}
            title={item.unsized ? 'Not sized yet - the Developers size it in refinement' : 'Size, in points'}>
            {item.unsized ? '?' : item.estimate}{card ? ' pts' : ''}
          </span>
          {state === 'locked' && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />}
        </div>
        {trailing}
      </div>
      {note && <div className="mt-1 pl-6 text-[11px] font-medium text-amber-700 dark:text-amber-300">{note}</div>}
      {detail}
    </div>
  );
}

/** The item's kind, as a chip - used where a list mixes habitats, animals and facilities. */
export function CategoryChip({ item }: { item: BacklogItem }) {
  return <Chip tone={item.category === 'epic' ? 'teach' : 'quiet'}>{CATEGORY_LABEL[item.category] ?? item.category}</Chip>;
}
