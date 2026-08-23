import { useState } from 'react';
import type { BacklogItem } from './types';
import { PbiCard, CategoryChip } from './PbiCard';
import { Chip } from './ui/Chip';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Lock, Plus, X, Scissors, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** One Backlog item, as a card you pick up.
 *
 *  The same card wherever work is chosen - forecasting at Sprint Planning, or pulling something in
 *  mid-Sprint - so choosing work looks and behaves the same everywhere. A ready item adds itself
 *  with a tap; an item that is not ready wears a padlock and, when you press it, says what would
 *  make it ready and offers the fix.
 */
export function PickCard({ item, chosen, why, note, onPick, onFix, readOnly }: {
  item: BacklogItem;
  /** Already in the Sprint: the card shows a remove affordance instead of a plus. */
  chosen?: boolean;
  /** Why it cannot be picked, or null if it can. */
  why: string | null;
  /** The caveat shown under the reason - what the fix costs, where it belongs. */
  note?: string;
  onPick: () => void;
  onFix?: () => void;
  /** Shown for context rather than to be selected - topic one and topic three, where the Backlog is
   *  what you are looking at rather than what you are choosing from. Reading it still works. */
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState(false);
  // No trailing mark on the card itself: the button beside it is the one that adds or removes, and
  // two plus signs on one row is one too many.
  // What kind of thing it is, on the card you choose from. Choosing work you have not read is
  // guessing, and "Bridge" alone does not tell you it is infrastructure rather than scenery.
  const card = <PbiCard item={item} state={why ? 'locked' : chosen ? 'forecast' : 'backlog'}
    badges={<><Chip>{item.zone}</Chip><CategoryChip item={item} /></>} />;

  // Reading before choosing. Selecting an item you have not read is guessing, and a card that pulls
  // itself into the Sprint the moment you touch it gives you nowhere to look first. The body opens
  // the item; the + takes it.
  const detail = (
    <Popover open={reading} onOpenChange={setReading}>
      <PopoverTrigger asChild><button type="button" className="min-w-0 flex-1 text-left">{card}</button></PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold leading-tight">{item.name}</h4>
            <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">{item.unsized ? '?' : `${item.estimate} pts`}</span>
          </div>
          {item.story && <p className="text-[12px] italic leading-snug text-muted-foreground">{item.story}</p>}
          {item.acceptance?.length > 0 && (
            <div className="space-y-1">
              <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Acceptance criteria <span className="font-normal normal-case tracking-normal">the Product Owner&rsquo;s</span></div>
              <ul className="space-y-0.5">
                {item.acceptance.map((a) => (
                  <li key={a} className="flex items-start gap-1.5 text-[12px] text-muted-foreground">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />{a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!readOnly && !why && (
            <Button size="sm" className="h-7 w-full px-2 text-xs" onClick={() => { setReading(false); onPick(); }}>
              {chosen ? <><X className="mr-1 h-3.5 w-3.5" /> Take it back out</> : <><Plus className="mr-1 h-3.5 w-3.5" /> Add to the Sprint</>}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  if (!why) return (
    <div className="flex items-stretch gap-1">
      {detail}
      {!readOnly && (
        <button type="button" onClick={onPick} aria-label={chosen ? `Take ${item.name} out of the Sprint` : `Add ${item.name} to the Sprint`}
          title={chosen ? 'Take it out of the Sprint' : 'Add it to the Sprint'}
          className={cn('flex w-9 shrink-0 items-center justify-center rounded-lg border-2 transition-colors',
            chosen ? 'border-border text-muted-foreground hover:border-destructive/60 hover:text-destructive'
              : 'border-primary/40 text-primary hover:bg-primary/10')}>
          {chosen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
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
