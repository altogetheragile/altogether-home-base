import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Trash2, Save, RotateCcw, Image, FileText, FileJson, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectArtifactMutations } from '@/hooks/useProjectArtifacts';
import { useDebouncedCallback } from 'use-debounce';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import { CoachChat } from '@/components/coaching/CoachChat';
import { exportCanvas, downloadFile } from '@/utils/canvas/canvasExporter';
import {
  BenefitsScorecard,
  Benefit,
  Reading,
  BENEFITS_STRETCH,
  emptyBenefitsScorecard,
  exampleBenefitsScorecard,
  newBenefit,
  newReading,
  parseBenefitsScorecard,
} from '@/types/benefitsScorecard';

const STORAGE_KEY = 'benefitsScorecard.v1';
const TEAL = '#004D4D';

const downloadText = (text: string, filename: string, mime: string): void => {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const loadInitial = (): BenefitsScorecard => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = parseBenefitsScorecard(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    /* ignore */
  }
  return exampleBenefitsScorecard();
};

/** A tiny inline sparkline from a benefit's readings (oldest to newest). */
function Sparkline({ readings }: { readings: Reading[] }) {
  const values = readings.map((r) => r.value);
  if (values.length < 2) return <span className="text-xs text-muted-foreground">Add two readings to see the trend</span>;
  const w = 160;
  const h = 40;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (w - 4) + 2;
      const y = h - 2 - ((v - min) / span) * (h - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const lastX = w - 2;
  const lastY = h - 2 - ((values[values.length - 1] - min) / span) * (h - 4);
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={TEAL} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={3} fill={TEAL} />
    </svg>
  );
}

interface BenefitsScorecardEditorProps {
  initialData?: BenefitsScorecard;
  artifactId?: string;
  projectId?: string;
}

