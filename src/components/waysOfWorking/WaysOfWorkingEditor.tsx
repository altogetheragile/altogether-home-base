import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Trash2, Save, RotateCcw, Image, FileText, FileJson, MessageCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectArtifactMutations } from '@/hooks/useProjectArtifacts';
import { useDebouncedCallback } from 'use-debounce';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import { CoachChat } from '@/components/coaching/CoachChat';
import { exportCanvas, downloadFile } from '@/utils/canvas/canvasExporter';
import {
  WaysOfWorking,
  RetroAction,
  STANDING_STRETCH,
  emptyWaysOfWorking,
  exampleWaysOfWorking,
  newRetroAction,
  parseWaysOfWorking,
} from '@/types/waysOfWorking';

const STORAGE_KEY = 'waysOfWorking.v1';
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

const loadInitial = (): WaysOfWorking => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = parseWaysOfWorking(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    /* ignore */
  }
  return exampleWaysOfWorking();
};

interface WaysOfWorkingEditorProps {
  initialData?: WaysOfWorking;
  artifactId?: string;
  projectId?: string;
}

export function WaysOfWorkingEditor({ initialData, artifactId, projectId }: WaysOfWorkingEditorProps = {}) {
  const isArtifact = Boolean(artifactId && projectId);
  const [wow, setWow] = useState<WaysOfWorking>(() =>
    initialData ? parseWaysOfWorking(initialData) ?? emptyWaysOfWorking() : loadInitial(),
  );
  const [draft, setDraft] = useState<RetroAction>(newRetroAction);
  const [coachOpen, setCoachOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const diagramRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId');
  const { updateArtifact } = useProjectArtifactMutations();

  const performArtifactSave = useDebouncedCallback(async (w: WaysOfWorking) => {
    if (!artifactId || !projectId) return;
    setSaveStatus('saving');
    try {
      await updateArtifact.mutateAsync({ id: artifactId, updates: { data: { ...w } } });
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
    if (isArtifact) performArtifactSave(wow);
    else {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wow));
      } catch {
        /* ignore */
      }
    }
  }, [wow]);

  // Agreements
  const addAgreement = () => setWow((w) => ({ ...w, agreements: [...w.agreements, ''] }));
  const updateAgreement = (i: number, v: string) => setWow((w) => ({ ...w, agreements: w.agreements.map((a, idx) => (idx === i ? v : a)) }));
  const removeAgreement = (i: number) => setWow((w) => ({ ...w, agreements: w.agreements.filter((_, idx) => idx !== i) }));

  // Retro actions
  const addRetro = () => {
    if (!draft.action.trim() && !draft.improve_one_thing.trim() && !draft.what_worked.trim()) {
      toast.info('Add a little detail before saving the retro.');
      return;
    }
    setWow((w) => ({ ...w, retro_actions: [{ ...draft }, ...w.retro_actions] }));
    setDraft(newRetroAction());
    setCoachOpen(false);
    toast.success('Retro captured');
  };
  const toggleStatus = (id: string) =>
    setWow((w) => ({ ...w, retro_actions: w.retro_actions.map((r) => (r.id === id ? { ...r, status: r.status === 'open' ? 'done' : 'open' } : r)) }));
  const deleteRetro = (id: string) => setWow((w) => ({ ...w, retro_actions: w.retro_actions.filter((r) => r.id !== id) }));

  const handleSaveToProject = () => {
    if (!user) {
      toast.error('Please sign in to save to a project');
      navigate('/auth');
      return;
    }
    setSaveDialogOpen(true);
  };
  const handleSaveComplete = (projId: string) => {
    toast.success('Ways of working saved to project');
    navigate(`/projects/${projId}`);
  };

  const toMarkdown = (): string => {
    const lines = ['# Ways of Working', '', '## Working Agreements', ''];
    wow.agreements.filter(Boolean).forEach((a) => lines.push(`- ${a}`));
    lines.push('', '## Retrospective Actions', '');
    wow.retro_actions.forEach((r) => {
      lines.push(`### ${r.date} (${r.status})`);
      if (r.what_worked) lines.push(`- What worked: ${r.what_worked}`);
      if (r.improve_one_thing) lines.push(`- Improve one thing: ${r.improve_one_thing}`);
      if (r.action) lines.push(`- Action: ${r.action}`);
      lines.push('');
    });
    return lines.join('\n');
  };

  const handleExportJson = () => { downloadText(JSON.stringify(wow, null, 2), 'ways-of-working.json', 'application/json'); toast.success('JSON exported'); };
  const handleExportMarkdown = () => { downloadText(toMarkdown(), 'ways-of-working.md', 'text/markdown'); toast.success('Markdown exported'); };
  const handleExportImage = async (format: 'png' | 'pdf') => {
    if (!diagramRef.current) return;
    try {
      toast.info(`Generating ${format.toUpperCase()}...`);
      const dataUrl = await exportCanvas(diagramRef.current, { format, filename: 'ways-of-working' });
      downloadFile(dataUrl, 'ways-of-working', format);
      toast.success(`${format.toUpperCase()} exported`);
    } catch {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  return (
    <div className="space-y-6">
      <style>{`.exporting .wow-no-export { display: none !important; }`}</style>

      <div className="flex flex-wrap items-center gap-2">
        {!isArtifact && (
          <Button size="sm" onClick={handleSaveToProject}><Save className="mr-1.5 h-4 w-4" /> Save to Project</Button>
        )}
        {isArtifact && saveStatus !== 'idle' && (
          <span className="text-xs text-muted-foreground">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save failed'}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={() => setWow(exampleWaysOfWorking())}><RotateCcw className="mr-1.5 h-4 w-4" /> Example</Button>
        <Button variant="outline" size="sm" onClick={() => setWow(emptyWaysOfWorking())}><RotateCcw className="mr-1.5 h-4 w-4" /> Clear</Button>
        <div className="mx-1 h-6 w-px bg-border" />
        <Button variant="outline" size="sm" onClick={() => handleExportImage('png')}><Image className="mr-1.5 h-4 w-4" /> PNG</Button>
        <Button variant="outline" size="sm" onClick={() => handleExportImage('pdf')}><FileText className="mr-1.5 h-4 w-4" /> PDF</Button>
        <Button variant="outline" size="sm" onClick={handleExportJson}><FileJson className="mr-1.5 h-4 w-4" /> JSON</Button>
        <Button variant="outline" size="sm" onClick={handleExportMarkdown}><FileText className="mr-1.5 h-4 w-4" /> Markdown</Button>
      </div>

      {/* New retro (coached) */}
      <div className="wow-no-export rounded-lg border border-border bg-muted/40 p-4">
        <h2 className="mb-1 text-lg font-semibold">Run a quick retrospective</h2>
        <p className="mb-3 text-sm italic" style={{ color: TEAL }}>{STANDING_STRETCH}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-bold tracking-wide text-muted-foreground">WHAT WORKED WELL</label>
            <textarea value={draft.what_worked} onChange={(e) => setDraft((d) => ({ ...d, what_worked: e.target.value }))} rows={3} className="mt-1 w-full resize-none rounded-md border border-border bg-background p-2 text-sm" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold tracking-wide text-muted-foreground">ONE THING TO IMPROVE</label>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => setCoachOpen((v) => !v)}>
                <MessageCircle className="h-3.5 w-3.5" /> {coachOpen ? 'Hide' : 'Ask the coach'}
              </button>
            </div>
            <textarea value={draft.improve_one_thing} onChange={(e) => setDraft((d) => ({ ...d, improve_one_thing: e.target.value }))} rows={3} className="mt-1 w-full resize-none rounded-md border border-border bg-background p-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wide text-muted-foreground">WHAT WE WILL DO</label>
            <textarea value={draft.action} onChange={(e) => setDraft((d) => ({ ...d, action: e.target.value }))} rows={3} className="mt-1 w-full resize-none rounded-md border border-border bg-background p-2 text-sm" />
          </div>
        </div>
        {coachOpen && (
          <div className="mt-3">
            <CoachChat
              tool="ways-of-working"
              cell={{ tag: 'IMPROVE', question: 'What one thing would most improve how you work together?', stretch: STANDING_STRETCH }}
              onAccept={(text) => { setDraft((d) => ({ ...d, improve_one_thing: text })); setCoachOpen(false); }}
              onClose={() => setCoachOpen(false)}
            />
          </div>
        )}
        <Button size="sm" className="mt-3" onClick={addRetro}><Plus className="mr-1.5 h-4 w-4" /> Save retro</Button>
      </div>

      {/* Board (exportable) */}
      <div ref={diagramRef} className="rounded-lg border border-border bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold" style={{ color: TEAL }}>Ways of Working</h2>

        <div className="mb-4">
          <h3 className="mb-2 text-sm font-bold tracking-wide" style={{ color: TEAL }}>WORKING AGREEMENTS</h3>
          <div className="space-y-2">
            {wow.agreements.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-muted-foreground">•</span>
                <input value={a} placeholder="A working agreement..." onChange={(e) => updateAgreement(i, e.target.value)} className="flex-1 bg-transparent text-sm focus:outline-none" />
                <button aria-label="Remove agreement" className="wow-no-export text-muted-foreground hover:text-destructive" onClick={() => removeAgreement(i)}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            <button className="wow-no-export flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: TEAL }} onClick={addAgreement}>
              <Plus className="h-3.5 w-3.5" /> Add agreement
            </button>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold tracking-wide" style={{ color: TEAL }}>RETROSPECTIVE ACTIONS</h3>
          {wow.retro_actions.length === 0 && <p className="text-sm text-muted-foreground">No retros captured yet.</p>}
          <div className="space-y-2">
            {wow.retro_actions.map((r) => (
              <div key={r.id} className="rounded-md border border-border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{r.date}</span>
                  <div className="flex items-center gap-2">
                    <button
                      className={`wow-no-export rounded px-1.5 py-0.5 text-[10px] font-bold ${r.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
                      onClick={() => toggleStatus(r.id)}
                    >
                      {r.status === 'done' ? 'DONE' : 'OPEN'}
                    </button>
                    <button aria-label="Delete retro" className="wow-no-export text-muted-foreground hover:text-destructive" onClick={() => deleteRetro(r.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                {r.action && <p className="text-sm font-medium"><Check className="mr-1 inline h-3.5 w-3.5" />{r.action}</p>}
                {r.improve_one_thing && <p className="text-xs text-muted-foreground">Improve: {r.improve_one_thing}</p>}
                {r.what_worked && <p className="text-xs text-muted-foreground">Worked: {r.what_worked}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <SaveToProjectDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        artifactType="ways-of-working"
        artifactName="Ways of Working"
        artifactDescription={`${wow.agreements.length} agreements, ${wow.retro_actions.length} retro actions`}
        artifactData={wow}
        preselectedProjectId={preselectedProjectId || undefined}
        onSaveComplete={handleSaveComplete}
      />
    </div>
  );
}
