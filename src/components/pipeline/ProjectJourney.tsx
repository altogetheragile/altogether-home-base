import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Circle } from 'lucide-react';
import { STAGES, PIPELINE, PipelineStage, toolByViewerCase } from '@/config/pipeline';
import { cn } from '@/lib/utils';

interface ArtifactLike {
  id: string;
  artifact_type: string;
  name?: string | null;
}

const liveToolsForStage = (stage: PipelineStage) =>
  PIPELINE.filter((t) => t.status === 'live' && t.stages[0] === stage);

/**
 * The project's own journey: the six ISA-O3 stages as a rail. Each stage shows
 * how many of this project's artifacts belong to it (an artifact's stage is the
 * primary stage of the tool that produces its type); clicking a stage expands a
 * panel with those artifacts and the tools that can add more. Real artifacts
 * carry no explicit done/in-progress status, so a stage is "filled" when it has
 * artifacts and the first empty stage (in ISA-O3 order) is the recommended next.
 */
export function ProjectJourney({ artifacts, projectId }: { artifacts: ArtifactLike[]; projectId: string }) {
  const stageOf = (type: string): PipelineStage | undefined => toolByViewerCase(type)?.stages[0];
  const artifactsFor = (id: PipelineStage) => artifacts.filter((a) => stageOf(a.artifact_type) === id);

  const counts = Object.fromEntries(STAGES.map((s) => [s.id, artifactsFor(s.id).length])) as Record<PipelineStage, number>;
  const recommended = STAGES.find((s) => counts[s.id] === 0)?.id;
  const startedCount = STAGES.filter((s) => counts[s.id] > 0).length;

  const [active, setActive] = useState<PipelineStage>(recommended ?? STAGES[0].id);

  const activeStage = STAGES.find((s) => s.id === active)!;
  const activeArtifacts = artifactsFor(active);
  const activeTools = liveToolsForStage(active);

  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-primary">This initiative's journey</h2>
        <p className="text-xs text-muted-foreground">{startedCount} of {STAGES.length} stages started</p>
      </div>

      {/* Rail */}
      <div className="mb-3 overflow-x-auto rounded-lg border border-border bg-card p-4">
        <div className="flex min-w-[560px] items-start">
          {STAGES.map((stage, i) => {
            const has = counts[stage.id] > 0;
            const isActive = stage.id === active;
            const rec = stage.id === recommended;
            const prevHas = i > 0 && counts[STAGES[i - 1].id] > 0;
            return (
              <div key={stage.id} className="flex flex-1 items-start">
                {i > 0 && (
                  <div className={cn('mt-5 h-0.5 min-w-[10px] flex-1 rounded-sm', prevHas ? 'bg-primary' : 'bg-border')} />
                )}
                <button
                  type="button"
                  onClick={() => setActive(stage.id)}
                  className="flex w-[88px] flex-none flex-col items-center gap-2"
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 flex-none items-center justify-center rounded-full border-2 text-sm font-bold transition-all',
                      has && 'border-transparent bg-primary text-primary-foreground',
                      !has && 'bg-card text-muted-foreground',
                      !has && rec && 'border-primary text-primary',
                      !has && !rec && 'border-border',
                      isActive && 'ring-4 ring-primary/15',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={cn(
                      'max-w-[88px] text-center text-xs leading-tight',
                      isActive || rec || has ? 'font-bold text-foreground' : 'font-medium text-muted-foreground',
                    )}
                  >
                    {stage.label}
                  </span>
                  {has ? (
                    <span className="text-[10px] text-muted-foreground">{counts[stage.id]} item{counts[stage.id] === 1 ? '' : 's'}</span>
                  ) : rec ? (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">Next</span>
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded panel for the active stage */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-1 flex items-center gap-3">
          <h3 className="text-base font-bold">{activeStage.label}</h3>
          {active === recommended && <span className="text-xs font-semibold text-primary">Recommended next</span>}
        </div>
        <p className="mb-4 max-w-[640px] text-sm leading-relaxed text-muted-foreground">{activeStage.question}</p>

        {activeArtifacts.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {activeArtifacts.map((a) => (
              <Link
                key={a.id}
                to={`/projects/${projectId}/artifacts/${a.id}`}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background p-2.5 text-sm hover:border-primary/50 hover:bg-muted/50"
              >
                <Circle className="h-2 w-2 flex-none fill-current text-primary" />
                <span className="truncate">{a.name || a.artifact_type}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground">Nothing here yet.</p>
        )}

        {activeTools.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3">
            {activeTools.map((t) => (
              <Link
                key={t.key}
                to={`${t.route}?projectId=${projectId}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Plus className="h-3 w-3" /> {t.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
