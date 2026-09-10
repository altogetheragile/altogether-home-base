import type { ZooGameState, BacklogItem } from './types';
import { answerable, checkCriterion, checkedAt } from './parkChecks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EYEBROW, FOCUS } from './ui/tokens';
import { Check, Circle } from 'lucide-react';

// ============= The inspector =============
//
// What the selected object has to be, docked on the park itself rather than in a window over it.
// Acceptance criteria only: the Definition of Done is the product's bar, shown once at the Done gate
// and on the Increment tab, and merging the two teaches that an item's criteria and the team's
// agreement are the same thing. They are not.
//
// It docks to whichever corner is furthest from what is selected, so it never covers the thing you
// are working on - and inside a habitat it collapses to a single pill, because in there the whole
// screen is the enclosure.

export function ParkInspector({ state, item, collapsed, quiet, onAskToCheck, corner = 'tr', className }: {
  state: ZooGameState;
  item: BacklogItem;
  /** Inside a habitat: one pill, so the enclosure is not covered by its own criteria. */
  collapsed?: boolean;
  /** While a run is being drawn, the panel stops taking the pointer and thins out: it sits over a
   *  corner of the park, and a click meant for the ground under it landed on the panel instead -
   *  "cannot draw a path properly". Still readable, just not in the way. */
  quiet?: boolean;
  onAskToCheck?: (id: string) => void;
  corner?: 'tl' | 'tr' | 'bl' | 'br';
  className?: string;
}) {
  const criteria = (item.acceptance ?? []).filter(Boolean);
  const met = (label: string, i: number) =>
    !!item.acConfirmed?.[i] || (!!item.design && !!checkCriterion(state, item, label)?.met);
  const done = criteria.filter((c, i) => met(c, i)).length;
  const po = state.team.productOwner.name.replace(/\s*\(PO\)$/i, '');
  const asked = (state.questions ?? []).some((q) => q.id === `check-${item.id}`);
  // Already accepted: asking again is asking a question that has been answered. Reported from
  // playing it - "I get multiple ask Priya to check".
  const accepted = criteria.length > 0 && criteria.every((_, i) => !!item.acConfirmed?.[i])
    && (item.tasks ?? []).some((t) => /sign[- ]?off/i.test(t.label) && t.done);
  // Ready to ask means every criterion the park can answer is answered. The rest are judgement, and
  // judgement is what the asking is for.
  const facts = criteria.filter(answerable);
  const ready = criteria.length > 0 && facts.every((c) => met(c, criteria.indexOf(c)));
  const missing = facts.find((c) => !met(c, criteria.indexOf(c)));
  const outstanding = missing
    ? { text: missing, why: checkCriterion(state, item, missing)?.evidence ?? 'not yet' }
    : null;

  const place = {
    tl: 'left-2 top-2', tr: 'right-2 top-2', bl: 'left-2 bottom-2', br: 'right-2 bottom-2',
  }[corner];

  if (collapsed) {
    return (
      <div data-part="park-inspector" data-collapsed="yes"
        className={cn('pointer-events-none absolute z-20 rounded-full border border-border bg-background/95 px-3 py-1 text-xs font-semibold shadow-sm', place, className)}>
        Acceptance criteria <span className="font-normal text-muted-foreground">&middot; {done} of {criteria.length}</span>
      </div>
    );
  }

  return (
    <div data-part="park-inspector"
      className={cn('absolute z-20 w-[min(20rem,45%)] rounded-lg border border-border bg-background/95 p-2.5 shadow-md backdrop-blur-sm transition-opacity',
        quiet && 'pointer-events-none opacity-45', place, className)}>
      <h3 className="text-sm font-bold">
        Acceptance criteria <span className="font-normal text-muted-foreground">&middot; {done} of {criteria.length}</span>
      </h3>
      <ul className="mt-1.5 space-y-1.5">
        {criteria.map((c, i) => {
          const ok = met(c, i);
          const verdict = ok ? null : checkCriterion(state, item, c);
          const where = checkedAt(c);
          return (
            <li key={c} className="flex items-start gap-1.5">
              {ok ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                : <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
              <span className="min-w-0 flex-1">
                <span className={cn('block text-[12px] leading-snug', ok && 'text-muted-foreground line-through decoration-emerald-500/40')}>{c}</span>
                <span className="block text-[10px] text-muted-foreground">
                  {verdict?.evidence ?? (ok ? 'met' : answerable(c) ? 'checked once it stands on the park' : `${po} judges this one`)}
                </span>
              </span>
              <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                where === 'park' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-secondary text-secondary-foreground')}>
                {where === 'park' ? 'park' : 'here'}
              </span>
            </li>
          );
        })}
        {!criteria.length && <li className="text-[12px] text-muted-foreground">Nothing written yet. Criteria are the Product Owner&rsquo;s.</li>}
      </ul>
      <div className="mt-2 border-t border-border pt-2">
        {accepted ? (
          <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            {/* ...and once it is in Done, it says that instead of asking for a move that has been
                made. Every line here has to be true of the card as it is now. */}
            {item.status === 'committed'
              ? <>{po} accepted it &middot; move it to Done</>
              : <>Done &middot; {item.status === 'open' ? 'open to visitors' : 'not open to visitors yet'}</>}
          </p>
        ) : asked ? (
          <p className="text-[11px] text-muted-foreground">Waiting on {po} to look at it.</p>
        ) : ready && onAskToCheck ? (
          <Button size="sm" data-part="ask-to-check" className={cn(FOCUS, 'h-7 w-full px-2 text-xs')}
            onClick={() => onAskToCheck(item.id)}>Ask {po} to check</Button>
        ) : (
          <p className={cn(EYEBROW, 'font-normal normal-case tracking-normal text-[11px] text-muted-foreground')}>
            {/* Where the ask went. Choosing a family of lions takes "can I fit them in with room to
                spare" back off, and the button goes with it - which reads as the game losing the
                option rather than as the work not being finished. So it says which fact is out. */}
            {outstanding
              ? <>Not ready to ask: <span className="font-medium text-foreground">{outstanding.text}</span> &middot; {outstanding.why}</>
              : <>{po} judges the rest and signs off when you ask.</>}
          </p>
        )}
      </div>
    </div>
  );
}
