import { useState } from 'react';
import type { BacklogItem } from './types';
import { PbiCard } from './PbiCard';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Lock, Plus, X, Scissors, Wand2 } from 'lucide-react';

/** One Backlog item, as a card you pick up.
 *
 *  The same card wherever work is chosen - forecasting at Sprint Planning, or pulling something in
 *  mid-Sprint - so choosing work looks and behaves the same everywhere. A ready item adds itself
 *  with a tap; an item that is not ready wears a padlock and, when you press it, says what would
 *  make it ready and offers the fix.
 */
export function PickCard({ item, chosen, why, note, onPick, onFix }: {
  item: BacklogItem;
  /** Already in the Sprint: the card shows a remove affordance instead of a plus. */
  chosen?: boolean;
  /** Why it cannot be picked, or null if it can. */
  why: string | null;
  /** The caveat shown under the reason - what the fix costs, where it belongs. */
  note?: string;
  onPick: () => void;
  onFix?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const card = (
    <PbiCard item={item} state={why ? 'locked' : chosen ? 'forecast' : 'backlog'}
      trailing={why ? undefined
        : chosen ? <X className="h-4 w-4 shrink-0 text-muted-foreground" />
          : <Plus className="h-4 w-4 shrink-0 text-primary" />} />
  );
  if (!why) return <button type="button" onClick={onPick} className="w-full text-left">{card}</button>;
  return (
    // Controlled, because pressing Split or Estimate opens a panel BENEATH this popover - and a
    // popover that stays put over the thing it just opened is worse than no popover at all.
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild><button type="button" className="w-full text-left">{card}</button></PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold"><Lock className="h-3.5 w-3.5" /> Not ready</div>
          <p className="text-[12px] text-muted-foreground">{why}</p>
          {item.category === 'epic' && (
            // The model reserves "not Scrum" labelling for practices the game uses anyway, and an
            // epic is one of them: the Guide has one kind of thing on a Product Backlog.
            <p className="text-[11px] text-muted-foreground/70">
              &ldquo;Epic&rdquo; is a common word for an item too big to finish in a Sprint. The Scrum Guide does not define it -
              it has Product Backlog items, and says a ready one can be Done inside a Sprint.
            </p>
          )}
          {note && <p className="text-[11px] text-muted-foreground/70">{note}</p>}
          {onFix && (
            <Button size="sm" className="h-7 w-full px-2 text-xs" onClick={() => { setOpen(false); onFix(); }}>
              {item.category === 'epic' ? <><Scissors className="mr-1 h-3.5 w-3.5" /> Split it</> : <><Wand2 className="mr-1 h-3.5 w-3.5" /> Estimate it</>}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
