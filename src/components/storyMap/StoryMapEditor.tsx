import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sparkles, RotateCcw, Save, Image, FileText, FileJson, MessageCircle,
  Plus, Trash2, ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectArtifactMutations } from '@/hooks/useProjectArtifacts';
import { validateArtifactData } from '@/types/artifacts/schemas';
import { useDebouncedCallback } from 'use-debounce';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import { CoachChat } from '@/components/coaching/CoachChat';
import { AutoTextarea } from '@/components/coaching/AutoTextarea';
import { confirmReplace } from '@/utils/confirmDiscard';
import {
  StoryMap,
  Activity,
  StoryCard,
  Release,
  STORY_MAP_STRETCH,
  CARD_COACH,
  emptyStoryMap,
  exampleStoryMap,
  newActivity,
  newCard,
  newRelease,
  parseStoryMap,
  storyMapHasContent,
} from '@/types/storyMap';
import { toJson, toMarkdown, fileStem, downloadText } from '@/utils/storyMap/exportStoryMap';
import { exportCanvas, downloadFile } from '@/utils/canvas/canvasExporter';

const STORAGE_KEY = 'storyMap.v1';
const TEAL = '#004D4D';
const UNSCHEDULED = 'Unscheduled';

const loadInitial = (): StoryMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = parseStoryMap(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    /* ignore */
  }
  return exampleStoryMap();
};

interface StoryMapEditorProps {
  initialData?: StoryMap;
  artifactId?: string;
  projectId?: string;
}

