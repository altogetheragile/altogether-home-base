import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Sparkles, RotateCcw, Save, Image, FileText, FileJson, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectArtifactMutations } from '@/hooks/useProjectArtifacts';
import { useDebouncedCallback } from 'use-debounce';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import { CoachChat } from '@/components/coaching/CoachChat';
import {
  Persona,
  PersonaField,
  PERSONA_FIELDS,
  FIELD_LABELS,
  emptyPersona,
  examplePersona,
  parsePersona,
} from '@/types/persona';
import { toJson, toMarkdown, fileStem, downloadText } from '@/utils/persona/exportPersona';
import { exportCanvas, downloadFile } from '@/utils/canvas/canvasExporter';

const STORAGE_KEY = 'persona.v1';

const loadInitial = (): Persona => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = parsePersona(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    /* ignore */
  }
  return examplePersona();
};

interface PersonaEditorProps {
  initialData?: Persona;
  artifactId?: string;
  projectId?: string;
}

export function PersonaEditor({ initialData, artifactId, projectId }: PersonaEditorProps = {}) {
  const isArtifact = Boolean(artifactId && projectId);
  const [persona, setPersona] = useState<Persona>(() =>
    initialData ? parsePersona(initialData) ?? emptyPersona() : loadInitial(),
  );
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [coachField, setCoachField] = useState<PersonaField | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId');
  const { updateArtifact } = useProjectArtifactMutations();

  const setField = (key: PersonaField, value: string) => setPersona((p) => ({ ...p, [key]: value }));

  const performArtifactSave = useDebouncedCallback(async (p: Persona) => {
    if (!artifactId || !projectId) return;
    setSaveStatus('saving');
    try {
      await updateArtifact.mutateAsync({ id: artifactId, updates: { data: { ...p } } });
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
    if (isArtifact) performArtifactSave(persona);
    else {
      try {
        localStorage.setItem(STORAGE_KEY, toJson(persona));
      } catch {
        /* ignore */
      }
    }
  }, [persona]);

  const handleSaveToProject = () => {
    if (!user) {
      toast.error('Please sign in to save to a project');
      navigate('/auth');
      return;
    }
    setSaveDialogOpen(true);
  };
  const handleSaveComplete = (projId: string) => {
    toast.success('Persona saved to project');
    navigate(`/projects/${projId}`);
  };

  const handleExportJson = () => { downloadText(toJson(persona), `${fileStem(persona)}.json`, 'application/json'); toast.success('JSON exported'); };
  const handleExportMarkdown = () => { downloadText(toMarkdown(persona), `${fileStem(persona)}.md`, 'text/markdown'); toast.success('Markdown exported'); };
  const handleExportImage = async (format: 'png' | 'pdf') => {
    if (!diagramRef.current) return;
    try {
      toast.info(`Generating ${format.toUpperCase()}...`);
      const dataUrl = await exportCanvas(diagramRef.current, { format, filename: fileStem(persona) });
      downloadFile(dataUrl, fileStem(persona), format);
      toast.success(`${format.toUpperCase()} exported`);
    } catch {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  return (
    <div className="space-y-6">
      <style>{`.exporting .persona-no-export { display: none !important; }`}</style>

      {/* Toolbar */}
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
        <Button variant="outline" size="sm" onClick={() => setPersona(examplePersona())}>
          <Sparkles className="mr-1.5 h-4 w-4" /> Load Example
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPersona(emptyPersona())}>
          <RotateCcw className="mr-1.5 h-4 w-4" /> Clear
        </Button>
        <div className="mx-1 h-6 w-px bg-border" />
        <Button variant="outline" size="sm" onClick={() => handleExportImage('png')}>
          <Image className="mr-1.5 h-4 w-4" /> PNG
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleExportImage('pdf')}>
          <FileText className="mr-1.5 h-4 w-4" /> PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportJson}>
          <FileJson className="mr-1.5 h-4 w-4" /> JSON
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
          <FileText className="mr-1.5 h-4 w-4" /> Markdown
        </Button>
      </div>

      {/* Persona card (exportable) */}
      <div ref={diagramRef} className="rounded-lg border border-border bg-white p-5">
        <div className="rounded-lg p-3 text-white" style={{ backgroundColor: '#004D4D' }}>
          <div className="mb-1 text-[10px] font-bold tracking-wide text-white/70">PERSONA</div>
          <input
            value={persona.name}
            placeholder="Name this persona..."
            onChange={(e) => setField('name', e.target.value)}
            className="w-full bg-transparent text-lg font-semibold text-white placeholder:text-white/50 focus:outline-none"
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PERSONA_FIELDS.filter((f) => f.key !== 'name' && f.key !== 'quote').map(({ key, coach }) => (
            <div key={key} className="rounded-md border border-border p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-bold tracking-wide" style={{ color: coach.color }}>{FIELD_LABELS[key]}</span>
                <button
                  className="persona-no-export flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setCoachField((c) => (c === key ? null : key))}
                >
                  <MessageCircle className="h-3.5 w-3.5" /> {coachField === key ? 'Hide' : 'Ask the coach'}
                </button>
              </div>
              <textarea
                value={persona[key]}
                placeholder={coach.question}
                onChange={(e) => setField(key, e.target.value)}
                rows={2}
                className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
              {coachField === key && (
                <div className="persona-no-export mt-2">
                  <CoachChat
                    tool="persona"
                    cell={{ tag: coach.tag, question: coach.question, stretch: coach.stretch }}
                    onAccept={(text) => { setField(key, text); setCoachField(null); }}
                    onClose={() => setCoachField(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="mt-3 rounded-md p-3" style={{ background: 'rgba(107,95,204,0.08)' }}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide" style={{ color: '#6B5FCC' }}>QUOTE</span>
            <button
              className="persona-no-export flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setCoachField((c) => (c === 'quote' ? null : 'quote'))}
            >
              <MessageCircle className="h-3.5 w-3.5" /> {coachField === 'quote' ? 'Hide' : 'Ask the coach'}
            </button>
          </div>
          <textarea
            value={persona.quote}
            placeholder="A short line in their own voice..."
            onChange={(e) => setField('quote', e.target.value)}
            rows={2}
            className="w-full resize-none bg-transparent text-sm italic text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {coachField === 'quote' && (
            <div className="persona-no-export mt-2">
              <CoachChat
                tool="persona"
                cell={{ tag: 'QUOTE', question: 'What might they say?', stretch: 'Would they say this out loud, or only think it?' }}
                onAccept={(text) => { setField('quote', text); setCoachField(null); }}
                onClose={() => setCoachField(null)}
              />
            </div>
          )}
        </div>
      </div>

      <SaveToProjectDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        artifactType="persona"
        artifactName={persona.name || 'Persona'}
        artifactDescription={persona.role || 'Persona'}
        artifactData={persona}
        preselectedProjectId={preselectedProjectId || undefined}
        onSaveComplete={handleSaveComplete}
      />
    </div>
  );
}
