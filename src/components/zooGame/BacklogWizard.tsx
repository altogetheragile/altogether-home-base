import { useState } from 'react';
import { ZOO_AREAS } from './config';
import type { ZooBrief } from './types';
import { ExplainButton } from './Explain';
import { ActionBar } from './ActionBar';
import { StepTrack } from './StepTrack';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EYEBROW } from './ui/tokens';
import { Check, ArrowRight, Sparkles, Users, Camera, Armchair } from 'lucide-react';

// ============= Where a Product Backlog comes from =============
//
// It used to be there when you arrived, which quietly taught that a Product Backlog is a thing you
// are given. It is not. It is the Product Owner's, it is written to serve a Product Goal, and it
// starts as a handful of rough ideas about what the product might need.
//
// So the game asks three questions and writes one. The answers genuinely change what comes out -
// which areas exist, which one is refined enough to start on, and what order the list is in -
// because a wizard whose answers do not matter teaches less than no wizard at all.

const AUDIENCES: { key: ZooBrief['audience']; label: string; icon: typeof Users; blurb: string }[] = [
  { key: 'families', label: 'Families', icon: Users, blurb: 'Bright, lively, plenty to see. Somewhere to eat matters early.' },
  { key: 'enthusiasts', label: 'Enthusiasts', icon: Camera, blurb: 'Distinctive animals, well kept. They will forgive a queue for a good habitat.' },
  { key: 'comfortSeekers', label: 'Comfort seekers', icon: Armchair, blurb: 'Calm, easy going, somewhere to sit. A day out rather than a wildlife trip.' },
];

type Step = 'areas' | 'who' | 'start';
const STEPS: { key: Step; label: string; question: string; lead: string }[] = [
  { key: 'areas', label: 'Areas', question: 'What will your zoo have in it?', lead: 'Each area becomes one Product Backlog item, too big to build until you break it up.' },
  { key: 'who', label: 'Visitors', question: 'Who are you building it for?', lead: 'The Product Owner orders the Backlog by value, and value depends on who is coming.' },
  { key: 'start', label: 'First', question: 'Which area will you open first?', lead: 'That one arrives ready to build. The rest stay as areas until you refine them.' },
];

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('flex items-start gap-2 rounded-lg border-2 p-3 text-left transition-colors',
        on ? 'border-primary bg-primary/[0.07]' : 'border-border hover:border-primary/50 hover:bg-muted/40')}>
      <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full', on ? 'bg-primary text-primary-foreground' : 'border-2 border-border')}>
        {on && <Check className="h-2.5 w-2.5" />}
      </span>
      <span className="min-w-0">{children}</span>
    </button>
  );
}

/** The three questions, and the Product Backlog they produce. */
export function BacklogWizard({ productGoal, onBuild }: { productGoal: string; onBuild: (brief: ZooBrief) => void }) {
  const [step, setStep] = useState<Step>('areas');
  const [zones, setZones] = useState<string[]>(ZOO_AREAS.map((a) => a.zone));
  const [audience, setAudience] = useState<ZooBrief['audience']>('families');
  const [firstZone, setFirstZone] = useState('Big Cats');
  const current = STEPS.find((s) => s.key === step)!;

  const toggleZone = (z: string) => setZones((prev) => {
    const next = prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z];
    // The area you open first has to be an area you are having.
    if (!next.includes(firstZone) && next.length) setFirstZone(next[0]);
    return next;
  });
  // "Done" means answered and behind you - not merely "the default happens to be valid". Ticking a
  // question you have not been asked yet says the game has already decided for you.
  const answered = (k: Step) => (k === 'areas' ? zones.length > 0 : k === 'who' ? true : zones.includes(firstZone));
  const at = STEPS.findIndex((x) => x.key === step);
  const done = (k: Step) => STEPS.findIndex((x) => x.key === k) < at && answered(k);
  const canGo = answered(step);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <StepTrack steps={STEPS} current={step} done={done} onGo={setStep} caption="Writing the Product Backlog" />
          <ExplainButton title="Where a Product Backlog comes from"
            body={[
              'The Product Backlog is an emergent, ordered list of what is needed to improve the product. It is the single source of work: nothing gets built that is not on it.',
              'The Product Owner is accountable for it - for what is on it, what it says, and the order it is in. Ordering it is how value gets decided, which is why who your visitors are matters here.',
              'It starts rough. Items near the top are small and clear; items further down can stay vague, because you will learn things from building the first ones that change the rest.',
            ]} />
        </div>
        <div>
          <div className={cn(EYEBROW, 'text-primary')}>Before there is a Backlog</div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight">{current.question}</h2>
          <p className="text-sm text-muted-foreground">{current.lead}</p>
        </div>
      </header>

      {/* What all of this is in service of. */}
      <p className="rounded-lg border border-primary/30 bg-primary/[0.04] px-3 py-2 text-[12px]">
        <span className={cn(EYEBROW, 'mr-1.5 text-primary')}>Product Goal</span>
        <span className="font-medium">{productGoal}</span>
      </p>

      {step === 'areas' && (
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
      )}

      {step === 'who' && (
        <div className="grid gap-2">
          {AUDIENCES.map((a) => (
            <Choice key={a.key} on={audience === a.key} onClick={() => setAudience(a.key)}>
              <span className="flex items-center gap-1.5 text-sm font-semibold"><a.icon className="h-4 w-4 text-muted-foreground" /> {a.label}</span>
              <span className="block text-[11px] text-muted-foreground">{a.blurb}</span>
            </Choice>
          ))}
        </div>
      )}

      {step === 'start' && (
        <div className="grid gap-2 sm:grid-cols-2">
          {ZOO_AREAS.filter((a) => zones.includes(a.zone)).map((a) => (
            <Choice key={a.zone} on={firstZone === a.zone} onClick={() => setFirstZone(a.zone)}>
              <span className="block text-sm font-semibold">{a.zone}</span>
              <span className="block text-[11px] text-muted-foreground">Its first habitat, its animal, its paths and its planting - ready to forecast</span>
            </Choice>
          ))}
        </div>
      )}

      <ActionBar left={step !== 'areas' ? <Button variant="ghost" size="sm" onClick={() => setStep(step === 'start' ? 'who' : 'areas')}>&larr; Back</Button> : undefined}>
        {step === 'start' ? (
          <div className="flex items-center gap-2.5">
            <span className="hidden text-[11px] text-muted-foreground sm:inline">
              Writes {zones.length} area{zones.length === 1 ? '' : 's'} and the park&rsquo;s own grounds
            </span>
            <Button disabled={!canGo} onClick={() => onBuild({ zones, audience, firstZone })}>
              <Sparkles className="mr-1 h-4 w-4" /> Write the Product Backlog
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            {!canGo && <span className="hidden text-[11px] text-muted-foreground sm:inline">Pick at least one area</span>}
            <Button disabled={!canGo} onClick={() => setStep(step === 'areas' ? 'who' : 'start')}>
              Next <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </ActionBar>
    </div>
  );
}
