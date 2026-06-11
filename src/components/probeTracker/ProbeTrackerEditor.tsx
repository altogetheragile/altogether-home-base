import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Trash2, Save, RotateCcw, Image, FileText, FileJson, MessageCircle, Play, Check, X, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectArtifactMutations } from '@/hooks/useProjectArtifacts';
import { useDebouncedCallback } from 'use-debounce';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import { CoachChat } from '@/components/coaching/CoachChat';
import { exportCanvas, downloadFile } from '@/utils/canvas/canvasExporter';
import {
  ProbeTracker,
  Probe,
  ProbeStatus,
  PROBE_STRETCH,
  PROBE_COLUMNS,
  emptyProbeTracker,
  exampleProbeTracker,
  newProbe,
  parseProbeTracker,
} from '@/types/probeTracker';

const STORAGE_KEY = 'probeTracker.v1';
const TEAL = '#004D4D';

const today = () => new Date().toISOString().slice(0, 10);

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

const loadInitial = (): ProbeTracker => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = parseProbeTracker(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    /* ignore */
  }
  return exampleProbeTracker();
};

interface ProbeTrackerEditorProps {
  initialData?: ProbeTracker;
  artifactId?: string;
  projectId?: string;
}

export function ProbeTrackerEditor({ initialData, artifactId, projectId }: ProbeTrackerEditorProps = {}) {
  const isArtifact = Boolean(artifactId && projectId);
  const [tracker, setTracker] = useState<ProbeTracker>(() =>
    initialData ? parseProbeTracker(initialData) ?? emptyProbeTracker() : loadInitial(),
  );
  const [draft, setDraft] = useState<Probe>(newProbe);
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

  const performArtifactSave = useDebouncedCallback(async (t: ProbeTracker) => {
    if (!artifactId || !projectId) return;
    setSaveStatus('saving');
    try {
      await updateArtifact.mutateAsync({ id: artifactId, updates: { data: { ...t } } });
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
    if (isArtifact) performArtifactSave(tracker);
    else {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker));
      } catch {
        /* ignore */
      }
    }
  }, [tracker]);

  const setStatus = (id: string, status: ProbeStatus) =>
    setTracker((t) => ({
      ...t,
      probes: t.probes.map((p) =>
        p.id === id ? { ...p, status, decided_at: status === 'kept' || status === 'killed' ? today() : '' } : p,
      ),
    }));
  const deleteProbe = (id: string) => setTracker((t) => ({ ...t, probes: t.probes.filter((p) => p.id !== id) }));

  const addProbe = () => {
    if (!draft.option.trim() && !draft.probe.trim()) {
      toast.info('Name the option and the smallest test before adding the probe.');
      return;
    }
    setTracker((t) => ({ ...t, probes: [{ ...draft }, ...t.probes] }));
    setDraft(newProbe());
    setCoachOpen(false);
    toast.success('Probe added to Planned');
  };

  const handleSaveToProject = () => {
    if (!user) {
      toast.error('Please sign in to save to a project');
      navigate('/auth');
      return;
    }
    setSaveDialogOpen(true);
  };
  const handleSaveComplete = (projId: string) => {
    toast.success('Probe tracker saved to project');
    navigate(`/projects/${projId}`);
  };

  const toMarkdown = (): string => {
    const lines = ['# Probe Tracker', ''];
    PROBE_COLUMNS.forEach((col) => {
      const inCol = tracker.probes.filter((p) => p.status === col.status);
      lines.push(`## ${col.label} (${inCol.length})`, '');
      inCol.forEach((p) => {
        lines.push(`### ${p.option || 'Untitled option'}`);
        if (p.output) lines.push(`- Output: ${p.output}`);
        if (p.probe) lines.push(`- Probe: ${p.probe}`);
        if (p.signal) lines.push(`- Watch for: ${p.signal}`);
        if (p.decided_at) lines.push(`- Decided: ${p.decided_at}`);
        if (p.note) lines.push(`- Note: ${p.note}`);
        lines.push('');
      });
    });
    return lines.join('\n');
  };

  const handleExportJson = () => { downloadText(JSON.stringify(tracker, null, 2), 'probe-tracker.json', 'application/json'); toast.success('JSON exported'); };
  const handleExportMarkdown = () => { downloadText(toMarkdown(), 'probe-tracker.md', 'text/markdown'); toast.success('Markdown exported'); };
  const handleExportImage = async (format: 'png' | 'pdf') => {
    if (!diagramRef.current) return;
    try {
      toast.info(`Generating ${format.toUpperCase()}...`);
      const dataUrl = await exportCanvas(diagramRef.current, { format, filename: 'probe-tracker' });
      downloadFile(dataUrl, 'probe-tracker', format);
      toast.success(`${format.toUpperCase()} exported`);
    } catch {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  const moveButtons = (p: Probe) => {
    switch (p.status) {
      case 'planned':
        return (
          <button className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: TEAL }} onClick={() => setStatus(p.id, 'running')}>
            <Play className="h-3 w-3" /> Start
          </button>
        );
      case 'running':
        return (
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 text-xs font-medium text-green-700 hover:underline" onClick={() => setStatus(p.id, 'kept')}>
              <Check className="h-3 w-3" /> Keep
            </button>
            <button className="flex items-center gap-1 text-xs font-medium text-red-700 hover:underline" onClick={() => setStatus(p.id, 'killed')}>
              <X className="h-3 w-3" /> Kill
            </button>
          </div>
        );
      default:
        return (
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:underline" onClick={() => setStatus(p.id, 'running')}>
            <Undo2 className="h-3 w-3" /> Reopen
          </button>
        );
    }
  };

  return (
    <div className="space-y-6">
      <style>{`.exporting .probe-no-export { display: none !important; }`}</style>

      <div className="flex flex-wrap items-center gap-2">
        {!isArtifact && (
          <Button size="sm" onClick={handleSaveToProject}><Save className="mr-1.5 h-4 w-4" /> Save to Project</Button>
        )}
        {isArtifact && saveStatus !== 'idle' && (
          <span className="text-xs text-muted-foreground">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save failed'}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={() => setTracker(exampleProbeTracker())}><RotateCcw className="mr-1.5 h-4 w-4" /> Example</Button>
        <Button variant="outline" size="sm" onClick={() => setTracker(emptyProbeTracker())}><RotateCcw className="mr-1.5 h-4 w-4" /> Clear</Button>
        <div className="mx-1 h-6 w-px bg-border" />
        <Button variant="outline" size="sm" onClick={() => handleExportImage('png')}><Image className="mr-1.5 h-4 w-4" /> PNG</Button>
        <Button variant="outline" size="sm" onClick={() => handleExportImage('pdf')}><FileText className="mr-1.5 h-4 w-4" /> PDF</Button>
        <Button variant="outline" size="sm" onClick={handleExportJson}><FileJson className="mr-1.5 h-4 w-4" /> JSON</Button>
        <Button variant="outline" size="sm" onClick={handleExportMarkdown}><FileText className="mr-1.5 h-4 w-4" /> Markdown</Button>
      </div>

      {/* New probe (coached) */}
      <div className="probe-no-export rounded-lg border border-border bg-muted/40 p-4">
        <h2 className="mb-1 text-lg font-semibold">Add a probe</h2>
        <p className="mb-3 text-sm italic" style={{ color: TEAL }}>{PROBE_STRETCH}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold tracking-wide text-muted-foreground">OPTION</label>
            <input value={draft.option} onChange={(e) => setDraft((d) => ({ ...d, option: e.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm" placeholder="The option you are testing" />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wide text-muted-foreground">OUTPUT</label>
            <input value={draft.output} onChange={(e) => setDraft((d) => ({ ...d, output: e.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm" placeholder="What gets built or changed" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold tracking-wide text-muted-foreground">SMALLEST TEST</label>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => setCoachOpen((v) => !v)}>
                <MessageCircle className="h-3.5 w-3.5" /> {coachOpen ? 'Hide' : 'Ask the coach'}
              </button>
            </div>
            <textarea value={draft.probe} onChange={(e) => setDraft((d) => ({ ...d, probe: e.target.value }))} rows={2} className="mt-1 w-full resize-none rounded-md border border-border bg-background p-2 text-sm" placeholder="The smallest, safe-to-fail test" />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wide text-muted-foreground">WHAT WOULD PROVE THIS WRONG</label>
            <textarea value={draft.signal} onChange={(e) => setDraft((d) => ({ ...d, signal: e.target.value }))} rows={2} className="mt-1 w-full resize-none rounded-md border border-border bg-background p-2 text-sm" placeholder="The signal you are watching for" />
          </div>
        </div>
        {coachOpen && (
          <div className="mt-3">
            <CoachChat
              tool="probe-tracker"
              cell={{ tag: 'PROBE', question: 'What is the smallest test that would tell you most?', stretch: 'What would prove this wrong?' }}
              onAccept={(text) => { setDraft((d) => ({ ...d, probe: text })); setCoachOpen(false); }}
              onClose={() => setCoachOpen(false)}
            />
          </div>
        )}
        <Button size="sm" className="mt-3" onClick={addProbe}><Plus className="mr-1.5 h-4 w-4" /> Add probe</Button>
      </div>

      {/* Kanban (exportable) */}
      <div ref={diagramRef} className="rounded-lg border border-border bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold" style={{ color: TEAL }}>Probe Tracker</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {PROBE_COLUMNS.map((col) => {
            const inCol = tracker.probes.filter((p) => p.status === col.status);
            return (
              <div key={col.status} className="rounded-md bg-muted/40 p-2">
                <h3 className="mb-2 px-1 text-xs font-bold tracking-wide" style={{ color: TEAL }}>
                  {col.label.toUpperCase()} ({inCol.length})
                </h3>
                <div className="space-y-2">
                  {inCol.map((p) => (
                    <div key={p.id} className="rounded-md border border-border bg-white p-2.5">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold">{p.option || 'Untitled option'}</p>
                        <button aria-label="Delete probe" className="probe-no-export shrink-0 text-muted-foreground hover:text-destructive" onClick={() => deleteProbe(p.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                      {p.output && <p className="mb-1 text-xs text-muted-foreground">{p.output}</p>}
                      {p.probe && <p className="text-xs"><span className="font-medium">Test:</span> {p.probe}</p>}
                      {p.signal && <p className="text-xs"><span className="font-medium">Watch:</span> {p.signal}</p>}
                      {p.decided_at && <p className="mt-1 text-[10px] text-muted-foreground">Decided {p.decided_at}</p>}
                      <div className="probe-no-export mt-2 border-t border-border pt-2">{moveButtons(p)}</div>
                    </div>
                  ))}
                  {inCol.length === 0 && <p className="px-1 text-xs text-muted-foreground">Empty</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <SaveToProjectDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        artifactType="probe-tracker"
        artifactName="Probe Tracker"
        artifactDescription={`${tracker.probes.length} probes`}
        artifactData={tracker}
        preselectedProjectId={preselectedProjectId || undefined}
        onSaveComplete={handleSaveComplete}
      />
    </div>
  );
}
