import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowRight } from 'lucide-react';
import { STAGES, PIPELINE, PipelineStage } from '@/config/pipeline';

const TEAL = '#004D4D';
const ORANGE = '#FF9715';

// The first three stages cascade intent down; the last three return learning up.
const CASCADE_DOWN: PipelineStage[] = ['intent', 'scope', 'approach'];

const liveToolsForStage = (stage: PipelineStage) =>
  PIPELINE.filter((t) => t.status === 'live' && t.stages[0] === stage);

/**
 * The Vision to Value journey: six ISA-O3 stages left to right. Intent, Scope and
 * Approach cascade down; Operate, Outputs and Outcomes return evidence up. Each
 * stage lists the live tools that serve it. Public and static for SEO; the tools
 * themselves are sign-in gated.
 */
export function JourneyBand() {
  return (
    <div className="mb-12">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold" style={{ color: TEAL }}>The idea to value journey</h2>
        <p className="text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1"><ArrowDown className="h-3.5 w-3.5" style={{ color: ORANGE }} /> intent cascades down</span>
          <span className="mx-2">·</span>
          <span className="inline-flex items-center gap-1"><ArrowUp className="h-3.5 w-3.5" style={{ color: TEAL }} /> learning returns up</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {STAGES.map((stage, idx) => {
          const down = CASCADE_DOWN.includes(stage.id);
          const accent = down ? ORANGE : TEAL;
          const tools = liveToolsForStage(stage.id);
          return (
            <div key={stage.id} className="relative flex flex-col rounded-lg border border-border bg-card p-3" style={{ borderTopWidth: 3, borderTopColor: accent }}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wide text-muted-foreground">STAGE {idx + 1}</span>
                {down ? <ArrowDown className="h-3.5 w-3.5" style={{ color: accent }} /> : <ArrowUp className="h-3.5 w-3.5" style={{ color: accent }} />}
              </div>
              <h3 className="text-sm font-bold" style={{ color: accent }}>{stage.label}</h3>
              <p className="mt-1 mb-2 text-xs text-muted-foreground">{stage.question}</p>
              <div className="mt-auto flex flex-col gap-1">
                {tools.length === 0 && <span className="text-xs italic text-muted-foreground">Coming soon</span>}
                {tools.map((t) => (
                  <Link key={t.key} to={t.route} className="inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: TEAL }}>
                    <ArrowRight className="h-3 w-3" /> {t.name}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        New here? Start with the{' '}
        <Link to="/coach" className="font-medium hover:underline" style={{ color: TEAL }}>Coaching Studio</Link>{' '}
        and let the conversation find the right tool, or pick any stage above. You can browse freely; building needs a free account.
      </p>
    </div>
  );
}
