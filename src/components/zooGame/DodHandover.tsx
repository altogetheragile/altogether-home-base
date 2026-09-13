import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_DOD } from './config';
import { whatGotOut } from './engine';
import { EYEBROW } from './ui/tokens';
import type { ZooGameState } from './types';

// ============= The Definition of Done, handed over when it is missed =============
//
// Sprint 1 has no Definition of Done. That is the design: a game that opens by asking a learner to
// agree what Done means is asking them to write a rule for a job they have not done yet, and they
// write it out of politeness rather than out of experience. So the first Sprint ships whatever it
// ships, the Review says what the visitors made of it, and the Retrospective hands over the thing
// that would have caught it - naming what it would have caught, in this zoo, this Sprint.
//
// The Guide calls the Definition of Done the Increment's commitment. A team that has just watched
// something go out half-finished knows what that means; a team on its first screen does not.

/** What this Sprint shipped that a Definition of Done would have stopped. Read off what happened
 *  rather than from a list of morals: a lesson about THIS zoo beats a lesson about zoos. */
function whatItCost(state: ZooGameState): string[] {
  const out: string[] = [];
  const got = whatGotOut(state);
  for (const g of got) out.push(`${g.escapee} got out of the ${g.habitat.name}, and the ${g.zone} shut for the day.`);

  const led = state.lastLedger;
  if (led && led.wasted > 0) {
    out.push(`${led.wasted.toLocaleString()} of ${led.visits.toLocaleString()} visits were worth nothing to the people who made them.`);
  }
  // Work released with its own criteria unmet - the plainest case of all, and the one the gate is for.
  const shipped = state.backlog.filter((it) => it.status === 'open' && it.sprintNumber === state.sprintNumber
    && (it.acceptance ?? []).length > 0
    && (it.acceptance ?? []).some((_, i) => !(it.acConfirmed ?? [])[i]));
  for (const it of shipped.slice(0, 2)) out.push(`${it.name} was opened to visitors with its own criteria unticked.`);
  return out;
}

export function DodHandover({ state, onSetDod }: { state: ZooGameState; onSetDod: (dod: string[]) => void }) {
  if (state.definitionOfDone.length > 0) return null;
  const cost = whatItCost(state);

  return (
    <section data-part="dod-handover" className="space-y-2 rounded-lg border-2 border-primary/50 bg-primary/[0.06] px-3 py-2.5">
      <div className={cn(EYEBROW, 'flex items-center gap-1.5 text-primary')}>
        <ShieldCheck className="h-4 w-4" /> The thing this Sprint did not have
      </div>
      <p className="text-sm font-semibold">
        You shipped Sprint {state.sprintNumber} with no Definition of Done.
      </p>
      <p className="text-[12px] leading-snug text-muted-foreground">
        Nobody had agreed what finished meant, so finished meant whatever anybody said it meant. The
        Scrum Guide calls the Definition of Done the Increment&rsquo;s commitment: one bar, for every
        item, that the whole Scrum Team holds. It is worth having now rather than in Sprint 1, because
        now you know what it is for.
      </p>
      {cost.length > 0 && (
        <div className="rounded-md border border-border bg-background/70 px-2.5 py-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">What went out without one</div>
          <ul className="mt-1 space-y-0.5 text-[12px] leading-snug">
            {cost.map((c) => <li key={c}>&middot; {c}</li>)}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" data-part="adopt-dod" onClick={() => onSetDod([...DEFAULT_DOD])}>
          Adopt this Definition of Done
        </Button>
        <span className="text-[11px] text-muted-foreground">
          {DEFAULT_DOD.length} lines, and yours to change - the editor below is the same list.
        </span>
      </div>
    </section>
  );
}
