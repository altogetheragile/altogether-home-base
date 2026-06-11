import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Plus, Circle } from 'lucide-react';
import { STAGES, PIPELINE, PipelineStage, toolByViewerCase } from '@/config/pipeline';

const TEAL = '#004D4D';
const ORANGE = '#FF9715';
const CASCADE_DOWN: PipelineStage[] = ['intent', 'scope', 'approach'];

interface ArtifactLike {
  id: string;
  artifact_type: string;
  name?: string | null;
}

const liveToolsForStage = (stage: PipelineStage) =>
  PIPELINE.filter((t) => t.status === 'live' && t.stages[0] === stage);

/**
 * The project's own journey: the six ISA-O3 stages, each showing this project's
 * artifacts that belong to the stage, with a "start" affordance to add one. An
 * artifact's stage is the primary stage of the tool that produces its type.
 */
export function ProjectJourney({ artifacts, projectId }: { artifacts: ArtifactLike[]; projectId: string }) {
  const stageOf = (type: string): PipelineStage | undefined => toolByViewerCase(type)?.stages[0];

  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold" style={{ color: TEAL }}>This initiative's journey</h2>
        <p className="text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><ArrowDown className="h-3 w-3" style={{ color: ORANGE }} /> intent down</span>
          <span className="mx-2">·</span>
          <span className="inline-flex items-center gap-1"><ArrowUp className="h-3 w-3" style={{ color: TEAL }} /> learning up</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {STAGES.map((stage) => {
          const down = CASCADE_DOWN.includes(stage.id);
          const accent = down ? ORANGE : TEAL;
          const here = artifacts.filter((a) => stageOf(a.artifact_type) === stage.id);
          const tools = liveToolsForStage(stage.id);
          return (
            <div key={stage.id} className="flex flex-col rounded-lg border border-border bg-card p-3" style={{ borderTopWidth: 3, borderTopColor: accent }}>
              <h3 className="text-sm font-bold" style={{ color: accent }}>{stage.label}</h3>
              <div className="mt-2 flex flex-1 flex-col gap-1">
                {here.length === 0 && <span className="text-xs italic text-muted-foreground">Nothing here yet</span>}
                {here.map((a) => (
                  <Link key={a.id} to={`/projects/${projectId}/artifacts/${a.id}`} className="inline-flex items-center gap-1 text-xs hover:underline">
                    <Circle className="h-2 w-2 fill-current" style={{ color: accent }} />
                    <span className="truncate">{a.name || a.artifact_type}</span>
                  </Link>
                ))}
              </div>
              {tools.length > 0 && (
                <div className="mt-2 border-t border-border pt-2">
                  {tools.map((t) => (
                    <Link key={t.key} to={`${t.route}?projectId=${projectId}`} className="inline-flex items-center gap-1 text-[11px] font-medium hover:underline" style={{ color: TEAL }}>
                      <Plus className="h-3 w-3" /> {t.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
