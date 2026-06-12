import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { RotateCcw, Save, Image, FileText, FileJson, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectArtifactMutations } from '@/hooks/useProjectArtifacts';
import { useDebouncedCallback } from 'use-debounce';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import { CoachChat } from '@/components/coaching/CoachChat';
import { AutoTextarea } from '@/components/coaching/AutoTextarea';
import { exportCanvas, downloadFile } from '@/utils/canvas/canvasExporter';
import { confirmReplace } from '@/utils/confirmDiscard';
import type { CanvasDef } from '@/config/canvases';

type CanvasData = Record<string, string>;

const canvasHasContent = (d: CanvasData): boolean => Object.values(d).some((v) => (v || '').trim() !== '');

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

const emptyData = (def: CanvasDef): CanvasData => Object.fromEntries(def.cells.map((c) => [c.key, '']));

const coerce = (def: CanvasDef, raw: unknown): CanvasData => {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return Object.fromEntries(def.cells.map((c) => [c.key, String(o[c.key] ?? '')]));
};

interface CoachedCanvasEditorProps {
  def: CanvasDef;
  initialData?: CanvasData;
  artifactId?: string;
  projectId?: string;
}

export function CoachedCanvasEditor({ def, initialData, artifactId, projectId }: CoachedCanvasEditorProps) {
  const isArtifact = Boolean(artifactId && projectId);
  const storageKey = `canvas.${def.key}.v1`;

  const [data, setData] = useState<CanvasData>(() => {
    if (initialData) return coerce(def, initialData);
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return coerce(def, JSON.parse(raw));
    } catch {
      /* ignore */
    }
    return emptyData(def);
  });
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [coachCell, setCoachCell] = useState<string | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId');
  const { updateArtifact } = useProjectArtifactMutations();

  const setCell = (key: string, value: string) => setData((d) => ({ ...d, [key]: value }));

  const performArtifactSave = useDebouncedCallback(async (d: CanvasData) => {
    if (!artifactId || !projectId) return;
    setSaveStatus('saving');
    try {
      await updateArtifact.mutateAsync({ id: artifactId, updates: { data: { ...d } } });
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
    if (isArtifact) {
      if (canvasHasContent(data)) performArtifactSave(data);
    } else {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch {
        /* ignore */
      }
    }
  }, [data]);

  const handleSaveToProject = () => {
    if (!user) {
      toast.error('Please sign in to save to a project');
      navigate('/auth');
      return;
    }
    setSaveDialogOpen(true);
  };
  const handleSaveComplete = (projId: string) => {
    toast.success(`${def.name} saved to project`);
    navigate(`/projects/${projId}`);
  };

  const toMarkdown = (): string => {
    const lines = [`# ${def.name}`, ''];
    def.cells.forEach((c) => {
      if (data[c.key]) lines.push(`## ${c.label}`, data[c.key], '');
    });
    return lines.join('\n');
  };

  const handleExportJson = () => { downloadText(JSON.stringify(data, null, 2), `${def.key}.json`, 'application/json'); toast.success('JSON exported'); };
  const handleExportMarkdown = () => { downloadText(toMarkdown(), `${def.key}.md`, 'text/markdown'); toast.success('Markdown exported'); };
  const handleExportImage = async (format: 'png' | 'pdf') => {
    if (!diagramRef.current) return;
    try {
      toast.info(`Generating ${format.toUpperCase()}...`);
      const dataUrl = await exportCanvas(diagramRef.current, { format, filename: def.key });
      downloadFile(dataUrl, def.key, format);
      toast.success(`${format.toUpperCase()} exported`);
    } catch {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        .exporting .canvas-no-export { display: none !important; }
        .canvas-export-only { display: none; }
        .exporting .canvas-edit { display: none !important; }
        .exporting .canvas-export-only { display: block !important; }
      `}</style>

      <div className="flex flex-wrap items-center gap-2">
        {!isArtifact && (
          <Button size="sm" onClick={handleSaveToProject}>
            <Save className="mr-1.5 h-4 w-4" /> Save to Project
          </Button>
        )}
        {isArtifact && saveStatus !== 'idle' && (
          <span className="text-xs text-muted-foreground">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save failed'}
          </span>
        )}
        {!isArtifact && (
          <Button variant="outline" size="sm" onClick={() => { if (confirmReplace(canvasHasContent(data))) setData(emptyData(def)); }}>
            <RotateCcw className="mr-1.5 h-4 w-4" /> Clear
          </Button>
        )}
        <div className="mx-1 h-6 w-px bg-border" />
        <Button variant="outline" size="sm" onClick={() => handleExportImage('png')}><Image className="mr-1.5 h-4 w-4" /> PNG</Button>
        <Button variant="outline" size="sm" onClick={() => handleExportImage('pdf')}><FileText className="mr-1.5 h-4 w-4" /> PDF</Button>
        <Button variant="outline" size="sm" onClick={handleExportJson}><FileJson className="mr-1.5 h-4 w-4" /> JSON</Button>
        <Button variant="outline" size="sm" onClick={handleExportMarkdown}><FileText className="mr-1.5 h-4 w-4" /> Markdown</Button>
      </div>

      <div ref={diagramRef} className="rounded-lg border border-border bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold" style={{ color: '#004D4D' }}>{def.name}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {def.cells.map((cell) => (
            <div key={cell.key} className={`rounded-md border border-border p-3 ${cell.wide ? 'sm:col-span-2' : ''}`}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-bold tracking-wide" style={{ color: cell.coach.color }}>{cell.label}</span>
                <button
                  className="canvas-no-export flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setCoachCell((c) => (c === cell.key ? null : cell.key))}
                >
                  <MessageCircle className="h-3.5 w-3.5" /> {coachCell === cell.key ? 'Hide' : 'Ask the coach'}
                </button>
              </div>
              <AutoTextarea
                value={data[cell.key]}
                placeholder={cell.coach.question}
                onChange={(e) => setCell(cell.key, e.target.value)}
                rows={cell.wide ? 2 : 3}
                className="canvas-edit w-full resize-none overflow-hidden bg-transparent text-sm text-slate-900 placeholder:text-muted-foreground/60 focus:outline-none"
              />
              <div className="canvas-export-only whitespace-pre-wrap text-sm text-slate-900">{data[cell.key]}</div>
              {coachCell === cell.key && (
                <div className="canvas-no-export mt-2">
                  <CoachChat
                    tool={def.key}
                    cell={{ tag: cell.coach.tag, question: cell.coach.question, stretch: cell.coach.stretch }}
                    onAccept={(text) => { setCell(cell.key, text); setCoachCell(null); }}
                    onClose={() => setCoachCell(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <SaveToProjectDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        artifactType={def.key}
        artifactName={def.name}
        artifactDescription={def.blurb}
        artifactData={data}
        preselectedProjectId={preselectedProjectId || undefined}
        onSaveComplete={handleSaveComplete}
      />
    </div>
  );
}
