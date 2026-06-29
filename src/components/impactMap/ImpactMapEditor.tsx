import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Trash2, Download, Upload, FileJson, FileText, Image, Sparkles, RotateCcw, Save, Loader2, ListPlus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CoachChat } from '@/components/coaching/CoachChat';
import { useAuth } from '@/contexts/AuthContext';
import { useSendToBacklog } from '@/hooks/useSendToBacklog';
import { validateArtifactData } from '@/types/artifacts/schemas';
import { useProjectArtifactMutations } from '@/hooks/useProjectArtifacts';
import { useDebouncedCallback } from 'use-debounce';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import { SendToBacklogDialog } from './SendToBacklogDialog';
import {
  ImpactMap,
  Actor,
  Impact,
  LEVEL_META,
  emptyImpactMap,
  exampleImpactMap,
  newActor,
  newImpact,
  newDeliverable,
  parseImpactMap,
} from '@/types/impactMap';
import { toFreeMind, toOpml, toMarkdown, toJson, downloadText, fileStem } from '@/utils/impactMap/exportImpactMap';
import { exportCanvas, downloadFile } from '@/utils/canvas/canvasExporter';

const STORAGE_KEY = 'impactMap.v1';

const loadInitial = (): ImpactMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = parseImpactMap(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return exampleImpactMap();
};

interface ImpactMapEditorProps {
  /** When opened from a saved project artifact, the stored map. */
  initialData?: ImpactMap;
  /** Present in artifact mode: autosaves back to this artifact instead of localStorage. */
  artifactId?: string;
  projectId?: string;
}

