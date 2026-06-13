import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Sparkles, RotateCcw, Save, Image, FileText, FileJson, MessageCircle, Plus, Trash2, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectArtifactMutations } from '@/hooks/useProjectArtifacts';
import { useDebouncedCallback } from 'use-debounce';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import { CoachChat } from '@/components/coaching/CoachChat';
import { AutoTextarea } from '@/components/coaching/AutoTextarea';
import { confirmReplace } from '@/utils/confirmDiscard';
import {
  JourneyMap,
  JourneyStage,
  JourneyRowKey,
  JOURNEY_ROWS,
  JOURNEY_STRETCH,
  emptyJourneyMap,
  exampleJourneyMap,
  newJourneyStage,
  parseJourneyMap,
  journeyHasContent,
} from '@/types/journeyMap';
import { toJson, toMarkdown, fileStem, downloadText } from '@/utils/journeyMap/exportJourneyMap';
import { exportCanvas, downloadFile } from '@/utils/canvas/canvasExporter';

const STORAGE_KEY = 'journeyMap.v1';
const TEAL = '#004D4D';

const loadInitial = (): JourneyMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = parseJourneyMap(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    /* ignore */
  }
  return exampleJourneyMap();
};

interface JourneyMapEditorProps {
  initialData?: JourneyMap;
  artifactId?: string;
  projectId?: string;
}

