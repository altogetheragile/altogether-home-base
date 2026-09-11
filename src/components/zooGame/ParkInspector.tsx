import type { ZooGameState, BacklogItem } from './types';
import { answerable, checkCriterion, checkedAt } from './parkChecks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EYEBROW, FOCUS } from './ui/tokens';
import { Check, Circle, GripVertical, X } from 'lucide-react';
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

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

  // ...and wherever it is put, it stays. Docking to the corner furthest from the selected thing is a
  // good guess and not much more than that: reported from playing it, "the ACs dialog needs to be
  // moveable too - it can get in the way when placing an object". So it can be picked up by its
  // heading and dropped anywhere on the park, and once it has been moved the guess stops applying.
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  // Closed until it is asked for. Reported from playing it: "make the ACs closed by default - they
  // are always in the way." What is left behind is not nothing: the pill carries the count, so how
  // many criteria are met is still readable at a glance, and one press has the detail. Opened, it
  // stays open - the player's choice outlasts the thing that was selected when they made it.
  const [hidden, setHidden] = useState(true);
  const box = useRef<HTMLDivElement | null>(null);
  const carry = (e: ReactPointerEvent) => {
    const panel = box.current;
    // The pane it is positioned against. `offsetParent` is the right answer and is not always an
    // answer at all - it reads null where nothing has been laid out - so the element it actually
    // sits in stands in for it.
    const pane = (panel?.offsetParent as HTMLElement | null) ?? panel?.parentElement ?? null;
    if (!panel || !pane) return;
    e.preventDefault();
    const r = panel.getBoundingClientRect(), p = pane.getBoundingClientRect();
    const grabX = e.clientX - r.left, grabY = e.clientY - r.top;
    // Kept inside the pane it belongs to: a panel dragged out of the window cannot be dragged back.
    const hold = (v: number, span: number) => (span > 0 ? Math.max(0, Math.min(span, v)) : Math.max(0, v));
    const move = (ev: PointerEvent) => setAt({
      x: hold(ev.clientX - p.left - grabX, p.width - r.width),
      y: hold(ev.clientY - p.top - grabY, p.height - r.height),
    });
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const moved = at ? { left: at.x, top: at.y, right: 'auto', bottom: 'auto' } : undefined;

  // Out of the way entirely, and a way back. Inside a habitat it is out of the way by default: in
  // there the whole picture is the pen, and the panel would be most of it.
  //
  // The same pill either way, and it is a button when it is one the player put there: something you
  // put away has to be something you can get back, or it is gone.
  if (collapsed || hidden) {
    return (
      <button type="button" data-part="park-inspector" data-collapsed="yes"
        onClick={() => setHidden(false)} disabled={collapsed && !hidden}
        className={cn('absolute z-20 rounded-full border border-border bg-background/95 px-3 py-1 text-xs font-semibold shadow-sm',
          collapsed && !hidden && 'pointer-events-none', !collapsed && FOCUS, !collapsed && 'hover:bg-background',
          !at && place, className)}
        style={moved}>
        Acceptance criteria <span className="font-normal text-muted-foreground">&middot; {done} of {criteria.length}</span>
      </button>
    );
  }

  return (
    <div ref={box} data-part="park-inspector" style={moved}
      className={cn('absolute z-20 w-[min(20rem,45%)] rounded-lg border border-border bg-background/95 p-2.5 shadow-md backdrop-blur-sm transition-opacity',
        quiet && 'pointer-events-none opacity-45', !at && place, className)}>
      <h3 data-part="inspector-grip" onPointerDown={carry}
        className="flex cursor-grab select-none items-center gap-1.5 text-sm font-bold active:cursor-grabbing">
        <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
        <span className="flex-1">Acceptance criteria <span className="font-normal text-muted-foreground">&middot; {done} of {criteria.length}</span></span>
        <button type="button" data-part="hide-inspector" aria-label="Put the acceptance criteria away"
          onPointerDown={(e) => e.stopPropagation()} onClick={() => setHidden(true)}
          className={cn(FOCUS, 'rounded p-0.5 text-muted-foreground hover:text-foreground')}>
          <X className="h-3.5 w-3.5" />
        </button>
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
