import { useState } from 'react';
import { Check, CornerDownRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { STAGES, type PipelineStage } from '@/config/pipeline';
import { cn } from '@/lib/utils';

// Project Journey - design preview of the two shells (rail vs tabs) from the
// Claude Design mockup "Project Journey.dc.html", so we can decide which to ship
// before wiring it to real project data in ProjectJourney.
//
// Stage labels and questions are pulled from src/config/pipeline.ts (the
// canonical ISA-O3 source), which corrects the mockup's drifted Scope/Outputs
// wording. Tool placements are corrected too: Retrospective sits in Operate
// (not Outcomes), and the non-existent "Story Map" is replaced with the real
// User Story Canvas. Tool statuses/counts are sample data for a hypothetical
// "New Product / Scrum" project.

type ToolStatus = 'done' | 'in_progress' | 'not_started' | 'planned';
type StageStatus = 'done' | 'in_progress' | 'not_started';

interface JourneyTool {
  name: string;
  status: ToolStatus;
  count?: string;
  derivedFrom?: string;
}
interface StageData {
  status: StageStatus;
  recommended?: boolean;
  tools: JourneyTool[];
}

const SAMPLE: Record<PipelineStage, StageData> = {
  intent: {
    status: 'done',
    tools: [
      { name: 'Product Vision', status: 'done' },
      { name: 'Impact Map', status: 'done', count: 'Impact Maps: 2', derivedFrom: 'Product Vision' },
    ],
  },
  scope: {
    status: 'done',
    tools: [
      { name: 'Persona Studio', status: 'done', count: 'Personas: 3', derivedFrom: 'Product Vision' },
      { name: 'User Story Canvas', status: 'done', derivedFrom: 'Personas' },
    ],
  },
  approach: {
    status: 'in_progress',
    recommended: true,
    tools: [
      { name: 'Product Backlog', status: 'in_progress', count: 'Backlogs: 2', derivedFrom: 'User Story Canvas' },
      { name: 'Prioritisation · Ordered', status: 'in_progress', derivedFrom: 'Product Backlog' },
    ],
  },
  operate: {
    status: 'not_started',
    tools: [
      { name: 'Sprint Simulator', status: 'planned', derivedFrom: 'Product Backlog' },
      { name: 'Retro Coach and Ways of Working', status: 'not_started' },
    ],
  },
  outputs: {
    status: 'not_started',
    tools: [
      { name: 'Sprint Simulator Results', status: 'planned', derivedFrom: 'Sprint Simulator' },
      { name: 'Probe Tracker', status: 'not_started', derivedFrom: 'Product Backlog' },
    ],
  },
  outcomes: {
    status: 'not_started',
    tools: [
      { name: 'Benefits Scorecard', status: 'not_started', derivedFrom: 'Impact Map' },
      { name: 'Outcomes review', status: 'not_started' },
    ],
  },
};

const STATUS_META: Record<ToolStatus, { label: string; badge: string; dot: string }> = {
  done: { label: 'Done', badge: 'bg-primary text-primary-foreground', dot: 'bg-primary' },
  in_progress: { label: 'In progress', badge: 'bg-blue-600 text-white', dot: 'bg-blue-600' },
  not_started: { label: 'Not started', badge: 'bg-secondary text-muted-foreground', dot: 'bg-muted-foreground/40' },
  planned: { label: 'Planned', badge: 'border border-dashed border-muted-foreground/50 text-muted-foreground', dot: 'bg-muted-foreground/40' },
};

const doneCount = STAGES.filter((s) => SAMPLE[s.id].status === 'done').length;
const inProgressCount = STAGES.filter((s) => SAMPLE[s.id].status === 'in_progress').length;
const PROGRESS = Math.round(((doneCount + inProgressCount * 0.5) / STAGES.length) * 100);

function ToolCard({ tool }: { tool: JourneyTool }) {
  const m = STATUS_META[tool.status];
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{tool.name}</div>
          {tool.count && <div className="mt-0.5 text-xs text-muted-foreground">{tool.count}</div>}
        </div>
        <span className={cn('flex-none whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', m.badge)}>
          {m.label}
        </span>
      </div>
      {tool.derivedFrom && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <CornerDownRight className="h-3 w-3" />
          Derived from {tool.derivedFrom}
        </div>
      )}
    </div>
  );
}

function StagePanel({ stageId }: { stageId: PipelineStage }) {
  const stage = STAGES.find((s) => s.id === stageId)!;
  const data = SAMPLE[stageId];
  return (
    <>
      <div className="mb-1.5 flex items-center gap-3">
        <h2 className="text-lg font-bold">{stage.label}</h2>
        {data.recommended && <span className="text-xs font-semibold text-[hsl(var(--bmc-orange))]">Recommended next</span>}
      </div>
      <p className="mb-5 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">{stage.question}</p>
      <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
        {data.tools.map((t) => <ToolCard key={t.name} tool={t} />)}
      </div>
    </>
  );
}

