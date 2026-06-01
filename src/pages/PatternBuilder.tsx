import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KnowledgeBaseLayout } from '@/components/knowledge-base/KnowledgeBaseLayout';
import { useKnowledgeBase } from '@/lib/knowledgeBase';
import { supabase } from '@/integrations/supabase/client';
import { colors as p } from '@/theme/colors';

interface PatternStep {
  order: number;
  horizon: string | null;
  isa: string | null;
  artifactId: string;
  techniqueIds: string[];
  rationale: string;
}
interface PatternResult {
  diagnosis: string;
  primaryHorizon: string | null;
  steps: PatternStep[];
  cautions: string[];
  empty?: boolean;
}

const PatternBuilder = () => {
  const kb = useKnowledgeBase();
  const [scenario, setScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PatternResult | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('recommend-pattern', {
        body: { scenario },
      });
      if (fnError) throw new Error('The adviser is unavailable right now. Please try again.');
      if (!data?.success) throw new Error(data?.error || 'Something went wrong. Please try again.');
      setResult(data.data as PatternResult);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KnowledgeBaseLayout
      title="Pattern Builder - Knowledge Base - Altogether Agile"
      description="Describe your product or project scenario and get a sequenced flow of ISA-O3 artifacts and techniques."
      canonicalPath="/knowledge-base/pattern-builder"
      crumbs={[{ label: 'Map', to: '/knowledge-base' }, { label: 'Pattern Builder' }]}
    >
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-1" style={{ color: p.deepTeal, fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 }}>
          Pattern Builder
        </h1>
        <p className="text-sm mb-4" style={{ color: p.body }}>
          Describe your product or project. The adviser suggests a sequenced flow of artifacts and
          techniques, drawn only from the framework.
        </p>

        <textarea
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          rows={5}
          placeholder="e.g. We are a scale-up launching a new payments product. Teams are busy but pulling in different directions and leadership is unclear on priorities."
          className="w-full rounded-lg p-3 text-sm outline-none mb-3"
          style={{ border: `1px solid ${p.paleTeal}`, color: p.body }}
        />
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={submit}
            disabled={loading || scenario.trim().length < 10}
            className="rounded-lg px-5 py-2.5 text-sm font-bold disabled:opacity-50"
            style={{ background: p.orange, color: p.deepTeal }}
          >
            {loading ? 'Thinking...' : 'Build Pattern'}
          </button>
          <span className="text-xs" style={{ color: p.muted }}>
            Recommends real Knowledge Base items only.
          </span>
        </div>

        {error && (
          <div className="rounded-lg p-3 mb-4 text-sm" style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {result.diagnosis && (
              <section>
                <h2 className="text-lg font-bold mb-1" style={{ color: p.deepTeal }}>Diagnosis</h2>
                <p className="text-sm leading-relaxed" style={{ color: p.body }}>{result.diagnosis}</p>
                {result.primaryHorizon && (
                  <p className="text-xs mt-1" style={{ color: p.muted }}>Primary horizon: {result.primaryHorizon}</p>
                )}
              </section>
            )}

            {result.empty || result.steps.length === 0 ? (
              <p className="text-sm" style={{ color: p.muted }}>
                No clear pattern emerged for that scenario. Try adding more detail about your goals and team setup.
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
                          {(s.horizon || s.isa) && (
                            <span className="text-[11px]" style={{ color: p.muted }}>
                              {[s.horizon, s.isa].filter(Boolean).join(' · ')}
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

            {result.cautions.length > 0 && (
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
        )}
      </div>
    </KnowledgeBaseLayout>
  );
};

export default PatternBuilder;
