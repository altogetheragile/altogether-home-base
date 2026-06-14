import { Link } from 'react-router-dom';
import { useKnowledgeBase } from '@/lib/knowledgeBase';
import { colors as p } from '@/theme/colors';
import type { PatternResult, QAPair } from '@/types/pattern';

interface PatternResultViewProps {
  /** Optional only to tolerate a malformed saved artifact; the guard handles it. */
  result?: PatternResult;
  /** Shown as context when viewing a saved pattern (omitted in the live builder). */
  scenario?: string;
  /** Clarifying Q&A captured during triage, shown when present. */
  qa?: QAPair[];
}

/**
 * Read-only render of a Pattern Builder result (diagnosis, recommended flow,
 * cautions). Shared by the builder page and the saved 'pattern' project artifact.
 */
export function PatternResultView({ result, scenario, qa }: PatternResultViewProps) {
  const kb = useKnowledgeBase();
  if (!result) {
    return <p className="text-sm" style={{ color: p.muted }}>This pattern has no content.</p>;
  }

  return (
    <div className="space-y-6">
      {scenario && (
        <section>
          <h2 className="text-lg font-bold mb-1" style={{ color: p.deepTeal }}>Scenario</h2>
          <p className="text-sm leading-relaxed" style={{ color: p.body }}>{scenario}</p>
        </section>
      )}

      {qa && qa.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-1" style={{ color: p.deepTeal }}>Clarifying Questions</h2>
          <dl className="space-y-2">
            {qa.map((a, i) => (
              <div key={i}>
                <dt className="text-sm font-semibold" style={{ color: p.body }}>{a.question}</dt>
                <dd className="text-sm" style={{ color: p.muted }}>{a.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {result.diagnosis && (
        <section>
          <h2 className="text-lg font-bold mb-1" style={{ color: p.deepTeal }}>Diagnosis</h2>
          <p className="text-sm leading-relaxed" style={{ color: p.body }}>{result.diagnosis}</p>
          {result.primaryHorizon && (
            <p className="text-xs mt-1" style={{ color: p.muted }}>Primary horizon: {result.primaryHorizon}</p>
          )}
        </section>
      )}

      {result.assessment?.reviewed && (
        <p className="text-xs" style={{ color: p.muted }}>
          ✓ Self-reviewed{result.assessment.revised ? ' and refined after a red-team pass' : ''}.
        </p>
      )}

      {result.empty || !result.steps?.length ? (
        <p className="text-sm" style={{ color: p.muted }}>
          No clear pattern emerged for that scenario.
        </p>
      ) : (
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: p.deepTeal }}>Recommended Flow</h2>
          <ol className="space-y-3">
            {result.steps.map((s) => {
              const artifact = kb.getArtifact(s.artifactId);
              return (
                <li key={s.order} className="rounded-xl p-4" style={{ background: p.white, border: `1px solid ${p.paleTeal}` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: p.deepTeal, color: p.white }}>
                      {s.order}
                    </span>
                    {artifact ? (
                      <Link to={`/knowledge-base/artifacts/${s.artifactId}`} className="font-semibold hover:underline" style={{ color: p.deepTeal }}>
                        {artifact.name}
                      </Link>
                    ) : (
                      <span className="font-semibold" style={{ color: p.deepTeal }}>{s.artifactId}</span>
                    )}
                    {artifact && (artifact.horizon || artifact.isa) && (
                      <span className="text-[11px]" style={{ color: p.muted }}>
                        {[artifact.horizon, artifact.isa].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>
                  {s.rationale && <p className="text-sm mb-2" style={{ color: p.body }}>{s.rationale}</p>}
                  {s.techniqueIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {s.techniqueIds.map((tid) => {
                        const t = kb.getTechnique(tid);
                        return (
                          <Link
                            key={tid}
                            to={`/knowledge-base/techniques/${tid}`}
                            className="rounded-full px-2.5 py-0.5 text-xs font-semibold hover:underline"
                            style={{ background: p.skyTeal, color: p.deepTeal, border: `1px solid ${p.paleTeal}` }}
                          >
                            {t?.name || tid}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {result.cautions?.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: p.deepTeal }}>Cautions</h2>
          <ul className="list-disc pl-5 space-y-1">
            {result.cautions.map((c, i) => (
              <li key={i} className="text-sm" style={{ color: p.body }}>{c}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
