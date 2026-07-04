import { useMemo, useState } from 'react';
import {
  Sprout, Package, TrendingUp, ListChecks,
  Kanban, RotateCw, CalendarClock, SlidersHorizontal,
  Activity, Info, ChevronRight, Check, CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// "Choose your pathway" - new-project setup. Two axes (context + delivery
// method) curate the recommended tools and their order. Recommend, do not gate:
// every step is changeable later, and Skip is always available.
// Implemented from the Claude Design mockup "Pathways Picker.dc.html".

type ContextKey = 'new_business' | 'new_product' | 'improve' | 'backlog';
type MethodKey = 'kanban' | 'scrum' | 'agilepm' | 'none';

export interface PathwayStep {
  name: string;
  recommended: boolean;
}

export interface PathwaySelection {
  context: ContextKey;
  method: MethodKey;
  steps: PathwayStep[];
}

interface PathwaysPickerProps {
  onStart?: (selection: PathwaySelection) => void;
  onSkip?: () => void;
}

const CONTEXTS: { key: ContextKey; title: string; desc: string; Icon: LucideIcon }[] = [
  { key: 'new_business', title: 'New Business', desc: 'Validate a brand-new venture or offering.', Icon: Sprout },
  { key: 'new_product', title: 'New Product', desc: 'Build a new product for an existing business.', Icon: Package },
  { key: 'improve', title: 'Improve an Existing Product', desc: 'Enhance something already in market.', Icon: TrendingUp },
  { key: 'backlog', title: 'Just Manage a Backlog', desc: 'Organise and prioritise existing work.', Icon: ListChecks },
];

const METHODS: { key: MethodKey; title: string; cadence: string; tags: string[]; Icon: LucideIcon }[] = [
  { key: 'kanban', title: 'Kanban', cadence: 'Continuous flow', tags: ['Continuous flow', 'WSJF'], Icon: Kanban },
  { key: 'scrum', title: 'Scrum', cadence: 'Sprints', tags: ['Sprints', 'Ordered backlog'], Icon: RotateCw },
  { key: 'agilepm', title: 'AgilePM', cadence: 'Sprints', tags: ['Sprints', 'MoSCoW'], Icon: CalendarClock },
  { key: 'none', title: 'No framework', cadence: 'Ad hoc', tags: ['Flexible', 'Simple priority'], Icon: SlidersHorizontal },
];

const CONTEXT_TITLES: Record<ContextKey, string> = Object.fromEntries(
  CONTEXTS.map((c) => [c.key, c.title]),
) as Record<ContextKey, string>;
const METHOD_TITLES: Record<MethodKey, string> = Object.fromEntries(
  METHODS.map((m) => [m.key, m.title]),
) as Record<MethodKey, string>;

const CONTEXT_BASES: Record<ContextKey, string[]> = {
  new_business: ['Product Vision', 'Personas', 'Impact Map', 'Backlog'],
  new_product: ['Product Vision', 'Personas', 'Story Map', 'Backlog'],
  improve: ['Personas', 'Impact Map', 'Backlog'],
  backlog: ['Backlog'],
};

const METHOD_PRIO: Record<MethodKey, string> = {
  kanban: 'Prioritise · WSJF',
  scrum: 'Sprint Backlog',
  agilepm: 'Sprint · MoSCoW',
  none: 'Prioritise',
};

function buildPathway(context: ContextKey | null, method: MethodKey | null): PathwayStep[] {
  if (!context) return [];
  const steps: PathwayStep[] = CONTEXT_BASES[context].map((name) => ({ name, recommended: true }));
  steps.push(
    method ? { name: METHOD_PRIO[method], recommended: true } : { name: 'Prioritise', recommended: false },
  );
  steps.push({ name: 'Simulate', recommended: true });
  steps.push({ name: 'Metrics', recommended: false });
  steps.push({ name: 'Outcomes review', recommended: false });
  return steps;
}

/** A selectable option card shared by both axes. */
function OptionCard({
  selected, onClick, Icon, title, children,
}: {
  selected: boolean;
  onClick: () => void;
  Icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'relative flex flex-col items-start rounded-[14px] bg-card p-5 text-left transition-all',
        'border-2',
        selected
          ? 'border-primary -translate-y-0.5 shadow-lg ring-2 ring-primary/20'
          : 'border-border shadow-sm hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md',
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}
      <Icon className={cn('mb-3 h-6 w-6', selected ? 'text-primary' : 'text-muted-foreground')} strokeWidth={1.6} />
      <span className="text-base font-semibold">{title}</span>
      {children}
    </button>
  );
}

