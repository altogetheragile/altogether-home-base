import { useState } from 'react';
import type { BacklogItem } from './types';
import { PbiCard, CategoryChip } from './PbiCard';
import { Chip } from './ui/Chip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Lock, Plus, X, Scissors, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FOCUS } from './ui/tokens';

/** One Backlog item, as a card you pick up.
 *
 *  The same card wherever work is chosen - forecasting at Sprint Planning, or pulling something in
 *  mid-Sprint - so choosing work looks and behaves the same everywhere. A ready item adds itself
 *  with a tap; an item that is not ready wears a padlock and, when you press it, says what would
 *  make it ready and offers the fix.
 */
export function PickCard({ item, chosen, why, note, onPick, onFix, readOnly, arriving }: {
  item: BacklogItem;
  /** Just moved into the Sprint. The card slides in and holds a ring for a moment, because a
   *  seat played by the game pulls work while you are reading something else, and an item that
   *  is simply there when you look back tells you nothing about what happened. */
  arriving?: boolean;
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
  const [reading, setReading] = useState(false);
  // What kind of thing it is, on the card you choose from. Choosing work you have not read is
  // guessing, and "Bridge" alone does not tell you it is infrastructure rather than scenery.
  const card = <PbiCard item={item} state={why ? 'locked' : chosen ? 'forecast' : 'backlog'}
    badges={<><Chip>{item.zone}</Chip><CategoryChip item={item} /></>} />;

  // Reading before choosing, in a takeover. It used to be a popover hanging off the card, which is
  // the same fault the Backlog had: something small opens somewhere else on the screen and you do
  // not notice it. Every other detail view in the game takes the screen, so this one does too.
  const takeover = (
    <Dialog open={reading} onOpenChange={setReading}>
      <DialogContent data-part="pick-takeover" className="max-w-[min(96vw,720px)]">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold leading-tight">{item.name}</DialogTitle>
              <div className="mt-1 flex flex-wrap items-center gap-1.5"><Chip>{item.zone}</Chip><CategoryChip item={item} /></div>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-sm font-semibold">{item.unsized ? '?' : `${item.estimate} pts`}</span>
          </div>
          {item.story && <p className="text-sm italic leading-snug text-muted-foreground">{item.story}</p>}
          {why && (
            <div className="space-y-1 rounded-lg border border-amber-300/70 bg-amber-50/60 p-3 dark:bg-amber-950/20">
              <div className="flex items-center gap-1.5 text-sm font-semibold"><Lock className="h-3.5 w-3.5" /> Not ready</div>
              <p className="text-xs text-muted-foreground">{why}</p>
              {item.category === 'epic' && (
                // The model reserves "not Scrum" labelling for practices the game uses anyway, and
                // an epic is one of them: the Guide has one kind of thing on a Product Backlog.
                <p className="text-[11px] text-muted-foreground/70">
                  &ldquo;Epic&rdquo; is a common word for an item too big to finish in a Sprint. The Scrum Guide does not define it -
                  it has Product Backlog items, and says a ready one can be Done inside a Sprint.
                </p>
              )}
              {note && <p className="text-[11px] text-muted-foreground/70">{note}</p>}
            </div>
          )}
          {item.acceptance?.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Acceptance criteria <span className="font-normal normal-case tracking-normal">the Product Owner&rsquo;s</span></div>
              <ul className="space-y-1">
                {item.acceptance.map((a) => (
                  <li key={a} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />{a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {why && onFix && (
            <Button className="w-full" onClick={() => { setReading(false); onFix(); }}>
              {item.category === 'epic' ? <><Scissors className="mr-1.5 h-4 w-4" /> Split it</> : <><Wand2 className="mr-1.5 h-4 w-4" /> Estimate it</>}
            </Button>
          )}
          {!readOnly && !why && (
            <Button className="w-full" onClick={() => { setReading(false); onPick(); }}>
              {chosen ? <><X className="mr-1.5 h-4 w-4" /> Take it back out</> : <><Plus className="mr-1.5 h-4 w-4" /> Add to the Sprint</>}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className={cn('flex items-stretch gap-1', arriving && 'zoo-arriving')}>
      <button type="button" onClick={() => setReading(true)} className={cn(FOCUS, 'min-w-0 flex-1 text-left')}>{card}</button>
      {takeover}
      {!readOnly && !why && (
        <button type="button" onClick={onPick} aria-label={chosen ? `Take ${item.name} out of the Sprint` : `Add ${item.name} to the Sprint`}
          title={chosen ? 'Take it out of the Sprint' : 'Add it to the Sprint'}
          className={cn(FOCUS, 'flex w-9 shrink-0 items-center justify-center rounded-lg border-2 transition-colors',
            chosen ? 'border-border text-muted-foreground hover:border-destructive/60 hover:text-destructive'
              : 'border-primary/40 text-primary hover:bg-primary/10')}>
          {chosen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