export function StoryMapEditor({ initialData, artifactId, projectId }: StoryMapEditorProps = {}) {
  const isArtifact = Boolean(artifactId && projectId);
  const [map, setMap] = useState<StoryMap>(() =>
    initialData ? parseStoryMap(initialData) ?? emptyStoryMap() : loadInitial(),
  );
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [coachFor, setCoachFor] = useState<string | null>(null); // cardId
  const [pushing, setPushing] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId');
  const { updateArtifact } = useProjectArtifactMutations();

  // ── Mutators ────────────────────────────────────────────────────────────────
  const setActivityName = (id: string, name: string) =>
    setMap((m) => ({ ...m, activities: m.activities.map((a) => (a.id === id ? { ...a, name } : a)) }));
  const addActivity = () => setMap((m) => ({ ...m, activities: [...m.activities, newActivity()] }));
  const removeActivity = (id: string) =>
    setMap((m) => ({ ...m, activities: m.activities.length > 1 ? m.activities.filter((a) => a.id !== id) : m.activities }));

  const setReleaseName = (id: string, name: string) =>
    setMap((m) => ({ ...m, releases: m.releases.map((r) => (r.id === id ? { ...r, name } : r)) }));
  const addRelease = () => setMap((m) => ({ ...m, releases: [...m.releases, newRelease(`Release ${m.releases.length + 1}`)] }));
  const removeRelease = (id: string) =>
    setMap((m) => ({
      ...m,
      releases: m.releases.filter((r) => r.id !== id),
      // Cards in the removed release fall back to Unscheduled rather than vanish.
      activities: m.activities.map((a) => ({
        ...a,
        cards: a.cards.map((c) => (c.releaseId === id ? { ...c, releaseId: null } : c)),
      })),
    }));

  const addCard = (activityId: string, releaseId: string | null) =>
    setMap((m) => ({
      ...m,
      activities: m.activities.map((a) => (a.id === activityId ? { ...a, cards: [...a.cards, newCard(releaseId)] } : a)),
    }));
  const setCardTitle = (activityId: string, cardId: string, title: string) =>
    setMap((m) => ({
      ...m,
      activities: m.activities.map((a) =>
        a.id === activityId ? { ...a, cards: a.cards.map((c) => (c.id === cardId ? { ...c, title } : c)) } : a,
      ),
    }));
  const setCardRelease = (activityId: string, cardId: string, releaseId: string | null) =>
    setMap((m) => ({
      ...m,
      activities: m.activities.map((a) =>
        a.id === activityId ? { ...a, cards: a.cards.map((c) => (c.id === cardId ? { ...c, releaseId } : c)) } : a,
      ),
    }));
  const removeCard = (activityId: string, cardId: string) =>
    setMap((m) => ({
      ...m,
      activities: m.activities.map((a) =>
        a.id === activityId ? { ...a, cards: a.cards.filter((c) => c.id !== cardId) } : a,
      ),
    }));

  // ── Persistence ──────────────────────────────────────────────────────────────
  const performArtifactSave = useDebouncedCallback(async (m: StoryMap) => {
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

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isArtifact) {
      if (storyMapHasContent(map)) performArtifactSave(map);
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, toJson(map));
      } catch {
        /* ignore */
      }
    }
    // Intentionally runs on map changes only; isArtifact/performArtifactSave are stable.
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveToProject = () => {
    if (!user) {
      toast.error('Please sign in to save to an initiative');
      navigate('/auth');
      return;
    }
    setSaveDialogOpen(true);
  };
  const handleSaveComplete = (projId: string) => {
    toast.success('Story map saved to initiative');
    navigate(`/projects/${projId}`);
  };

  // ── Exports ──────────────────────────────────────────────────────────────────
  const handleExportJson = () => { downloadText(toJson(map), `${fileStem(map)}.json`, 'application/json'); toast.success('JSON exported'); };
  const handleExportMarkdown = () => { downloadText(toMarkdown(map), `${fileStem(map)}.md`, 'text/markdown'); toast.success('Markdown exported'); };
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

  // ── Push to Backlog (one-way, with provenance) ───────────────────────────────
  // Each activity becomes an epic; each titled card a story under it, carrying
  // its release as target_release so the backlog's Story Map view (6.13) renders
  // the same shape. Not a two-way sync: this seeds the backlog, then they diverge.
  const releaseName = (id: string | null): string =>
    id ? (map.releases.find((r) => r.id === id)?.name || UNSCHEDULED) : UNSCHEDULED;

  const pushToBacklog = async () => {
    if (!isArtifact || !projectId || !artifactId) {
      toast.info('Save this story map to an initiative first, then you can push it to the backlog.');
      return;
    }
    const activities = map.activities.filter((a) => a.cards.some((c) => c.title.trim()));
    const cardCount = activities.reduce((n, a) => n + a.cards.filter((c) => c.title.trim()).length, 0);
    if (cardCount === 0) {
      toast.info('Add some story cards first, then push them to the backlog.');
      return;
    }
    if (!confirmReplace(true, `Push ${cardCount} ${cardCount === 1 ? 'story' : 'stories'} across ${activities.length} ${activities.length === 1 ? 'activity' : 'activities'} to the backlog? This adds new items; it does not update ones you pushed before.`)) {
      return;
    }
    // Handoff contract: surface drift before it feeds the backlog (graceful).
    const contract = validateArtifactData('story-map', map);
    if (!contract.valid) console.warn('[artifact-contract] story-map -> backlog handoff does not match schema:', contract.issues);

    setPushing(true);
    try {
      const { data: maxPos } = await supabase
        .from('backlog_items')
        .select('backlog_position')
        .eq('project_id', projectId)
        .order('backlog_position', { ascending: false })
        .limit(1);
      let position = (maxPos?.[0]?.backlog_position ?? -1) + 1;

      const links: Array<{ from_id: string; to_id: string }> = [];
      let created = 0;

      for (const activity of activities) {
        const cards = activity.cards.filter((c) => c.title.trim());
        // Epic for the activity (the backbone column).
        const { data: epic, error: epicErr } = await supabase
          .from('backlog_items')
          .insert({
            project_id: projectId,
            title: (activity.name || 'Activity').slice(0, 120),
            item_type: 'epic',
            source: `From Story Map: ${map.productGoal ? `${map.productGoal.slice(0, 60)} / ` : ''}${activity.name || 'activity'}`,
            backlog_position: position++,
            created_by: user?.id ?? null,
          })
          .select('id')
          .single();
        if (epicErr) throw epicErr;
        links.push({ from_id: `${artifactId}#activity:${activity.id}`, to_id: epic.id });

        for (const card of cards) {
          const text = card.title.trim();
          const { data: story, error: storyErr } = await supabase
            .from('backlog_items')
            .insert({
              project_id: projectId,
              title: text.length > 120 ? `${text.slice(0, 117)}...` : text,
              description: text,
              item_type: 'story',
              parent_item_id: epic.id,
              target_release: card.releaseId ? releaseName(card.releaseId) : null,
              source: `From Story Map: ${activity.name || 'activity'}`,
              backlog_position: position++,
              created_by: user?.id ?? null,
            })
            .select('id')
            .single();
          if (storyErr) throw storyErr;
          links.push({ from_id: `${artifactId}#card:${card.id}`, to_id: story.id });
          created++;
        }
      }

      // Provenance is best-effort: the items exist, so a link failure must not
      // report failure and prompt a duplicate push.
      const { error: linkErr } = await supabase.from('project_artifact_links').insert(
        links.map((l) => ({
          project_id: projectId,
          from_type: 'story-map',
          from_id: l.from_id,
          to_type: 'backlog_item',
          to_id: l.to_id,
          link_kind: 'derived_from',
          created_by: user?.id ?? null,
        })),
      );
      if (linkErr) console.error('Pushed, but provenance links failed:', linkErr.message);
      toast.success(`Pushed ${created} ${created === 1 ? 'story' : 'stories'} to the backlog`);
    } catch {
      toast.error('Could not push to the backlog. Please try again.');
    } finally {
      setPushing(false);
    }
  };

  // Rows: each release, then an Unscheduled row for cards not yet sliced.
  const rows: Array<Release | { id: null; name: string }> = [...map.releases, { id: null, name: UNSCHEDULED }];
  const cellCards = (activity: Activity, releaseId: string | null): StoryCard[] =>
    activity.cards.filter((c) => c.releaseId === releaseId);

  return (
    <div className="space-y-6">
      <style>{`
        .exporting .sm-no-export { display: none !important; }
        .sm-export-only { display: none; }
        .exporting .sm-edit { display: none !important; }
        .exporting .sm-export-only { display: block !important; }
      `}</style>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {!isArtifact && (
          <Button size="sm" onClick={handleSaveToProject}><Save className="mr-1.5 h-4 w-4" /> Save to Initiative</Button>
        )}
        {isArtifact && (
          <Button size="sm" disabled={pushing} onClick={pushToBacklog}>
            <ArrowUpRight className="mr-1.5 h-4 w-4" /> {pushing ? 'Pushing...' : 'Push to Backlog'}
          </Button>
        )}
        {isArtifact && saveStatus !== 'idle' && (
          <span className="text-xs text-muted-foreground">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save failed'}
          </span>
        )}
        {!isArtifact && (
          <>
            <Button variant="outline" size="sm" onClick={() => { if (confirmReplace(storyMapHasContent(map))) setMap(exampleStoryMap()); }}><Sparkles className="mr-1.5 h-4 w-4" /> Load Example</Button>
            <Button variant="outline" size="sm" onClick={() => { if (confirmReplace(storyMapHasContent(map))) setMap(emptyStoryMap()); }}><RotateCcw className="mr-1.5 h-4 w-4" /> New map</Button>
          </>
        )}
        <div className="mx-1 h-6 w-px bg-border" />
        <Button variant="outline" size="sm" onClick={() => handleExportImage('png')}><Image className="mr-1.5 h-4 w-4" /> PNG</Button>
        <Button variant="outline" size="sm" onClick={() => handleExportImage('pdf')}><FileText className="mr-1.5 h-4 w-4" /> PDF</Button>
        <Button variant="outline" size="sm" onClick={handleExportJson}><FileJson className="mr-1.5 h-4 w-4" /> JSON</Button>
        <Button variant="outline" size="sm" onClick={handleExportMarkdown}><FileText className="mr-1.5 h-4 w-4" /> Markdown</Button>
      </div>

      <p className="text-sm italic" style={{ color: TEAL }}>{STORY_MAP_STRETCH}</p>

      <div ref={diagramRef} className="rounded-lg border border-border bg-white p-5">
        {/* Product goal anchor */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-bold tracking-wide" style={{ color: TEAL }}>PRODUCT GOAL</span>
          <input
            value={map.productGoal}
            placeholder="What is this product for?"
            onChange={(e) => setMap((m) => ({ ...m, productGoal: e.target.value }))}
            className="sm-edit flex-1 bg-transparent text-sm font-semibold text-slate-900 placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <span className="sm-export-only flex-1 text-sm font-semibold text-slate-900">{map.productGoal}</span>
        </div>

        <div className="overflow-x-auto">
          <div style={{ minWidth: 'min-content' }}>
            {/* Backbone: activity columns */}
            <div className="flex gap-3">
              {map.activities.map((activity) => (
                <div key={activity.id} className="flex w-64 shrink-0 items-center gap-1 rounded-md p-2 text-white" style={{ backgroundColor: TEAL }}>
                  <input
                    value={activity.name}
                    placeholder="Activity..."
                    onChange={(e) => setActivityName(activity.id, e.target.value)}
                    className="sm-edit min-w-0 flex-1 bg-transparent text-sm font-semibold text-white placeholder:text-white/50 focus:outline-none"
                  />
                  <span className="sm-export-only min-w-0 flex-1 text-sm font-semibold text-white">{activity.name}</span>
                  <button aria-label="Remove activity" className="sm-no-export text-white/70 hover:text-white" onClick={() => removeActivity(activity.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                className="sm-no-export flex w-44 shrink-0 items-center justify-center gap-1 rounded-md border border-dashed border-border p-2 text-sm text-muted-foreground hover:bg-accent/40"
                onClick={addActivity}
              >
                <Plus className="h-4 w-4" /> Add activity
              </button>
            </div>

            {/* Release slices (rows), each with a cell per activity */}
            {rows.map((row) => (
              <div key={row.id ?? UNSCHEDULED} className="mt-3">
                <div className="mb-1 flex items-center gap-2">
                  {row.id === null ? (
                    <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{UNSCHEDULED}</span>
                  ) : (
                    <>
                      <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#E08A4E' }}>Release</span>
                      <input
                        value={row.name}
                        placeholder="Release name..."
                        onChange={(e) => setReleaseName(row.id!, e.target.value)}
                        className="sm-edit min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 placeholder:text-muted-foreground/60 focus:outline-none"
                      />
                      <span className="sm-export-only text-sm font-semibold text-slate-900">{row.name}</span>
                      <button aria-label="Remove release" className="sm-no-export text-muted-foreground hover:text-foreground" onClick={() => removeRelease(row.id!)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex gap-3 rounded-md border border-dashed border-border/70 p-2">
                  {map.activities.map((activity) => (
                    <div key={activity.id} className="w-64 shrink-0 space-y-2">
                      {cellCards(activity, row.id).map((card) => (
                        <div key={card.id} className="rounded border border-border bg-card p-2">
                          <div className="mb-1 flex items-center justify-end gap-1.5">
                            <button
                              className="sm-no-export flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                              onClick={() => setCoachFor((c) => (c === card.id ? null : card.id))}
                            >
                              <MessageCircle className="h-3 w-3" /> {coachFor === card.id ? 'Hide' : 'Coach'}
                            </button>
                            <button aria-label="Remove card" className="sm-no-export text-muted-foreground hover:text-foreground" onClick={() => removeCard(activity.id, card.id)}>
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <AutoTextarea
                            value={card.title}
                            placeholder="A small thing the user can do..."
                            onChange={(e) => setCardTitle(activity.id, card.id, e.target.value)}
                            rows={2}
                            className="sm-edit w-full resize-none overflow-hidden bg-transparent text-sm text-slate-900 placeholder:text-muted-foreground/60 focus:outline-none"
                          />
                          <div className="sm-export-only whitespace-pre-wrap text-sm text-slate-900">{card.title}</div>
                          {map.releases.length > 0 && (
                            <select
                              value={card.releaseId ?? ''}
                              onChange={(e) => setCardRelease(activity.id, card.id, e.target.value || null)}
                              className="sm-no-export mt-1.5 w-full rounded border border-border bg-transparent text-[11px] text-muted-foreground focus:outline-none"
                            >
                              <option value="">{UNSCHEDULED}</option>
                              {map.releases.map((r) => (
                                <option key={r.id} value={r.id}>{r.name || 'Release'}</option>
                              ))}
                            </select>
                          )}
                          {coachFor === card.id && (
                            <div className="sm-no-export mt-2">
                              <CoachChat
                                tool="story-map"
                                cell={{ tag: CARD_COACH.tag, question: CARD_COACH.question, stretch: CARD_COACH.stretch }}
                                onAccept={(text) => { setCardTitle(activity.id, card.id, text); setCoachFor(null); }}
                                onClose={() => setCoachFor(null)}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        className="sm-no-export flex w-full items-center justify-center gap-1 rounded border border-dashed border-border py-1 text-[11px] text-muted-foreground hover:bg-accent/40"
                        onClick={() => addCard(activity.id, row.id)}
                      >
                        <Plus className="h-3 w-3" /> Add story
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              className="sm-no-export mt-3 flex items-center gap-1 rounded-md border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/40"
              onClick={addRelease}
            >
              <Plus className="h-4 w-4" /> Add release
            </button>
          </div>
        </div>
      </div>

      <SaveToProjectDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        artifactType="story-map"
        artifactName={map.productGoal ? `${map.productGoal.slice(0, 60)} story map` : 'Story Map'}
        artifactDescription={map.productGoal || 'User Story Map'}
        artifactData={map}
        preselectedProjectId={preselectedProjectId || undefined}
        onSaveComplete={handleSaveComplete}
      />
    </div>
  );
}
