import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Download, Upload, FileJson, FileText, Image, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { toFreeMind, toMarkdown, toJson, downloadText, fileStem } from '@/utils/impactMap/exportImpactMap';
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

export function ImpactMapEditor() {
  const [map, setMap] = useState<ImpactMap>(loadInitial);
  const diagramRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Autosave
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, toJson(map));
    } catch {
      /* ignore quota errors */
    }
  }, [map]);

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

  // ── Export / import ───────────────────────────────────────────────────────
  const handleExportMM = () => {
    downloadText(toFreeMind(map), `${fileStem(map)}.mm`, 'application/x-freemind');
    toast.success('FreeMind .mm exported');
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
            <div key={lvl} className="flex items-start gap-2 rounded-md bg-background/60 p-2">
              {levelChip(lvl)}
              <span className="text-xs text-muted-foreground">{LEVEL_META[lvl].question}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setMap(exampleImpactMap())}>
          <Sparkles className="mr-1.5 h-4 w-4" /> Load Example
        </Button>
        <Button variant="outline" size="sm" onClick={() => setMap(emptyImpactMap())}>
          <RotateCcw className="mr-1.5 h-4 w-4" /> Clear
        </Button>
        <div className="mx-1 h-6 w-px bg-border" />
        <Button variant="outline" size="sm" onClick={handleExportMM}>
          <Download className="mr-1.5 h-4 w-4" /> FreeMind .mm
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
        </div>

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
                          <button
                            aria-label="Delete deliverable"
                            className="impact-no-export text-muted-foreground hover:text-destructive"
                            onClick={() => deleteDeliverable(actor.id, impact.id, d.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        className="impact-no-export flex items-center gap-1 text-xs font-medium hover:underline"
                        style={{ color: LEVEL_META.deliverable.color }}
                        onClick={() => addDeliverable(actor.id, impact.id)}
                      >
                        <Plus className="h-3.5 w-3.5" /> Add deliverable (What)
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  className="impact-no-export flex items-center gap-1 text-xs font-medium hover:underline"
                  style={{ color: LEVEL_META.impact.color }}
                  onClick={() => addImpact(actor.id)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add impact (How)
                </button>
              </div>
            </div>
          ))}

          <button
            className="impact-no-export flex items-center gap-1 text-sm font-semibold hover:underline"
            style={{ color: LEVEL_META.actor.color }}
            onClick={addActor}
          >
            <Plus className="h-4 w-4" /> Add actor (Who)
          </button>
        </div>
      </div>
    </div>
  );
}