export function JourneyMapEditor({ initialData, artifactId, projectId }: JourneyMapEditorProps = {}) {
  const isArtifact = Boolean(artifactId && projectId);
  const [journey, setJourney] = useState<JourneyMap>(() =>
    initialData ? parseJourneyMap(initialData) ?? emptyJourneyMap() : loadInitial(),
  );
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [coachFor, setCoachFor] = useState<string | null>(null); // `${stageId}:${rowKey}`
  const diagramRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId');
  const { updateArtifact } = useProjectArtifactMutations();

  const setStageField = (id: string, key: keyof JourneyStage, value: string) =>
    setJourney((j) => ({ ...j, stages: j.stages.map((s) => (s.id === id ? { ...s, [key]: value } : s)) }));
  const addStage = () => setJourney((j) => ({ ...j, stages: [...j.stages, newJourneyStage()] }));
  const removeStage = (id: string) =>
    setJourney((j) => ({ ...j, stages: j.stages.length > 1 ? j.stages.filter((s) => s.id !== id) : j.stages }));

  const performArtifactSave = useDebouncedCallback(async (j: JourneyMap) => {
    if (!artifactId || !projectId) return;
    setSaveStatus('saving');
    try {
      await updateArtifact.mutateAsync({ id: artifactId, updates: { data: { ...j } } });
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
      if (journeyHasContent(journey)) performArtifactSave(journey);
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, toJson(journey));
      } catch {
        /* ignore */
      }
    }
  }, [journey]);

  const handleSaveToProject = () => {
    if (!user) {
      toast.error('Please sign in to save to a project');
      navigate('/auth');
      return;
    }
    setSaveDialogOpen(true);
  };
  const handleSaveComplete = (projId: string) => {
    toast.success('Journey map saved to project');
    navigate(`/projects/${projId}`);
  };

  const handleExportJson = () => { downloadText(toJson(journey), `${fileStem(journey)}.json`, 'application/json'); toast.success('JSON exported'); };
  const handleExportMarkdown = () => { downloadText(toMarkdown(journey), `${fileStem(journey)}.md`, 'text/markdown'); toast.success('Markdown exported'); };
  const handleExportImage = async (format: 'png' | 'pdf') => {
    if (!diagramRef.current) return;
    try {
      toast.info(`Generating ${format.toUpperCase()}...`);
      const dataUrl = await exportCanvas(diagramRef.current, { format, filename: fileStem(journey) });
      downloadFile(dataUrl, fileStem(journey), format);
      toast.success(`${format.toUpperCase()} exported`);
    } catch {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  // Promote a pain or opportunity to the backlog as a candidate, with provenance.
  const promoteCell = async (stage: JourneyStage, rowKey: JourneyRowKey) => {
    if (!isArtifact || !projectId || !artifactId) {
      toast.info('Save this journey map to a project first, then you can send pains and opportunities to the backlog.');
      return;
    }
    const text = stage[rowKey].trim();
    if (!text) { toast.info('Nothing to promote in this cell yet.'); return; }
    try {
      const { data: maxPos } = await supabase
        .from('backlog_items')
        .select('backlog_position')
        .eq('project_id', projectId)
        .order('backlog_position', { ascending: false })
        .limit(1);
      const position = (maxPos?.[0]?.backlog_position ?? -1) + 1;
      const source = `From Journey Map: ${journey.personaName || 'persona'} / ${stage.name || 'stage'} (${rowKey})`;
      const { data: item, error } = await supabase
        .from('backlog_items')
        .insert({
          project_id: projectId,
          title: text.length > 120 ? `${text.slice(0, 117)}...` : text,
          description: text,
          source,
          backlog_position: position,
          created_by: user?.id ?? null,
        })
        .select('id')
        .single();
      if (error) throw error;
      // Provenance is best-effort: the item exists, so a link failure must not
      // report failure and prompt a duplicate promote.
      const { error: linkErr } = await supabase.from('project_artifact_links').insert({
        project_id: projectId,
        from_type: 'journey-map',
        from_id: `${artifactId}#stage:${stage.id}:${rowKey}`,
        to_type: 'backlog_item',
        to_id: item.id,
        link_kind: 'derived_from',
        created_by: user?.id ?? null,
      });
      if (linkErr) console.error('Promoted, but provenance link failed:', linkErr.message);
      toast.success('Sent to the backlog as a candidate');
    } catch {
      toast.error('Could not send to the backlog. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        .exporting .jm-no-export { display: none !important; }
        .jm-export-only { display: none; }
        .exporting .jm-edit { display: none !important; }
        .exporting .jm-export-only { display: block !important; }
      `}</style>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {!isArtifact && (
          <Button size="sm" onClick={handleSaveToProject}><Save className="mr-1.5 h-4 w-4" /> Save to Project</Button>
        )}
        {isArtifact && saveStatus !== 'idle' && (
          <span className="text-xs text-muted-foreground">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save failed'}
          </span>
        )}
        {!isArtifact && (
          <>
            <Button variant="outline" size="sm" onClick={() => { if (confirmReplace(journeyHasContent(journey))) setJourney(exampleJourneyMap()); }}><Sparkles className="mr-1.5 h-4 w-4" /> Load Example</Button>
            <Button variant="outline" size="sm" onClick={() => { if (confirmReplace(journeyHasContent(journey))) setJourney(emptyJourneyMap()); }}><RotateCcw className="mr-1.5 h-4 w-4" /> New journey</Button>
          </>
        )}
        <div className="mx-1 h-6 w-px bg-border" />
        <Button variant="outline" size="sm" onClick={() => handleExportImage('png')}><Image className="mr-1.5 h-4 w-4" /> PNG</Button>
        <Button variant="outline" size="sm" onClick={() => handleExportImage('pdf')}><FileText className="mr-1.5 h-4 w-4" /> PDF</Button>
        <Button variant="outline" size="sm" onClick={handleExportJson}><FileJson className="mr-1.5 h-4 w-4" /> JSON</Button>
        <Button variant="outline" size="sm" onClick={handleExportMarkdown}><FileText className="mr-1.5 h-4 w-4" /> Markdown</Button>
      </div>

      <p className="text-sm italic" style={{ color: TEAL }}>{JOURNEY_STRETCH}</p>

      <div ref={diagramRef} className="rounded-lg border border-border bg-white p-5">
        {/* Persona anchor */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-bold tracking-wide" style={{ color: TEAL }}>PERSONA</span>
          <input
            value={journey.personaName}
            placeholder="Whose journey is this?"
            onChange={(e) => setJourney((j) => ({ ...j, personaName: e.target.value }))}
            className="jm-edit flex-1 bg-transparent text-sm font-semibold text-slate-900 placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <span className="jm-export-only flex-1 text-sm font-semibold text-slate-900">{journey.personaName}</span>
        </div>

        {/* Grid: stages across, rows down */}
        <div className="overflow-x-auto">
          <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
            {journey.stages.map((stage) => (
              <div key={stage.id} className="w-64 shrink-0 rounded-md border border-border">
                <div className="flex items-center gap-1 rounded-t-md p-2 text-white" style={{ backgroundColor: TEAL }}>
                  <input
                    value={stage.name}
                    placeholder="Stage..."
                    onChange={(e) => setStageField(stage.id, 'name', e.target.value)}
                    className="jm-edit min-w-0 flex-1 bg-transparent text-sm font-semibold text-white placeholder:text-white/50 focus:outline-none"
                  />
                  <span className="jm-export-only min-w-0 flex-1 text-sm font-semibold text-white">{stage.name}</span>
                  <button aria-label="Remove stage" className="jm-no-export text-white/70 hover:text-white" onClick={() => removeStage(stage.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2 p-2">
                  {JOURNEY_ROWS.map((row) => {
                    const cellKey = `${stage.id}:${row.key}`;
                    return (
                      <div key={row.key} className="rounded border border-border/70 p-2">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11px] font-bold tracking-wide" style={{ color: row.color }}>{row.label}</span>
                          <div className="jm-no-export flex items-center gap-1.5">
                            {row.promotable && (
                              <button
                                className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                                title="Send to the backlog as a candidate"
                                onClick={() => promoteCell(stage, row.key)}
                              >
                                <ArrowUpRight className="h-3 w-3" /> Promote
                              </button>
                            )}
                            <button
                              className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                              onClick={() => setCoachFor((c) => (c === cellKey ? null : cellKey))}
                            >
                              <MessageCircle className="h-3 w-3" /> {coachFor === cellKey ? 'Hide' : 'Coach'}
                            </button>
                          </div>
                        </div>
                        <AutoTextarea
                          value={stage[row.key]}
                          placeholder={row.question}
                          onChange={(e) => setStageField(stage.id, row.key, e.target.value)}
                          rows={2}
                          className="jm-edit w-full resize-none overflow-hidden bg-transparent text-sm text-slate-900 placeholder:text-muted-foreground/60 focus:outline-none"
                        />
                        <div className="jm-export-only whitespace-pre-wrap text-sm text-slate-900">{stage[row.key]}</div>
                        {coachFor === cellKey && (
                          <div className="jm-no-export mt-2">
                            <CoachChat
                              tool="journey-map"
                              cell={{ tag: row.label.toUpperCase(), question: row.question, stretch: JOURNEY_STRETCH }}
                              onAccept={(text) => { setStageField(stage.id, row.key, text); setCoachFor(null); }}
                              onClose={() => setCoachFor(null)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              className="jm-no-export flex w-44 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-sm text-muted-foreground hover:bg-accent/40"
              onClick={addStage}
            >
              <Plus className="h-5 w-5" /> Add stage
            </button>
          </div>
        </div>
      </div>

      <SaveToProjectDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        artifactType="journey-map"
        artifactName={journey.personaName ? `${journey.personaName} journey` : 'Journey Map'}
        artifactDescription={journey.personaName || 'Journey Map'}
        artifactData={journey}
        preselectedProjectId={preselectedProjectId || undefined}
        onSaveComplete={handleSaveComplete}
      />
    </div>
  );
}