export function BenefitsScorecardEditor({ initialData, artifactId, projectId }: BenefitsScorecardEditorProps = {}) {
  const isArtifact = Boolean(artifactId && projectId);
  const [scorecard, setScorecard] = useState<BenefitsScorecard>(() =>
    initialData ? parseBenefitsScorecard(initialData) ?? emptyBenefitsScorecard() : loadInitial(),
  );
  const [coachFor, setCoachFor] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const diagramRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId');
  const { updateArtifact } = useProjectArtifactMutations();

  const performArtifactSave = useDebouncedCallback(async (s: BenefitsScorecard) => {
    if (!artifactId || !projectId) return;
    setSaveStatus('saving');
    try {
      await updateArtifact.mutateAsync({ id: artifactId, updates: { data: { ...s } } });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, 1500);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isArtifact) performArtifactSave(scorecard);
    else {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scorecard));
      } catch {
        /* ignore */
      }
    }
  }, [scorecard]);

  const updateBenefit = (id: string, patch: Partial<Benefit>) =>
    setScorecard((s) => ({ ...s, benefits: s.benefits.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
  const addBenefit = () => setScorecard((s) => ({ ...s, benefits: [...s.benefits, newBenefit()] }));
  const removeBenefit = (id: string) => setScorecard((s) => ({ ...s, benefits: s.benefits.filter((b) => b.id !== id) }));

  const addReading = (benefitId: string) =>
    setScorecard((s) => ({
      ...s,
      benefits: s.benefits.map((b) => (b.id === benefitId ? { ...b, readings: [...b.readings, newReading()] } : b)),
    }));
  const updateReading = (benefitId: string, readingId: string, patch: Partial<Reading>) =>
    setScorecard((s) => ({
      ...s,
      benefits: s.benefits.map((b) =>
        b.id === benefitId ? { ...b, readings: b.readings.map((r) => (r.id === readingId ? { ...r, ...patch } : r)) } : b,
      ),
    }));
  const removeReading = (benefitId: string, readingId: string) =>
    setScorecard((s) => ({
      ...s,
      benefits: s.benefits.map((b) =>
        b.id === benefitId ? { ...b, readings: b.readings.filter((r) => r.id !== readingId) } : b,
      ),
    }));

  const handleSaveToProject = () => {
    if (!user) {
      toast.error('Please sign in to save to a project');
      navigate('/auth');
      return;
    }
    setSaveDialogOpen(true);
  };
  const handleSaveComplete = (projId: string) => {
    toast.success('Benefits scorecard saved to project');
    navigate(`/projects/${projId}`);
  };

  const toMarkdown = (): string => {
    const lines = ['# Benefits on a Page', ''];
    scorecard.benefits.forEach((b) => {
      lines.push(`## ${b.outcome || 'Untitled outcome'}`);
      if (b.leading_indicator) lines.push(`- Leading indicator: ${b.leading_indicator}`);
      if (b.target) lines.push(`- Target: ${b.target}`);
      if (b.readings.length) {
        lines.push('- Readings:');
        b.readings.forEach((r) => lines.push(`  - ${r.date}: ${r.value}${r.note ? ` (${r.note})` : ''}`));
      }
      lines.push('');
    });
    return lines.join('\n');
  };

  const handleExportJson = () => { downloadText(JSON.stringify(scorecard, null, 2), 'benefits-scorecard.json', 'application/json'); toast.success('JSON exported'); };
  const handleExportMarkdown = () => { downloadText(toMarkdown(), 'benefits-on-a-page.md', 'text/markdown'); toast.success('Markdown exported'); };
  const handleExportImage = async (format: 'png' | 'pdf') => {
    if (!diagramRef.current) return;
    try {
      toast.info(`Generating ${format.toUpperCase()}...`);
      const dataUrl = await exportCanvas(diagramRef.current, { format, filename: 'benefits-on-a-page' });
      downloadFile(dataUrl, 'benefits-on-a-page', format);
      toast.success(`${format.toUpperCase()} exported`);
    } catch {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        .exporting .benefit-no-export { display: none !important; }
        .benefit-export-only { display: none; }
        .exporting .benefit-edit { display: none !important; }
        .exporting .benefit-export-only { display: block !important; }
      `}</style>

      <div className="flex flex-wrap items-center gap-2">
        {!isArtifact && (
          <Button size="sm" onClick={handleSaveToProject}><Save className="mr-1.5 h-4 w-4" /> Save to Project</Button>
        )}
        {isArtifact && saveStatus !== 'idle' && (
          <span className="text-xs text-muted-foreground">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save failed'}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={() => setScorecard(exampleBenefitsScorecard())}><RotateCcw className="mr-1.5 h-4 w-4" /> Example</Button>
        <Button variant="outline" size="sm" onClick={() => setScorecard(emptyBenefitsScorecard())}><RotateCcw className="mr-1.5 h-4 w-4" /> Clear</Button>
        <div className="mx-1 h-6 w-px bg-border" />
        <Button variant="outline" size="sm" onClick={() => handleExportImage('png')}><Image className="mr-1.5 h-4 w-4" /> PNG</Button>
        <Button variant="outline" size="sm" onClick={() => handleExportImage('pdf')}><FileText className="mr-1.5 h-4 w-4" /> Benefits on a Page (PDF)</Button>
        <Button variant="outline" size="sm" onClick={handleExportJson}><FileJson className="mr-1.5 h-4 w-4" /> JSON</Button>
        <Button variant="outline" size="sm" onClick={handleExportMarkdown}><FileText className="mr-1.5 h-4 w-4" /> Markdown</Button>
      </div>

      <p className="text-sm italic" style={{ color: TEAL }}>{BENEFITS_STRETCH}</p>

      <div ref={diagramRef} className="rounded-lg border border-border bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold" style={{ color: TEAL }}>Benefits on a Page</h2>
        {scorecard.benefits.length === 0 && <p className="text-sm text-muted-foreground">No outcomes yet. Add the first one below.</p>}
        <div className="space-y-4">
          {scorecard.benefits.map((b) => (
            <div key={b.id} className="rounded-md border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <input
                  value={b.outcome}
                  onChange={(e) => updateBenefit(b.id, { outcome: e.target.value })}
                  placeholder="The outcome we are trying to create"
                  className="benefit-edit flex-1 bg-transparent text-base font-semibold focus:outline-none"
                />
                <div className="benefit-export-only flex-1 text-base font-semibold">{b.outcome}</div>
                <div className="benefit-no-export flex items-center gap-2">
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => setCoachFor(coachFor === b.id ? null : b.id)}>
                    <MessageCircle className="h-3.5 w-3.5" /> {coachFor === b.id ? 'Hide' : 'Ask the coach'}
                  </button>
                  <button aria-label="Remove outcome" className="text-muted-foreground hover:text-destructive" onClick={() => removeBenefit(b.id)}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold tracking-wide text-muted-foreground">LEADING INDICATOR</label>
                  <input value={b.leading_indicator} onChange={(e) => updateBenefit(b.id, { leading_indicator: e.target.value })} placeholder="What you watch to see it coming" className="benefit-edit mt-1 w-full rounded-md border border-border bg-background p-2 text-sm" />
                  <div className="benefit-export-only mt-1 text-sm">{b.leading_indicator}</div>
                </div>
                <div>
                  <label className="text-xs font-bold tracking-wide text-muted-foreground">TARGET</label>
                  <input value={b.target} onChange={(e) => updateBenefit(b.id, { target: e.target.value })} placeholder="e.g. under 3 days" className="benefit-edit mt-1 w-full rounded-md border border-border bg-background p-2 text-sm" />
                  <div className="benefit-export-only mt-1 text-sm">{b.target}</div>
                </div>
              </div>

              {coachFor === b.id && (
                <div className="benefit-no-export mt-3">
                  <CoachChat
                    tool="benefits-scorecard"
                    cell={{ tag: 'OUTCOME', question: 'What is the real outcome you want, beyond the output being shipped?', stretch: BENEFITS_STRETCH }}
                    onAccept={(text) => { updateBenefit(b.id, { outcome: text }); setCoachFor(null); }}
                    onClose={() => setCoachFor(null)}
                  />
                </div>
              )}

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="shrink-0">
                  <Sparkline readings={b.readings} />
                </div>
                <div className="flex-1">
                  <div className="space-y-1.5">
                    {b.readings.map((r) => (
                      <div key={r.id}>
                        <div className="benefit-edit flex items-center gap-2">
                          <input type="date" value={r.date} onChange={(e) => updateReading(b.id, r.id, { date: e.target.value })} className="rounded-md border border-border bg-background p-1 text-xs" />
                          <input type="number" value={r.value} onChange={(e) => updateReading(b.id, r.id, { value: Number(e.target.value) })} className="w-20 rounded-md border border-border bg-background p-1 text-xs" />
                          <input value={r.note} onChange={(e) => updateReading(b.id, r.id, { note: e.target.value })} placeholder="note" className="flex-1 rounded-md border border-border bg-background p-1 text-xs" />
                          <button aria-label="Remove reading" className="benefit-no-export text-muted-foreground hover:text-destructive" onClick={() => removeReading(b.id, r.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="benefit-export-only text-xs">{r.date}: {r.value}{r.note ? ` (${r.note})` : ''}</div>
                      </div>
                    ))}
                  </div>
                  <button className="benefit-no-export mt-1.5 flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: TEAL }} onClick={() => addReading(b.id)}>
                    <Plus className="h-3.5 w-3.5" /> Add reading
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="benefit-no-export mt-4 flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: TEAL }} onClick={addBenefit}>
          <Plus className="h-4 w-4" /> Add outcome
        </button>
      </div>

      <SaveToProjectDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        artifactType="benefits-scorecard"
        artifactName="Benefits Scorecard"
        artifactDescription={`${scorecard.benefits.length} outcomes`}
        artifactData={scorecard}
        preselectedProjectId={preselectedProjectId || undefined}
        onSaveComplete={handleSaveComplete}
      />
    </div>
  );
}
