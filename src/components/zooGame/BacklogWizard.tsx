import { useState } from 'react';
import { ZOO_AREAS } from './config';
import type { ZooBrief } from './types';
import { ExplainButton } from './Explain';
import { mayTake } from './seatRules';
import type { SeatName } from './useZooSessions';
import { ActionBar } from './ActionBar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EYEBROW, FOCUS, WIZARD } from './ui/tokens';
import { Check, Sparkles, Users, Camera, Armchair } from 'lucide-react';

// ============= Where a Product Backlog comes from =============
//
// It used to be there when you arrived, which quietly taught that a Product Backlog is a thing you
// are given. It is not. It is the Product Owner's, it is written to serve a Product Goal, and it
// starts as a handful of rough ideas about what the product might need.
//
// So the game asks three questions and writes one. The answers genuinely change what comes out -
// which areas exist, which one is refined enough to start on, and what order the list is in -
// because a wizard whose answers do not matter teaches less than no wizard at all.
//
// On ONE page. They were three, with a step track and two Next presses, and each one used a fifth
// of a tall window - four tick boxes on an acre of white. Reported from playing it: "can we combine
// these three screens?" They are three parts of one decision, and a Product Owner writing a Product Backlog
// holds all three in their head at once: which areas, for whom, and which one first. Answering them
// on one page is also the honest shape of the thing - the third question is made of the first
// question's answers, and on three screens you could not see that.

const AUDIENCES: { key: ZooBrief['audience']; label: string; icon: typeof Users; blurb: string }[] = [
  { key: 'families', label: 'Families', icon: Users, blurb: 'Bright, lively, plenty to see. Somewhere to eat matters early.' },
  { key: 'enthusiasts', label: 'Enthusiasts', icon: Camera, blurb: 'Distinctive animals, well kept. They will forgive a queue for a good habitat.' },
  { key: 'comfortSeekers', label: 'Comfort seekers', icon: Armchair, blurb: 'Calm, easy going, somewhere to sit. A day out rather than a wildlife trip.' },
];

/** One question, with its own heading, its reason, and its answers. */
function Ask({ n, question, lead, children }: { n: number; question: string; lead: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{n}</span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight tracking-tight">{question}</h3>
          <p className="text-[12px] text-muted-foreground">{lead}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cn(FOCUS, 'flex items-start gap-2 rounded-lg border-2 p-3 text-left transition-colors',
        on ? 'border-primary bg-primary/[0.07]' : 'border-border hover:border-primary/50 hover:bg-muted/40')}>
      <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full', on ? 'bg-primary text-primary-foreground' : 'border-2 border-border')}>
        {on && <Check className="h-2.5 w-2.5" />}
      </span>
      <span className="min-w-0">{children}</span>
    </button>
  );
}

