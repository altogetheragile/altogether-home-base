import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { KnowledgeBaseLayout } from '@/components/knowledge-base/KnowledgeBaseLayout';
import { useKnowledgeBase } from '@/lib/knowledgeBase';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { colors as p } from '@/theme/colors';
import { PatternResultView } from '@/components/patternBuilder/PatternResultView';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import { toMarkdown, toJson, downloadText, patternStem } from '@/utils/patternBuilder/exportPattern';
import type { PatternResult } from '@/types/pattern';

// Where a logged-out "Sign In to Save" round-trip stashes the in-progress pattern.
const RESUME_KEY = 'pattern:resume';

const PatternBuilder = () => {
  const kb = useKnowledgeBase();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PatternResult | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);

  // Feedback state
  const [comment, setComment] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Restore a pattern stashed before a "Sign In to Save" redirect, so logging in
  // never loses the user's work. Mirrors the BMC Generator resume flow.
  useEffect(() => {
    try {
      const stash = sessionStorage.getItem(RESUME_KEY);
      if (stash) {
        const parsed = JSON.parse(stash) as { scenario?: string; result?: PatternResult };
        if (parsed?.result) {
          setResult(parsed.result);
          if (parsed.scenario) setScenario(parsed.scenario);
          toast.success('Your pattern is back. You can save it to a project now.');
        }
        sessionStorage.removeItem(RESUME_KEY);
      }
    } catch {
      /* ignore corrupt stash */
    }
  }, []);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setComment('');
    setFeedbackSent(false);
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

  const sendFeedback = async (value: 'up' | 'down') => {
    if (!result?.runId) return;
    try {
      await supabase.functions.invoke('pattern-builder-feedback', {
        body: { runId: result.runId, rating: value, comment: comment.trim() || undefined },
      });
      setFeedbackSent(true);
    } catch {
      // Non-blocking: feedback is best-effort.
    }
  };

  const savable = !!result && !result.empty && (result.steps?.length ?? 0) > 0;

  const exportMarkdown = () => {
    if (!result) return;
    downloadText(`${patternStem(scenario)}.md`, toMarkdown(scenario, result, kb), 'text/markdown');
  };
  const exportJson = () => {
    if (!result) return;
    downloadText(`${patternStem(scenario)}.json`, toJson(scenario, result), 'application/json');
  };

  // Logged-out: stash the work and the return path, then go to sign in.
  const signInToSave = () => {
    try {
      sessionStorage.setItem(RESUME_KEY, JSON.stringify({ scenario, result }));
      sessionStorage.setItem('auth:returnTo', '/knowledge-base/pattern-builder?resume=1');
    } catch {
      /* storage may be unavailable; sign-in still proceeds */
    }
    navigate('/auth');
  };

  const patternName = scenario.trim()
    ? `Pattern: ${scenario.trim().slice(0, 50)}${scenario.trim().length > 50 ? '...' : ''}`
    : 'Recommended Pattern';

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
            {/* Save / export bar */}
            {savable && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg p-3" style={{ background: p.skyTeal, border: `1px solid ${p.paleTeal}` }}>
                {user ? (
                  <button
                    onClick={() => setSaveOpen(true)}
                    className="rounded-lg px-4 py-2 text-sm font-bold"
                    style={{ background: p.orange, color: p.deepTeal }}
                  >
                    Save to Project
                  </button>
                ) : (
                  <button
                    onClick={signInToSave}
                    className="rounded-lg px-4 py-2 text-sm font-bold"
                    style={{ background: p.orange, color: p.deepTeal }}
                  >
                    Sign In to Save
                  </button>
                )}
                <button
                  onClick={exportMarkdown}
                  className="rounded-lg px-3 py-2 text-sm font-semibold"
                  style={{ background: p.white, color: p.deepTeal, border: `1px solid ${p.paleTeal}` }}
                >
                  Export Markdown
                </button>
                <button
                  onClick={exportJson}
                  className="rounded-lg px-3 py-2 text-sm font-semibold"
                  style={{ background: p.white, color: p.deepTeal, border: `1px solid ${p.paleTeal}` }}
                >
                  Export JSON
                </button>
                {!user && (
                  <span className="text-xs" style={{ color: p.muted }}>
                    Export works without an account. Sign in to keep it on a project.
                  </span>
                )}
              </div>
            )}

            <PatternResultView result={result} />

            {/* Feedback */}
            {result.runId && !result.empty && (
              <section className="pt-2 border-t" style={{ borderColor: p.paleTeal }}>
                {feedbackSent ? (
                  <p className="text-sm" style={{ color: p.midTeal }}>Thanks for the feedback.</p>
                ) : (
                  <div className="space-y-2 max-w-md">
                    <span className="text-sm font-semibold" style={{ color: p.body }}>Was this useful?</span>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                      placeholder="Optional: what worked or what was off? (add before rating)"
                      className="w-full rounded-md p-2 text-sm outline-none"
                      style={{ border: `1px solid ${p.paleTeal}`, color: p.body }}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => sendFeedback('up')}
                        aria-label="Helpful"
                        className="rounded-md px-3 py-1.5 text-sm"
                        style={{ background: p.white, border: `1px solid ${p.paleTeal}` }}
                      >
                        👍 Helpful
                      </button>
                      <button
                        onClick={() => sendFeedback('down')}
                        aria-label="Not helpful"
                        className="rounded-md px-3 py-1.5 text-sm"
                        style={{ background: p.white, border: `1px solid ${p.paleTeal}` }}
                      >
                        👎 Not quite
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      {user && result && (
        <SaveToProjectDialog
          open={saveOpen}
          onOpenChange={setSaveOpen}
          artifactType="pattern"
          artifactName={patternName}
          artifactDescription={result.diagnosis?.slice(0, 200) || undefined}
          artifactData={{ scenario, result }}
          onSaveComplete={(projectId, artifactId) => {
            toast.success('Pattern saved to project');
            navigate(`/projects/${projectId}/artifacts/${artifactId}`);
          }}
        />
      )}
    </KnowledgeBaseLayout>
  );
};

export default PatternBuilder;
