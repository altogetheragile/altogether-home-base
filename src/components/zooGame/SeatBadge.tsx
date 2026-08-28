import { Users, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SeatName } from './useZooSessions';
import { NAME, YOURS } from './seatCopy';

// Which accountability you are holding, said out loud, on every screen. The gate in
// seatRules only speaks when you reach outside your accountability, so without this a
// Product Owner doing Product Owner things is told nothing at all - and alone in a session,
// where the empty seats are permissive, nothing is refused ever. This is the other half,
// and the cheaper one: name the hat before anybody transgresses.

export function SeatBadge({ seat, phase, observer, covering = [] }: {
  seat: SeatName | null; phase: string; observer?: boolean; covering?: SeatName[];
}) {
  if (observer) {
    return (
      <span title="You hold no seat, so you act on nothing. This is how a trainer sits with a team."
        className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2 py-1 text-xs font-semibold">
        <Eye className="h-3.5 w-3.5" /> Watching
      </span>
    );
  }
  if (!seat) return null;
  const yours = YOURS[seat][phase];
  // Alone, or in a short-handed team, the empty seats' work falls to you as well - and
  // saying so is the difference between a rule and a mystery.
  const also = covering.filter((c) => c !== seat).map((c) => NAME[c]);
  return (
    <span
      title={[yours, also.length ? `Nobody is holding the ${also.join(' or ')} seat, so that work falls to you too.` : '']
        .filter(Boolean).join(' ')}
      className={cn('flex shrink-0 items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-2 py-1 text-xs font-semibold text-primary')}>
      <Users className="h-3.5 w-3.5" />
      You are the {NAME[seat]}
      {/* The empty seats you are also covering stay in the tooltip: spelling them out here
          made the chip wide enough to push the Sprint Goal field into the next control. */}
      {also.length > 0 && <span className="font-normal opacity-70">+{also.length}</span>}
    </span>
  );
}