/** The three questions, and the Product Backlog they produce. */
export function BacklogWizard({ productGoal, onBuild, seat = null, emptySeats }: {
  productGoal: string;
  onBuild: (brief: ZooBrief) => void;
  /** Which accountability is looking. Writing the Product Backlog is the Product Owner's, so any
   *  other seat is watching it being written rather than doing it. */
  seat?: SeatName | null;
  emptySeats?: SeatName[];
}) {
  // Playing alone there are no seats at all - you are the whole Scrum Team, and the gate belongs
  // to shared games. It only has something to say when somebody is holding a seat.
  const mine = seat ? mayTake('WRITE_BACKLOG', { seat, emptySeats }) : { allowed: true, because: '' };
  const [zones, setZones] = useState<string[]>(ZOO_AREAS.map((a) => a.zone));
  const [audience, setAudience] = useState<ZooBrief['audience']>('families');
  const [firstZone, setFirstZone] = useState('Big Cats');

  const toggleZone = (z: string) => setZones((prev) => {
    const next = prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z];
    // The area you open first has to be an area you are having. On one page you can watch that
    // happen: untick the area you had chosen to open first and the choice moves, in front of you,
    // rather than the next screen quietly offering something else.
    if (!next.includes(firstZone) && next.length) setFirstZone(next[0]);
    return next;
  });
  const ready = zones.length > 0 && zones.includes(firstZone);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className={cn(EYEBROW, 'text-primary')}>Before there is a Product Backlog</div>
            <h2 className="text-3xl font-bold leading-tight tracking-tight">Writing the Product Backlog</h2>
            <p className="text-sm text-muted-foreground">
              Three questions, and the answers change what comes out - which areas exist, which one is
              ready to start on, and what order the list is in.
            </p>
          </div>
          <ExplainButton cards={['product-backlog', 'product-goal']} />
        </div>
      </header>

      {/* Whose this is, where it is not yours. A screen that offers work your seat cannot take,
          and refuses the press when you take it, is a screen you are stuck on - reported from a
          live session joined as a Developer. */}
      {!mine.allowed && (
        <p data-part="not-yours" className="rounded-lg border border-primary/40 bg-primary/[0.06] px-3 py-2 text-xs">
          <span className={cn(EYEBROW, 'mr-1.5 text-primary')}>The Product Owner&rsquo;s</span>
          <span>{mine.because} You are watching them answer it - the three answers are theirs, and the
            Backlog appears here when they write it.</span>
        </p>
      )}

      {/* What all of this is in service of. Once, at the top, rather than on every step. */}
      <p className="rounded-lg border border-primary/30 bg-primary/[0.04] px-3 py-2 text-xs">
        <span className={cn(EYEBROW, 'mr-1.5 text-primary')}>Product Goal</span>
        <span className="font-medium">{productGoal}</span>
      </p>

      <Ask n={1} question="What will your zoo have in it?"
        lead="Each area becomes one Product Backlog item, too big to build until you break it up.">
        <div className="grid gap-2 sm:grid-cols-2">
          {ZOO_AREAS.map((a) => (
            <Choice key={a.zone} on={zones.includes(a.zone)} onClick={() => toggleZone(a.zone)}>
              <span className="block text-sm font-semibold">{a.zone}</span>
              <span className="block text-[11px] text-muted-foreground">
                {a.members.filter((m) => m.kind === 'exhibit').map((m) => m.name).join(', ')}, and its own paths and planting
              </span>
            </Choice>
          ))}
        </div>
        {!zones.length && (
          <p className="text-[11px] text-amber-700 dark:text-amber-300">Pick at least one - a zoo with no areas has nothing to build.</p>
        )}
      </Ask>

      <Ask n={2} question="Who are you building it for?"
        lead="The Product Owner orders the Product Backlog by value, and value depends on who is coming.">
        <div className="grid gap-2">
          {AUDIENCES.map((a) => (
            <Choice key={a.key} on={audience === a.key} onClick={() => setAudience(a.key)}>
              <span className="flex items-center gap-1.5 text-sm font-semibold"><a.icon className="h-4 w-4 text-muted-foreground" /> {a.label}</span>
              <span className="block text-[11px] text-muted-foreground">{a.blurb}</span>
            </Choice>
          ))}
        </div>
      </Ask>

      <Ask n={3} question="Which will you open first?"
        lead="That one arrives ready to build. The rest stay as areas until you refine them.">
        <div className="grid gap-2 sm:grid-cols-2">
          {ZOO_AREAS.filter((a) => zones.includes(a.zone)).map((a) => (
            <Choice key={a.zone} on={firstZone === a.zone} onClick={() => setFirstZone(a.zone)}>
              <span className="block text-sm font-semibold">{a.zone}</span>
              <span className="block text-[11px] text-muted-foreground">Its first habitat, its animal, its paths and its planting - ready to forecast</span>
            </Choice>
          ))}
          {!zones.length && (
            <p className="text-[11px] text-muted-foreground">Whichever areas you pick above turn up here.</p>
          )}
        </div>
      </Ask>

      <ActionBar>
        <div className="flex items-center gap-2.5">
          <span className="hidden text-[11px] text-muted-foreground sm:inline">
            Writes {zones.length} area{zones.length === 1 ? '' : 's'} and the park&rsquo;s own grounds
          </span>
          <Button className={WIZARD} disabled={!ready || !mine.allowed} onClick={() => onBuild({ zones, audience, firstZone })}>
            <Sparkles className="mr-1 h-4 w-4" /> Write the Product Backlog
          </Button>
        </div>
      </ActionBar>
    </div>
  );
}