export function ImpactMapEditor({ initialData, artifactId, projectId }: ImpactMapEditorProps = {}) {
  const isArtifact = Boolean(artifactId && projectId);
  const [map, setMap] = useState<ImpactMap>(() =>
    initialData ? parseImpactMap(initialData) ?? emptyImpactMap() : loadInitial(),
  );
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [coachGoalOpen, setCoachGoalOpen] = useState(false);
  const [backlogDialogOpen, setBacklogDialogOpen] = useState(false);
  const [pendingDeliverables, setPendingDeliverables] = useState<{ nodeId: string; title: string; description?: string }[]>([]);
  const diagramRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId');
  const { updateArtifact } = useProjectArtifactMutations();
  const sendToBacklog = useSendToBacklog();

  // Send to Backlog is only available once the map is saved within a project
  // (we need a stable artifact id + project id to record provenance).
  const canSendToBacklog = Boolean(artifactId && projectId);

  // Sending opens a dialog to pick (or create) the target product backlog; the
  // chosen backlog is then passed to the mutation.
  const handleSendToBacklog = (deliverables: { nodeId: string; title: string; description?: string }[]) => {
    const items = deliverables.filter((d) => d.title.trim().length > 0);
    if (!canSendToBacklog) {
      toast.error('Save this map to a project first, then send deliverables to its backlog.');
      return;
    }
    if (items.length === 0) {
      toast.info('Add a deliverable before sending to the backlog.');
      return;
    }
    setPendingDeliverables(items);
    setBacklogDialogOpen(true);
  };

  const sendToChosenBacklog = (backlogArtifactId: string) => {
    // Handoff contract: surface drift in this map before it feeds the backlog (graceful).
    const contract = validateArtifactData('impact-map', map);
    if (!contract.valid) console.warn('[artifact-contract] impact-map -> backlog handoff, map does not match schema:', contract.issues);
    sendToBacklog.mutate({
      projectId: projectId!,
      fromArtifactId: artifactId!,
      source: `From Impact Map: ${map.goal || 'Untitled'}`,
      deliverables: pendingDeliverables,
      backlogArtifactId,
    });
  };

  // The impact map encodes a story: actor (who) + deliverable (what) + impact (so that).
  const storyText = (actorLabel: string, deliverableLabel: string, impactLabel: string) =>
    `As ${actorLabel || 'a user'}, I need ${deliverableLabel}${impactLabel ? `, so that ${impactLabel}` : ''}`;

  const allDeliverables = () =>
    map.actors.flatMap((a) =>
      a.impacts.flatMap((i) =>
        i.deliverables.map((d) => ({ nodeId: d.id, title: d.label, description: storyText(a.label, d.label, i.label) })),
      ),
    );

  // Surface a level's stretch question once the user has content at that level.
  const levelHasContent: Record<'goal' | 'actor' | 'impact' | 'deliverable', boolean> = {
    goal: map.goal.trim().length > 0,
    actor: map.actors.length > 0,
    impact: map.actors.some((a) => a.impacts.length > 0),
    deliverable: map.actors.some((a) => a.impacts.some((i) => i.deliverables.length > 0)),
  };

  const performArtifactSave = useDebouncedCallback(async (m: ImpactMap) => {
    if (!artifactId || !projectId) return;
    setSaveStatus('saving');
    try {
      await updateArtifact.mutateAsync({ id: artifactId, updates: { data: { ...m } } });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, 1500);

  // Autosave: to the project artifact when opened from a project, otherwise to localStorage.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isArtifact) {
      performArtifactSave(map);
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, toJson(map));
      } catch {
        /* ignore quota errors */
      }
    }
  }, [map]);

  const handleSaveToProject = () => {
    if (!user) {
      toast.error('Please sign in to save to a project');
      navigate('/auth');
      return;
    }
    setSaveDialogOpen(true);
  };
  const handleSaveComplete = (projId: string) => {
    toast.success('Impact map saved to project');
    navigate(`/projects/${projId}`);
  };

  // ── Immutable update helpers ──────────────────────────────────────────────
  const setGoal = (goal: string) => setMap((m) => ({ ...m, goal }));

  const mapActors = (fn: (actors: Actor[]) => Actor[]) => setMap((m) => ({ ...m, actors: fn(m.actors) }));

  const addActor = () => mapActors((a) => [...a, newActor()]);
  const updateActor = (id: string, label: string) =>
    mapActors((a) => a.map((x) => (x.id === id ? { ...x, label } : x)));
  const deleteActor = (id: string) => mapActors((a) => a.filter((x) => x.id !== id));

  const addImpact = (actorId: string) =>
    mapActors((a) => a.map((x) => (x.id === actorId ? { ...x, impacts: [...x.impacts, newImpact()] } : x)));
  const updateImpact = (actorId: string, impactId: string, label: string) =>
    mapActors((a) =>
      a.map((x) =>
        x.id === actorId
          ? { ...x, impacts: x.impacts.map((i) => (i.id === impactId ? { ...i, label } : i)) }
          : x,
      ),
    );
  const deleteImpact = (actorId: string, impactId: string) =>
    mapActors((a) =>
      a.map((x) => (x.id === actorId ? { ...x, impacts: x.impacts.filter((i) => i.id !== impactId) } : x)),
    );

  const mapImpact = (actorId: string, impactId: string, fn: (i: Impact) => Impact) =>
    mapActors((a) =>
      a.map((x) =>
        x.id === actorId ? { ...x, impacts: x.impacts.map((i) => (i.id === impactId ? fn(i) : i)) } : x,
      ),
    );

  const addDeliverable = (actorId: string, impactId: string) =>
    mapImpact(actorId, impactId, (i) => ({ ...i, deliverables: [...i.deliverables, newDeliverable()] }));
  const updateDeliverable = (actorId: string, impactId: string, delId: string, label: string) =>
    mapImpact(actorId, impactId, (i) => ({
      ...i,
      deliverables: i.deliverables.map((d) => (d.id === delId ? { ...d, label } : d)),
    }));
  const deleteDeliverable = (actorId: string, impactId: string, delId: string) =>
    mapImpact(actorId, impactId, (i) => ({ ...i, deliverables: i.deliverables.filter((d) => d.id !== delId) }));

  // ── AI assist (suggestions) ───────────────────────────────────────────────
  const requireGoal = (): boolean => {
    if (!map.goal.trim()) {
      toast.error('Add a goal first, then let AI suggest.');
      return false;
    }
    return true;
  };

  const suggest = async (
    busyKey: string,
    body: { level: 'actors' | 'impacts' | 'deliverables'; goal: string; actor?: string; impact?: string; existing: string[] },
    apply: (labels: string[]) => void,
  ) => {
    if (!user) {
      toast.error('Please sign in to use AI suggestions');
      navigate('/auth');
      return;
    }
    setAiBusy(busyKey);
    try {
      const { data, error } = await supabase.functions.invoke('generate-impact-map', { body });
      if (error) throw error;
      const suggestions: string[] = Array.isArray(data?.suggestions) ? data.suggestions : [];
      if (suggestions.length === 0) {
        toast.info('No suggestions returned. Try rephrasing the goal.');
        return;
      }
      apply(suggestions);
      toast.success(`Added ${suggestions.length} AI suggestion${suggestions.length === 1 ? '' : 's'}`);
    } catch {
      toast.error('AI suggestion failed. Please try again.');
    } finally {
      setAiBusy(null);
    }
  };

  const suggestActors = () => {
    if (!requireGoal()) return;
    suggest('actors', { level: 'actors', goal: map.goal, existing: map.actors.map((a) => a.label) }, (labels) =>
      mapActors((a) => [...a, ...labels.map((l) => newActor(l))]),
    );
  };
  const suggestImpacts = (actor: Actor) => {
    if (!requireGoal()) return;
    if (!actor.label.trim()) {
      toast.error('Name the actor first.');
      return;
    }
    suggest(
      `impacts-${actor.id}`,
      { level: 'impacts', goal: map.goal, actor: actor.label, existing: actor.impacts.map((i) => i.label) },
      (labels) =>
        mapActors((a) =>
          a.map((x) => (x.id === actor.id ? { ...x, impacts: [...x.impacts, ...labels.map((l) => newImpact(l))] } : x)),
        ),
    );
  };
  const suggestDeliverables = (actor: Actor, impact: Impact) => {
    if (!requireGoal()) return;
    if (!actor.label.trim() || !impact.label.trim()) {
      toast.error('Name the actor and impact first.');
      return;
    }
    suggest(
      `del-${impact.id}`,
      { level: 'deliverables', goal: map.goal, actor: actor.label, impact: impact.label, existing: impact.deliverables.map((d) => d.label) },
      (labels) => mapImpact(actor.id, impact.id, (i) => ({ ...i, deliverables: [...i.deliverables, ...labels.map((l) => newDeliverable(l))] })),
    );
  };

  // ── Export / import ───────────────────────────────────────────────────────
  const handleExportMM = () => {
    downloadText(toFreeMind(map), `${fileStem(map)}.mm`, 'application/x-freemind');
    toast.success('FreeMind .mm exported');
  };
  const handleExportOpml = () => {
    downloadText(toOpml(map), `${fileStem(map)}.opml`, 'text/x-opml');
    toast.success('OPML exported');
  };
  const handleExportJson = () => {
    downloadText(toJson(map), `${fileStem(map)}.json`, 'application/json');
    toast.success('JSON exported');
  };
  const handleExportMarkdown = () => {
    downloadText(toMarkdown(map), `${fileStem(map)}.md`, 'text/markdown');
    toast.success('Markdown exported');
  };
  const handleExportImage = async (format: 'png' | 'pdf') => {
    if (!diagramRef.current) return;
    try {
      toast.info(`Generating ${format.toUpperCase()}...`);
      const dataUrl = await exportCanvas(diagramRef.current, { format, filename: fileStem(map) });
      downloadFile(dataUrl, fileStem(map), format);
      toast.success(`${format.toUpperCase()} exported`);
    } catch {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseImpactMap(JSON.parse(String(reader.result)));
        if (!parsed) throw new Error('invalid');
        setMap(parsed);
        toast.success('Impact map imported');
      } catch {
        toast.error('Could not read that file. Expected an impact map JSON export.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── Node input ──────────────────────────────────────────────────────────
  const nodeInput = (value: string, placeholder: string, onChange: (v: string) => void, color: string) => (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
      style={{ caretColor: color }}
    />
  );

  const levelChip = (level: keyof typeof LEVEL_META) => (
    <span
      className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white"
      style={{ backgroundColor: LEVEL_META[level].color }}
    >
      {LEVEL_META[level].tag}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Hide editing controls during PNG/PDF capture */}
      <style>{`.exporting .impact-no-export { display: none !important; }`}</style>

      {/* Coaching legend */}
      <div className="rounded-lg border border-border bg-muted/40 p-4">
        <h2 className="mb-2 text-lg font-semibold">How Impact Mapping Works</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Build the map from the top down. Start with the goal, add the actors who can help or hinder it,
          describe how their behaviour needs to change, then list what you could deliver to support each change.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {(['goal', 'actor', 'impact', 'deliverable'] as const).map((lvl) => (
            <div key={lvl} className="rounded-md bg-background/60 p-2">
              <div className="flex items-start gap-2">
                {levelChip(lvl)}
                <span className="text-xs text-muted-foreground">{LEVEL_META[lvl].question}</span>
              </div>
              {levelHasContent[lvl] && (
                <p className="mt-1.5 text-xs italic" style={{ color: LEVEL_META[lvl].color }}>
                  {LEVEL_META[lvl].stretch}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

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
        <Button variant="outline" size="sm" onClick={() => setMap(exampleImpactMap())}>
          <Sparkles className="mr-1.5 h-4 w-4" /> Load Example
        </Button>
        <Button variant="outline" size="sm" onClick={() => setMap(emptyImpactMap())}>
          <RotateCcw className="mr-1.5 h-4 w-4" /> Clear
        </Button>
        {canSendToBacklog && (
          <Button
            variant="outline"
            size="sm"
            disabled={sendToBacklog.isPending}
            onClick={() => handleSendToBacklog(allDeliverables())}
          >
            {sendToBacklog.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ListPlus className="mr-1.5 h-4 w-4" />} Send all to Backlog
          </Button>
        )}
        <div className="mx-1 h-6 w-px bg-border" />
        <Button variant="outline" size="sm" onClick={handleExportMM}>
          <Download className="mr-1.5 h-4 w-4" /> FreeMind .mm
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportOpml}>
          <Download className="mr-1.5 h-4 w-4" /> OPML
        </Button>
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
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-1.5 h-4 w-4" /> Import JSON
        </Button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
      </div>

      {/* Diagram (exportable region) */}
      <div ref={diagramRef} className="overflow-x-auto rounded-lg border border-border bg-white p-5">
        {/* Goal (Why) */}
        <div
          className="rounded-lg p-3 text-white"
          style={{ backgroundColor: LEVEL_META.goal.color }}
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wide">
              {LEVEL_META.goal.tag}
            </span>
            <span className="text-xs text-white/80">{LEVEL_META.goal.question}</span>
          </div>
          <input
            value={map.goal}
            placeholder={LEVEL_META.goal.help}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full bg-transparent text-base font-semibold text-white placeholder:text-white/50 focus:outline-none"
          />
          <button
            className="impact-no-export mt-1 flex items-center gap-1 text-xs font-medium text-white/80 hover:text-white"
            onClick={() => setCoachGoalOpen((v) => !v)}
          >
            <MessageCircle className="h-3.5 w-3.5" /> {coachGoalOpen ? 'Hide coach' : 'Ask the coach'}
          </button>
        </div>

        {coachGoalOpen && (
          <div className="impact-no-export mt-3">
            <CoachChat
              tool="impact-map"
              cell={{ tag: LEVEL_META.goal.tag, question: LEVEL_META.goal.question, stretch: LEVEL_META.goal.stretch }}
              onAccept={(text) => { setGoal(text); setCoachGoalOpen(false); }}
              onClose={() => setCoachGoalOpen(false)}
            />
          </div>
        )}

        {/* Actors (Who) */}
        <div className="mt-3 space-y-3 border-l-2 border-dashed pl-4" style={{ borderColor: LEVEL_META.actor.color }}>
          {map.actors.length === 0 && (
            <p className="text-sm text-muted-foreground">No actors yet. Add the first person or role whose behaviour affects the goal.</p>
          )}

          {map.actors.map((actor) => (
            <div key={actor.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-2">
                {levelChip('actor')}
                {nodeInput(actor.label, LEVEL_META.actor.question, (v) => updateActor(actor.id, v), LEVEL_META.actor.color)}
                <button
                  aria-label="Delete actor"
                  className="impact-no-export text-muted-foreground hover:text-destructive"
                  onClick={() => deleteActor(actor.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Impacts (How) */}
              <div className="mt-2 space-y-2 border-l-2 border-dashed pl-4" style={{ borderColor: LEVEL_META.impact.color }}>
                {actor.impacts.map((impact) => (
                  <div key={impact.id} className="rounded-md bg-muted/40 p-2">
                    <div className="flex items-center gap-2">
                      {levelChip('impact')}
                      {nodeInput(impact.label, LEVEL_META.impact.question, (v) => updateImpact(actor.id, impact.id, v), LEVEL_META.impact.color)}
                      <button
                        aria-label="Delete impact"
                        className="impact-no-export text-muted-foreground hover:text-destructive"
                        onClick={() => deleteImpact(actor.id, impact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Deliverables (What) */}
                    <div className="mt-2 space-y-1.5 border-l-2 border-dashed pl-4" style={{ borderColor: LEVEL_META.deliverable.color }}>
                      {impact.deliverables.map((d) => (
                        <div key={d.id} className="flex items-center gap-2 rounded bg-background px-2 py-1">
                          {levelChip('deliverable')}
                          {nodeInput(d.label, LEVEL_META.deliverable.question, (v) => updateDeliverable(actor.id, impact.id, d.id, v), LEVEL_META.deliverable.color)}
                          {canSendToBacklog && (
                            <button
                              aria-label="Send deliverable to backlog"
                              title="Send to backlog"
                              className="impact-no-export text-muted-foreground hover:text-foreground disabled:opacity-50"
                              disabled={sendToBacklog.isPending}
                              onClick={() => handleSendToBacklog([{ nodeId: d.id, title: d.label, description: storyText(actor.label, d.label, impact.label) }])}
                            >
                              <ListPlus className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            aria-label="Delete deliverable"
                            className="impact-no-export text-muted-foreground hover:text-destructive"
                            onClick={() => deleteDeliverable(actor.id, impact.id, d.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="impact-no-export flex flex-wrap items-center gap-3">
                        <button
                          className="flex items-center gap-1 text-xs font-medium hover:underline"
                          style={{ color: LEVEL_META.deliverable.color }}
                          onClick={() => addDeliverable(actor.id, impact.id)}
                        >
                          <Plus className="h-3.5 w-3.5" /> Add deliverable (What)
                        </button>
                        <button
                          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                          disabled={aiBusy !== null}
                          onClick={() => suggestDeliverables(actor, impact)}
                        >
                          {aiBusy === `del-${impact.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Examples
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="impact-no-export flex flex-wrap items-center gap-3">
                  <button
                    className="flex items-center gap-1 text-xs font-medium hover:underline"
                    style={{ color: LEVEL_META.impact.color }}
                    onClick={() => addImpact(actor.id)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add impact (How)
                  </button>
                  <button
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                    disabled={aiBusy !== null}
                    onClick={() => suggestImpacts(actor)}
                  >
                    {aiBusy === `impacts-${actor.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Examples
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="impact-no-export flex flex-wrap items-center gap-3">
            <button
              className="flex items-center gap-1 text-sm font-semibold hover:underline"
              style={{ color: LEVEL_META.actor.color }}
              onClick={addActor}
            >
              <Plus className="h-4 w-4" /> Add actor (Who)
            </button>
            <button
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              disabled={aiBusy !== null}
              onClick={suggestActors}
            >
              {aiBusy === 'actors' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Examples
            </button>
          </div>
        </div>
      </div>

      <SaveToProjectDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        artifactType="impact-map"
        artifactName={map.goal || 'Impact Map'}
        artifactDescription={`${map.actors.length} actor${map.actors.length === 1 ? '' : 's'}`}
        artifactData={map}
        preselectedProjectId={preselectedProjectId || undefined}
        onSaveComplete={handleSaveComplete}
      />
      {canSendToBacklog && projectId && (
        <SendToBacklogDialog
          open={backlogDialogOpen}
          onOpenChange={setBacklogDialogOpen}
          projectId={projectId}
          count={pendingDeliverables.length}
          onConfirm={sendToChosenBacklog}
        />
      )}
    </div>
  );
}
