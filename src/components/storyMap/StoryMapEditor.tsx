import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sparkles, RotateCcw, Save, Image, FileText, FileJson, MessageCircle,
  Plus, Trash2, ArrowUpRight, ChevronUp, ChevronDown,
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
  MapStory,
  SmallStory,
  STORY_MAP_STRETCH,
  CARD_COACH,
  PRODUCT_GOAL_PROMPT,
  emptyStoryMap,
  exampleStoryMap,
  newBackboneStep,
  newMapStory,
  newSmallStory,
  newSlice,
  nowSlice,
  parseStoryMap,
  storyMapHasContent,
} from '@/types/storyMap';
import { toJson, toMarkdown, fileStem, downloadText } from '@/utils/storyMap/exportStoryMap';
import { exportCanvas, downloadFile } from '@/utils/canvas/canvasExporter';
import { colors } from '@/theme/colors';
import { cn } from '@/lib/utils';

/** A slice's cells sit straight in the map's grid, so the slice itself is only a grouping. */
const SliceRow = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const STORAGE_KEY = 'storyMap.v1';
const TEAL = colors.deepTeal;
const NOT_SLICED = 'Not sliced yet';
/** One column per story; the backbone step above spans its stories' columns. */
const COL = '14rem';

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
  const setStep = (stepId: string, fn: (b: StoryMap['backbone'][number]) => StoryMap['backbone'][number]) =>
    setMap((m) => ({ ...m, backbone: m.backbone.map((b) => (b.id === stepId ? fn(b) : b)) }));
  const setStory = (stepId: string, storyId: string, fn: (s: MapStory) => MapStory) =>
    setStep(stepId, (b) => ({ ...b, stories: b.stories.map((s) => (s.id === storyId ? fn(s) : s)) }));
  const setSmall = (stepId: string, storyId: string, smallId: string, patch: Partial<SmallStory>) =>
    setStory(stepId, storyId, (s) => ({ ...s, smaller: s.smaller.map((c) => (c.id === smallId ? { ...c, ...patch } : c)) }));

  const addStep = () => setMap((m) => ({ ...m, backbone: [...m.backbone, newBackboneStep()] }));
  const removeStep = (id: string) =>
    setMap((m) => ({ ...m, backbone: m.backbone.length > 1 ? m.backbone.filter((b) => b.id !== id) : m.backbone }));
  const addStory = (stepId: string) => setStep(stepId, (b) => ({ ...b, stories: [...b.stories, newMapStory()] }));
  const removeStory = (stepId: string, storyId: string) =>
    setStep(stepId, (b) => ({ ...b, stories: b.stories.length > 1 ? b.stories.filter((s) => s.id !== storyId) : b.stories }));

  const addSmall = (stepId: string, storyId: string, sliceId: string | null) =>
    setStory(stepId, storyId, (s) => ({ ...s, smaller: [...s.smaller, newSmallStory(sliceId)] }));
  const removeSmall = (stepId: string, storyId: string, smallId: string) =>
    setStory(stepId, storyId, (s) => ({ ...s, smaller: s.smaller.filter((c) => c.id !== smallId) }));
  /** Up a column is up in priority: swap with the neighbour in the same slice. */
  const moveSmall = (stepId: string, storyId: string, smallId: string, dir: -1 | 1) =>
    setStory(stepId, storyId, (s) => {
      const me = s.smaller.find((c) => c.id === smallId);
      if (!me) return s;
      const sameSlice = s.smaller.filter((c) => c.sliceId === me.sliceId);
      const other = sameSlice[sameSlice.indexOf(me) + dir];
      if (!other) return s;
      const smaller = [...s.smaller];
      const i = smaller.indexOf(me);
      const j = smaller.indexOf(other);
      [smaller[i], smaller[j]] = [smaller[j], smaller[i]];
      return { ...s, smaller };
    });

  const setSlice = (id: string, patch: { name?: string; productGoal?: string }) =>
    setMap((m) => ({ ...m, slices: m.slices.map((sl) => (sl.id === id ? { ...sl, ...patch } : sl)) }));
  const addSlice = () => setMap((m) => ({ ...m, slices: [...m.slices, newSlice(`Slice ${m.slices.length + 1}`)] }));
  /** When Now is met, Next moves up to become Now. */
  const moveSlice = (id: string, dir: -1 | 1) =>
    setMap((m) => {
      const i = m.slices.findIndex((sl) => sl.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= m.slices.length) return m;
      const slices = [...m.slices];
      [slices[i], slices[j]] = [slices[j], slices[i]];
      return { ...m, slices };
    });
  const removeSlice = (id: string) =>
    setMap((m) => ({
      ...m,
      slices: m.slices.filter((sl) => sl.id !== id),
      // Stories in a removed slice go back to Not sliced yet rather than vanish
      backbone: m.backbone.map((b) => ({
        ...b,
        stories: b.stories.map((s) => ({ ...s, smaller: s.smaller.map((c) => (c.sliceId === id ? { ...c, sliceId: null } : c)) })),
      })),
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

  // ── Send the Now slice to the Backlog (one-way, with provenance) ────────────
  // Only Now goes: it is the current Product Goal, and the rest of the map is the roadmap. Each
  // backbone step becomes an epic, each story a feature under it, each smaller story a story under
  // that, in the map's priority order (the top of every column first: the walking skeleton). Not a
  // two-way sync: this seeds the backlog, then they diverge.
  const pushToBacklog = async () => {
    if (!isArtifact || !projectId || !artifactId) {
      toast.info('Save this story map to an initiative first, then you can send it to the backlog.');
      return;
    }
    const { slice, ordered } = nowSlice(map);
    const label = slice?.name || 'Now';
    if (!slice || ordered.length === 0) {
      toast.info(`Put some smaller stories in the ${label} slice first, then send it to the backlog.`);
      return;
    }
    if (!confirmReplace(true, `Send the ${ordered.length} ${ordered.length === 1 ? 'story' : 'stories'} in ${label} to the backlog? This adds new items; it does not update ones you sent before.`)) {
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
      const made = new Map<string, string>(); // map id -> backlog item id
      const insert = async (row: Record<string, unknown>) => {
        const { data, error } = await supabase
          .from('backlog_items')
          .insert({ project_id: projectId, created_by: user?.id ?? null, backlog_position: position++, ...row } as never)
          .select('id')
          .single();
        if (error) throw error;
        return (data as { id: string }).id;
      };
      const short = (t: string) => (t.length > 120 ? `${t.slice(0, 117)}...` : t);
      const source = `From Story Map: ${label}`;

      let created = 0;
      for (const { step, story, item } of ordered) {
        if (!made.has(step.id)) {
          const id = await insert({ title: short(step.name.trim() || 'Backbone step'), item_type: 'epic', source, target_release: label });
          made.set(step.id, id);
          links.push({ from_id: `${artifactId}#step:${step.id}`, to_id: id });
          // The slice's Product Goal travels with what it sent, for the backlog to show
          links.push({ from_id: `${artifactId}#slice:${slice.id}`, to_id: id });
        }
        if (!made.has(story.id)) {
          const id = await insert({ title: short(story.title.trim() || step.name.trim() || 'Story'), item_type: 'feature', parent_item_id: made.get(step.id), source, target_release: label });
          made.set(story.id, id);
          links.push({ from_id: `${artifactId}#story:${story.id}`, to_id: id });
        }
        const text = item.title.trim();
        const id = await insert({ title: short(text), description: text, item_type: 'story', parent_item_id: made.get(story.id), source, target_release: label });
        links.push({ from_id: `${artifactId}#small:${item.id}`, to_id: id });
        created++;
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
      if (linkErr) console.error('Sent, but provenance links failed:', linkErr.message);
      toast.success(`Sent ${created} ${created === 1 ? 'story' : 'stories'} from ${label} to the backlog`);
    } catch {
      toast.error('Could not send to the backlog. Please try again.');
    } finally {
      setPushing(false);
    }
  };

  const columns = map.backbone.reduce((n, b) => n + Math.max(1, b.stories.length), 0);
  const grid = { display: 'grid', gridTemplateColumns: `repeat(${columns}, ${COL}) auto`, columnGap: '0.75rem' } as const;
  const rows: Array<{ id: string | null; name: string; productGoal?: string; index: number }> = [
    ...map.slices.map((sl, index) => ({ ...sl, index })),
    { id: null, name: NOT_SLICED, index: -1 },
  ];

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
            <ArrowUpRight className="mr-1.5 h-4 w-4" /> {pushing ? 'Sending...' : `Send ${map.slices[0]?.name || 'Now'} to Backlog`}
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
        <div className="overflow-x-auto">
          <div style={grid}>
            {/* BACKBONE: the journey, left to right; each step spans its stories */}
            {map.backbone.map((step) => (
              <div key={step.id} data-tier="backbone"
                style={{ gridColumn: `span ${Math.max(1, step.stories.length)}`, backgroundColor: TEAL }}
                className="flex min-w-0 items-center gap-1 rounded-md">
                  <input
                    value={step.name}
                    placeholder="A step in the journey..."
                    aria-label="Backbone step"
                    onChange={(e) => setStep(step.id, (b) => ({ ...b, name: e.target.value }))}
                    className="sm-edit min-w-0 flex-1 bg-transparent p-2 text-sm font-semibold text-white placeholder:text-white/50 focus:outline-none"
                  />
                  <span className="sm-export-only min-w-0 flex-1 p-2 text-sm font-semibold text-white">{step.name}</span>
                  <button aria-label="Add a story under this step" title="Add a story under this step" className="sm-no-export px-1 text-white/70 hover:text-white" onClick={() => addStory(step.id)}>
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button aria-label="Remove backbone step" className="sm-no-export pr-2 text-white/70 hover:text-white" onClick={() => removeStep(step.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
              </div>
            ))}
            <button
              className="sm-no-export flex w-40 items-center justify-center gap-1 rounded-md border border-dashed border-border p-2 text-sm text-muted-foreground hover:bg-accent/40"
              onClick={addStep}
            >
              <Plus className="h-4 w-4" /> Add step
            </button>

            {/* STORIES: a row under each backbone step */}
            {map.backbone.flatMap((step) => step.stories.map((story) => (
              <div key={story.id} data-tier="story" className="mt-2 flex items-start gap-1 rounded-md border border-amber-300 bg-amber-50 p-2">
                <AutoTextarea
                  value={story.title}
                  placeholder={step.stories.length === 1 && !story.title ? 'Name the story under this step...' : 'A story under this step...'}
                  aria-label="Story"
                  rows={1}
                  onChange={(e) => setStory(step.id, story.id, (st) => ({ ...st, title: e.target.value }))}
                  className="sm-edit min-w-0 flex-1 resize-none overflow-hidden bg-transparent text-sm font-medium text-slate-900 placeholder:text-amber-700/60 focus:outline-none"
                />
                <span className="sm-export-only min-w-0 flex-1 text-sm font-medium text-slate-900">{story.title}</span>
                {step.stories.length > 1 && (
                  <button aria-label="Remove story" className="sm-no-export text-muted-foreground hover:text-foreground" onClick={() => removeStory(step.id, story.id)}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            )))}
            <div />

            {/* SLICES: Now, Next, Later across the smaller stories, each with its Product Goal */}
            {rows.map((row) => (
              <SliceRow key={row.id ?? NOT_SLICED}>
                <div style={{ gridColumn: '1 / -1' }} className={cn('mt-4 flex flex-wrap items-start gap-2 border-t-2 pt-2', row.id === null ? 'border-dashed border-border' : 'border-[#E08A4E]')}>
                  {row.id === null ? (
                    <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{NOT_SLICED}</span>
                  ) : (
                    <>
                      <input
                        value={row.name}
                        placeholder="Slice..."
                        aria-label="Slice name"
                        onChange={(e) => setSlice(row.id!, { name: e.target.value })}
                        className="sm-edit w-24 bg-transparent text-sm font-bold uppercase tracking-wide focus:outline-none"
                        style={{ color: '#E08A4E' }}
                      />
                      <span className="sm-export-only w-24 text-sm font-bold uppercase tracking-wide" style={{ color: '#E08A4E' }}>{row.name}</span>
                      <div className="min-w-[16rem] flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: TEAL }}>Product Goal</span>
                        <AutoTextarea
                          value={row.productGoal ?? ''}
                          placeholder={PRODUCT_GOAL_PROMPT}
                          aria-label={`${row.name || 'Slice'} Product Goal`}
                          rows={1}
                          onChange={(e) => setSlice(row.id!, { productGoal: e.target.value })}
                          className="sm-edit w-full resize-none overflow-hidden bg-transparent text-sm text-slate-900 placeholder:text-muted-foreground/60 focus:outline-none"
                        />
                        <div className="sm-export-only whitespace-pre-wrap text-sm text-slate-900">{row.productGoal}</div>
                      </div>
                      <span className="sm-no-export flex items-center gap-0.5">
                        <button aria-label="Move slice up" disabled={row.index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={() => moveSlice(row.id!, -1)}><ChevronUp className="h-3.5 w-3.5" /></button>
                        <button aria-label="Move slice down" disabled={row.index === map.slices.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={() => moveSlice(row.id!, 1)}><ChevronDown className="h-3.5 w-3.5" /></button>
                        <button aria-label="Remove slice" className="text-muted-foreground hover:text-foreground" onClick={() => removeSlice(row.id!)}><Trash2 className="h-3.5 w-3.5" /></button>
                      </span>
                    </>
                  )}
                </div>

                {/* SMALLER STORIES in this slice, under each story; up the column is up in priority */}
                {map.backbone.flatMap((step) => step.stories.map((story) => {
                  const here = story.smaller.filter((c) => c.sliceId === row.id);
                  return (
                    <div key={story.id} className="mt-2 space-y-2">
                      {here.map((card, i) => (
                        <div key={card.id} data-tier="smaller" className="rounded border border-border bg-card p-2">
                          <div className="mb-1 flex items-center justify-end gap-1.5">
                            <span className="sm-no-export mr-auto flex items-center">
                              <button aria-label="Higher priority" disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={() => moveSmall(step.id, story.id, card.id, -1)}><ChevronUp className="h-3 w-3" /></button>
                              <button aria-label="Lower priority" disabled={i === here.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={() => moveSmall(step.id, story.id, card.id, 1)}><ChevronDown className="h-3 w-3" /></button>
                            </span>
                            <button
                              className="sm-no-export flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                              onClick={() => setCoachFor((c) => (c === card.id ? null : card.id))}
                            >
                              <MessageCircle className="h-3 w-3" /> {coachFor === card.id ? 'Hide' : 'Coach'}
                            </button>
                            <button aria-label="Remove smaller story" className="sm-no-export text-muted-foreground hover:text-foreground" onClick={() => removeSmall(step.id, story.id, card.id)}>
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <AutoTextarea
                            value={card.title}
                            placeholder="A small thing the user can do..."
                            aria-label="Smaller story"
                            onChange={(e) => setSmall(step.id, story.id, card.id, { title: e.target.value })}
                            rows={2}
                            className="sm-edit w-full resize-none overflow-hidden bg-transparent text-sm text-slate-900 placeholder:text-muted-foreground/60 focus:outline-none"
                          />
                          <div className="sm-export-only whitespace-pre-wrap text-sm text-slate-900">{card.title}</div>
                          <select
                            value={card.sliceId ?? ''}
                            aria-label="Slice"
                            onChange={(e) => setSmall(step.id, story.id, card.id, { sliceId: e.target.value || null })}
                            className="sm-no-export mt-1.5 w-full rounded border border-border bg-transparent text-[11px] text-muted-foreground focus:outline-none"
                          >
                            <option value="">{NOT_SLICED}</option>
                            {map.slices.map((sl) => (
                              <option key={sl.id} value={sl.id}>{sl.name || 'Slice'}</option>
                            ))}
                          </select>
                          {coachFor === card.id && (
                            <div className="sm-no-export mt-2">
                              <CoachChat
                                tool="story-map"
                                cell={{ tag: CARD_COACH.tag, question: CARD_COACH.question, stretch: CARD_COACH.stretch }}
                                onAccept={(text) => { setSmall(step.id, story.id, card.id, { title: text }); setCoachFor(null); }}
                                onClose={() => setCoachFor(null)}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        className="sm-no-export flex w-full items-center justify-center gap-1 rounded border border-dashed border-border py-1 text-[11px] text-muted-foreground hover:bg-accent/40"
                        onClick={() => addSmall(step.id, story.id, row.id)}
                      >
                        <Plus className="h-3 w-3" /> Add smaller story
                      </button>
                    </div>
                  );
                }))}
                <div />
              </SliceRow>
            ))}
          </div>

          <button
            className="sm-no-export mt-4 flex items-center gap-1 rounded-md border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/40"
            onClick={addSlice}
          >
            <Plus className="h-4 w-4" /> Add slice
          </button>
        </div>
      </div>

      <SaveToProjectDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        artifactType="story-map"
        artifactName={map.backbone[0]?.name ? `${map.backbone[0].name.slice(0, 60)} story map` : 'Story Map'}
        artifactDescription={map.slices[0]?.productGoal || 'User Story Map'}
        artifactData={map}
        preselectedProjectId={preselectedProjectId || undefined}
        onSaveComplete={handleSaveComplete}
      />
    </div>
  );
}