export function PathwaysPicker({ onStart, onSkip }: PathwaysPickerProps) {
  const [context, setContext] = useState<ContextKey | null>(null);
  const [method, setMethod] = useState<MethodKey | null>(null);
  const [started, setStarted] = useState(false);

  const bothChosen = !!context && !!method;
  const steps = useMemo(() => buildPathway(context, method), [context, method]);

  const pickContext = (k: ContextKey) => { setContext(k); setStarted(false); };
  const pickMethod = (k: MethodKey) => { setMethod(k); setStarted(false); };
  const start = () => {
    if (context && method) {
      setStarted(true);
      onStart?.({ context, method, steps });
    }
  };
  const skip = () => { setContext(null); setMethod(null); setStarted(false); onSkip?.(); };

  const selectionHint = !context && !method
    ? 'Select a context and a method to continue.'
    : context && !method
      ? 'Now choose how your team delivers.'
      : !context && method
        ? "Now choose what you're working on."
        : 'Ready when you are.';

  return (
    <div className="min-h-dvh w-full bg-gradient-to-b from-muted/40 to-muted/70">
      <div className="mx-auto max-w-[1120px] px-6 py-14">

        {/* Header */}
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              New project setup
            </div>
            <h1 className="text-[34px] font-bold leading-[1.1] tracking-tight">Choose your pathway</h1>
            <p className="mt-2.5 max-w-[560px] text-[15px] leading-relaxed text-muted-foreground">
              We'll recommend the tools you need and the order to use them. Nothing is locked, every step can be changed later.
            </p>
          </div>
          {bothChosen && (
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-[7px] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-sm font-semibold">
                {CONTEXT_TITLES[context!]} · {METHOD_TITLES[method!]}
              </span>
            </div>
          )}
        </div>

        {/* Axis 1: Context */}
        <section className="mb-9">
          <div className="mb-4 flex items-baseline gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
            <h2 className="text-lg font-semibold">What are you doing?</h2>
            <span className="text-sm text-muted-foreground">Pick one</span>
          </div>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(215px,1fr))]">
            {CONTEXTS.map((c) => (
              <OptionCard key={c.key} selected={context === c.key} onClick={() => pickContext(c.key)} Icon={c.Icon} title={c.title}>
                <span className="mt-1 text-sm leading-snug text-muted-foreground">{c.desc}</span>
              </OptionCard>
            ))}
          </div>
        </section>

        {/* Axis 2: Method */}
        <section className="mb-9">
          <div className="mb-4 flex items-baseline gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
            <h2 className="text-lg font-semibold">How does your team deliver?</h2>
            <span className="text-sm text-muted-foreground">Pick one</span>
          </div>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(215px,1fr))]">
            {METHODS.map((m) => (
              <OptionCard key={m.key} selected={method === m.key} onClick={() => pickMethod(m.key)} Icon={m.Icon} title={m.title}>
                <span className="mb-3 mt-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {m.cadence}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {m.tags.map((t) => (
                    <span key={t} className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </OptionCard>
            ))}
          </div>
        </section>

        {/* Your pathway summary */}
        <section className="rounded-[18px] border border-border bg-card p-[26px] shadow-[0_4px_20px_-12px_hsl(0_0%_0%/0.2)]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Your pathway</h2>
              <p className="mt-1 text-sm text-muted-foreground">The tools we'll set up, in order.</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-primary" />Recommended</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border border-dashed border-muted-foreground/60" />Optional</span>
            </div>
          </div>

          {context ? (
            <div>
              <div className="flex flex-wrap items-center gap-y-3">
                {steps.map((step, i) => (
                  <span key={step.name} className="flex items-center">
                    {i > 0 && <ChevronRight className="mx-1.5 h-4 w-4 text-muted-foreground/40" />}
                    <span
                      className={cn(
                        'inline-flex items-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm',
                        step.recommended
                          ? 'bg-primary font-semibold text-primary-foreground shadow-sm'
                          : 'border border-dashed border-muted-foreground/50 font-medium text-muted-foreground',
                      )}
                    >
                      {step.name}
                    </span>
                  </span>
                ))}
              </div>
              {context && !method && (
                <div className="mt-4 flex items-center gap-2 rounded-[10px] border border-amber-400/60 bg-amber-50 px-3 py-[9px] text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  <Info className="h-4 w-4" />
                  Pick a delivery method to tailor prioritisation and cadence.
                </div>
              )}
              <p className="mt-4 text-sm text-muted-foreground">
                Recommended for your context. You can add, remove, or reorder later.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-border px-5 py-10 text-center">
              <Activity className="mb-3 h-[30px] w-[30px] text-muted-foreground/50" strokeWidth={1.5} />
              <p className="text-sm font-semibold">Pick a context to preview your pathway</p>
              <p className="mt-1 text-sm text-muted-foreground">We'll assemble the recommended tools and their order.</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3.5 border-t border-border pt-6">
            {started ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Project started with your pathway.
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">{selectionHint}</span>
            )}
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" onClick={skip}>Skip, I'll pick tools as I go</Button>
              <Button size="lg" disabled={!bothChosen} onClick={start}>Start project</Button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default PathwaysPicker;
