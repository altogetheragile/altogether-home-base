import { useState, type ReactNode } from 'react';
import { RotateCw } from 'lucide-react';
import type { BacklogItem } from './types';
import { Cost } from '@/components/pbi/PbiCardShell';
import { ICONS, iconKey } from './itemIcons';
import { typeLine } from './itemKinds';
import { cn } from '@/lib/utils';
import { FOCUS } from './ui/tokens';

// ============= The item you picked, as a card with two sides =============
//
// The open size of the one card (docs/ZOO_GAME_FLOW.md, One Card, Three Sizes). The front is what
// the item is: its cost, its name, what kind of thing it is and, where it has one, who it is for.
// The back is its acceptance criteria - the Confirmation of Card, Conversation, Confirmation - and
// you turn the card over to read them, the way you would a card on a table.
//
// Headed "Acceptance criteria", never "Done when": a list under "Done when" reads as the
// Definition of Done, which is a different thing that applies to every item and is not on any card.
//
// Both sides take the room of the bigger one, so the card never changes size as it turns. They sit
// in one grid cell, and the side you are not looking at keeps its space without being shown;
// `visibility: hidden` also takes it out of the tab order and away from a screen reader.

export function OpenCard({ item, front, ready = true, className }: {
  item: BacklogItem;
  /** Not Ready is a dashed frame here as it is on every smaller card: the frame is the state. */
  ready?: boolean;
  /** More on the front, under what the item is: a choice made about it here, a reason it is not Ready. */
  front?: ReactNode;
  className?: string;
}) {
  const [over, setOver] = useState(false);
  const Icon = ICONS[iconKey(item)];
  const criteria = (item.acceptance ?? []).filter((a) => a.trim());
  const turn = (to: boolean, label: string) => (
    <button type="button" data-part="turn-card" onClick={() => setOver(to)}
      className={cn(FOCUS, 'mt-auto flex items-center gap-1.5 self-start rounded-md border-2 border-[hsl(var(--zoo-ink))] bg-background px-2.5 py-1.5 text-xs font-semibold hover:bg-muted')}>
      <RotateCw className="h-3.5 w-3.5" /> {label}
    </button>
  );
  const side = 'flex min-w-0 flex-col gap-2.5 [grid-area:1/1]';
  return (
    <div data-part="open-card" data-side={over ? 'back' : 'front'}
      className={cn('grid rounded-xl border-2 p-3 transition-colors',
        ready ? 'border-[hsl(var(--zoo-ink))] shadow-[4px_4px_0_hsl(var(--zoo-ink))]' : 'border-dashed border-muted-foreground/60',
        over ? 'bg-amber-50/70 dark:bg-amber-950/20' : 'bg-card', className)}>
      <div data-part="card-front" aria-hidden={over || undefined} className={cn(side, over && 'invisible')}>
        <div className="flex items-center gap-2.5">
          <Cost points={item.unsized ? null : item.estimate} state="backlog" size="lg" />
          <div className="min-w-0">
            <div className="truncate text-base font-bold leading-tight">{item.name}</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Icon className="h-3 w-3 shrink-0" /> {typeLine(item)}
            </div>
          </div>
        </div>
        {item.story && <p className="text-sm leading-snug">{item.story}</p>}
        {front}
        {criteria.length > 0 && turn(true, 'Turn over: acceptance criteria')}
      </div>
      {criteria.length > 0 && (
        <div data-part="card-back" aria-hidden={!over || undefined} className={cn(side, !over && 'invisible')}>
          <div>
            <div className="text-base font-bold leading-tight">Acceptance criteria</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{item.name}</div>
          </div>
          <p className="text-xs leading-snug text-muted-foreground">
            What the Product Owner checks for this item. The Definition of Done covers every item, so it is not on the card.
          </p>
          <ul className="space-y-1">
            {criteria.map((a) => (
              <li key={a} className="flex items-start gap-2 text-sm leading-snug">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/60" />{a}
              </li>
            ))}
          </ul>
          {turn(false, 'Turn back')}
        </div>
      )}
    </div>
  );
}