export function ProjectJourneyPreview() {
  const [variant, setVariant] = useState<'rail' | 'tabs'>('rail');
  const [activeStage, setActiveStage] = useState<PipelineStage>('approach');

  return (
    <div className="min-h-dvh w-full bg-gradient-to-b from-muted/40 to-muted/70">
      <div className="mx-auto max-w-[1160px] px-6 py-10 pb-16">

        {/* Shell switcher */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Shell</span>
            <div className="inline-flex rounded-[10px] border border-border bg-muted p-[3px]">
              {(['rail', 'tabs'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariant(v)}
                  className={cn(
                    'rounded-lg px-[15px] py-[7px] text-[13px] font-semibold transition-colors',
                    variant === v ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground',
                  )}
                >
                  {v === 'rail' ? 'Variant A · Rail' : 'Variant B · Tabs'}
                </button>
              ))}
            </div>
          </div>
          <span className="text-[13px] text-muted-foreground">
            Same content, two shells. Jump to any stage, non-gated. Sample project data.
          </span>
        </div>

        {/* Shared header */}
        <div className="mb-[22px] rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Nimbus Field App</h1>
              <span className="inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-secondary px-3 py-1 text-[12.5px] font-semibold text-secondary-foreground">
                New Product · Scrum
              </span>
            </div>
            <div className="min-w-[230px] max-w-[340px] flex-1">
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Overall progress</span>
                <span className="text-[13px] font-bold text-primary">{PROGRESS}% complete</span>
              </div>
              <Progress value={PROGRESS} className="h-2.5" />
            </div>
          </div>
        </div>

        {/* Variant A: Rail */}
        {variant === 'rail' && (
          <div>
            <div className="mb-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start">
                {STAGES.map((stage, i) => {
                  const data = SAMPLE[stage.id];
                  const isDone = data.status === 'done';
                  const isActive = stage.id === activeStage;
                  const rec = !!data.recommended;
                  const prevDone = i > 0 && SAMPLE[STAGES[i - 1].id].status === 'done';
                  return (
                    <div key={stage.id} className="flex flex-1 items-start">
                      {i > 0 && (
                        <div
                          className={cn('mt-5 h-0.5 min-w-[14px] flex-1 rounded-sm', prevDone ? 'bg-primary' : 'bg-border')}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveStage(stage.id)}
                        className="flex w-24 flex-none flex-col items-center gap-2.5"
                      >
                        <span
                          className={cn(
                            'flex h-11 w-11 flex-none items-center justify-center rounded-full border-2 text-[15px] font-bold transition-all',
                            isDone && 'border-transparent bg-primary text-primary-foreground',
                            data.status === 'in_progress' && 'border-primary bg-card text-primary',
                            data.status === 'not_started' && 'border-border bg-card text-muted-foreground',
                            rec && 'ring-4 ring-[hsl(var(--bmc-orange)/0.25)]',
                            !rec && isActive && 'ring-4 ring-primary/15',
                          )}
                        >
                          {isDone ? <Check className="h-[18px] w-[18px]" strokeWidth={3} /> : i + 1}
                        </span>
                        <span
                          className={cn(
                            'max-w-24 text-center text-[13px] leading-tight',
                            isActive || rec ? 'font-bold text-foreground' : 'font-medium',
                            data.status === 'not_started' && !isActive && 'text-muted-foreground',
                          )}
                        >
                          {stage.label}
                        </span>
                        {rec && (
                          <span className="rounded-full bg-[hsl(var(--bmc-orange))] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white">
                            Next
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <StagePanel stageId={activeStage} />
            </div>
          </div>
        )}

        {/* Variant B: Tabs */}
        {variant === 'tabs' && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <Tabs defaultValue="approach">
              <div className="mb-5 overflow-x-auto pb-1">
                <TabsList>
                  {STAGES.map((stage) => {
                    const data = SAMPLE[stage.id];
                    return (
                      <TabsTrigger key={stage.id} value={stage.id}>
                        <span className="inline-flex items-center gap-1.5">
                          <span className={cn('h-2 w-2 rounded-full', STATUS_META[data.status].dot)} />
                          {stage.label}
                          {data.recommended && <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--bmc-orange))]" />}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
              {STAGES.map((stage) => (
                <TabsContent key={stage.id} value={stage.id}>
                  <StagePanel stageId={stage.id} />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

      </div>
    </div>
  );
}

export default ProjectJourneyPreview;
