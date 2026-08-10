import { useState, useEffect, type PointerEvent as ReactPointerEvent } from 'react';
import type { BacklogItem } from './types';
import {
  renderDesign, isDesignDone, designSatisfiesTask, presetFor, GRID_W, ENCLOSURE_SHAPES,
  enclosureWater, defaultWater, enclosureFlora, defaultFlora, EXHIBIT_PARTS, AMENITY_COLORS, FLORA_TYPES, floraColors, isLandscapeType, BUILDING_TYPES, PATH_WIDTHS, pathWidthPx, SWATCHES,
  type ItemDesign, type WaterFeature, type EnclosureFlora,
} from './design';
import { EnclosureBox, FloraSprite } from './ParkView';
import { TaskChecklist } from './Board';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Copy } from 'lucide-react';

/** A built design you can copy as a starting point (e.g. an existing lion). */
export interface CopySource { id: string; name: string; design: ItemDesign }

interface DesignStudioProps {
  item: BacklogItem;
  /** True when refining an already-built item rather than building a new one. */
  editing?: boolean;
  onFinish: (design: ItemDesign) => void;
  onCancel: () => void;
  /** In-progress work to resume (kept by the board so it survives the day ending). */
  initial?: ItemDesign;
  /** Report the working design up so it is not lost when the studio unmounts. */
  onChange?: (design: ItemDesign) => void;
  /** Other built things of the same kind, to copy from to save time. */
  copySources?: CopySource[];
  /** For exhibits: set the enclosure/habitat size. The animal is rendered to scale in the
   *  park, so a bigger enclosure shows a small group in a larger space. */
  onSetEnclosure?: (size: 'small' | 'medium' | 'large') => void;
  /** Tick the plan's tasks off here as you build, so it isn't a separate step on the board. */
  onToggleTask?: (id: string, taskId: string) => void;
}

/** Live preview of an assembled design at a given cell size. */
function Preview({ item, design, cell }: { item: BacklogItem; design: ItemDesign; cell: number }) {
  const grid = renderDesign(item, design);
  return (
    <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${GRID_W}, ${cell}px)` }} aria-hidden>
      {grid.flatMap((row, r) => row.map((color, c) => (
        <span key={`${r}-${c}`} style={{ width: cell, height: cell, background: color ?? 'transparent' }} />
      )))}
    </div>
  );
}

/** Live preview of an enclosure: the habitat box at its chosen footprint, with the
 *  ground, fence and optional water feature the team is building. */
const clampF = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Live, editable enclosure: the habitat in its shape, with water features you can drag to move
 *  and resize by their corner (and remove on hover). Positions are fractions of the box. */
function EnclosurePreview({ item, design, onSetWater, onSetFlora }: { item: BacklogItem; design: ItemDesign; onSetWater: (w: WaterFeature[]) => void; onSetFlora: (f: EnclosureFlora[]) => void }) {
  const dims = { small: { w: 132, h: 92 }, medium: { w: 176, h: 118 }, large: { w: 220, h: 146 } }[item.enclosureSize ?? 'medium'];
  const water = enclosureWater(design);
  const flora = enclosureFlora(design);
  const drag = (i: number, mode: 'move' | 'resize') => (e: ReactPointerEvent) => {
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, orig = water[i];
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - sx) / dims.w, dy = (ev.clientY - sy) / dims.h;
      onSetWater(water.map((w, j) => j !== i ? w : mode === 'move'
        ? { ...w, x: clampF(orig.x + dx, 0, 1 - orig.w), y: clampF(orig.y + dy, 0, 1 - orig.h) }
        : { ...w, w: clampF(orig.w + dx, 0.08, 1 - orig.x), h: clampF(orig.h + dy, 0.08, 1 - orig.y) }));
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  // Planting works like water: drag the plant to move it, drag its corner to scale it.
  const dragFlora = (i: number, mode: 'move' | 'resize') => (e: ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, orig = flora[i];
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - sx) / dims.w, dy = (ev.clientY - sy) / dims.h;
      onSetFlora(flora.map((f, j) => j !== i ? f : mode === 'move'
        ? { ...f, x: clampF(orig.x + dx, 0.05, 0.95), y: clampF(orig.y + dy, 0.08, 0.95) }
        : { ...f, s: clampF(orig.s + (dx + dy) * 1.5, 0.5, 2.6) }));
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  return (
    <EnclosureBox shape={design.parts.shape ?? 'rounded'} w={dims.w} h={dims.h} ground={design.colors.ground ?? '#cbb78d'} fence={design.colors.fence ?? '#9a7b4f'} border={4}>
      {water.map((wf, i) => (
        <div key={i} className="group absolute" style={{ left: `${wf.x * 100}%`, top: `${wf.y * 100}%`, width: `${wf.w * 100}%`, height: `${wf.h * 100}%`, touchAction: 'none' }}>
          <div onPointerDown={drag(i, 'move')} className="h-full w-full cursor-grab rounded-full active:cursor-grabbing"
            style={{ background: design.colors.water ?? '#5aa9c8', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.3)' }} />
          <button type="button" aria-label="Remove water feature" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onSetWater(water.filter((_, j) => j !== i)); }}
            className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-white text-[11px] font-bold leading-none text-red-600 shadow group-hover:flex">&times;</button>
          <div onPointerDown={drag(i, 'resize')} className="absolute -bottom-0.5 -right-0.5 hidden h-3 w-3 cursor-nwse-resize rounded-full border-2 border-sky-600 bg-white group-hover:block" />
        </div>
      ))}
      {flora.map((fl, i) => (
        <div key={`fl-${i}`} className="group absolute" style={{ left: `${fl.x * 100}%`, top: `${fl.y * 100}%`, transform: 'translate(-50%,-50%)', touchAction: 'none' }}>
          <div onPointerDown={dragFlora(i, 'move')} className="cursor-grab active:cursor-grabbing" style={{ transform: `scale(${fl.s})`, transformOrigin: 'center' }}>
            <FloraSprite type={fl.type} foliage={design.colors.foliage} trunk={design.colors.trunk} cell={2} />
          </div>
          <button type="button" aria-label="Remove planting" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onSetFlora(flora.filter((_, j) => j !== i)); }}
            className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-white text-[11px] font-bold leading-none text-red-600 shadow group-hover:flex">&times;</button>
          <div onPointerDown={dragFlora(i, 'resize')} className="absolute -bottom-1 -right-1 hidden h-3 w-3 cursor-nwse-resize rounded-full border-2 border-emerald-600 bg-white group-hover:block" />
        </div>
      ))}
    </EnclosureBox>
  );
}

/** A colour control: a native picker (fully editable) plus quick-pick swatches. */
function ColourPickerRow({ label, value, onChange, disabled }: { label: string; value?: string; onChange: (hex: string) => void; disabled?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', disabled && 'opacity-40')}>
      <span className="w-24 shrink-0 text-xs text-muted-foreground">{label}</span>
      <input type="color" value={value ?? '#cccccc'} disabled={disabled} onChange={(e) => onChange(e.target.value)}
        className="h-7 w-9 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5 disabled:cursor-not-allowed" aria-label={`${label} colour`} />
      <div className="flex flex-wrap gap-1">
        {SWATCHES.map((s) => (
          <button key={s} type="button" disabled={disabled} title={s} onClick={() => onChange(s)}
            className={cn('h-5 w-5 rounded-sm border', value?.toLowerCase() === s ? 'border-foreground' : 'border-border/60')} style={{ background: s }} />
        ))}
      </div>
    </div>
  );
}

/** Build (or refine) one item: an exhibit's animal or an amenity's building. Every
 *  animal is its own PBI; to save time you can copy an existing built animal and
 *  tweak it. It is Done when it meets its acceptance criteria. */
export function DesignStudio({ item, editing, onFinish, onCancel, initial, onChange, copySources = [], onSetEnclosure, onToggleTask }: DesignStudioProps) {
  const isExhibit = item.category === 'exhibit';
  const isEnclosure = item.category === 'enclosure';
  const isFlora = item.category === 'flora';
  const isPath = item.category === 'path';
  const cell = Math.floor(232 / GRID_W);
  const [design, setDesign] = useState<ItemDesign>(initial ?? item.design ?? presetFor(item));
  // A landscape feature (river, pond, car park...) is scenery you colour here and size on the park -
  // not a plant you pick, so the flora "type" grid and "foliage/trunk" labels do not fit it.
  const isLand = isFlora && isLandscapeType(design.parts.type ?? item.template);

  const commit = (next: ItemDesign) => { setDesign(next); onChange?.(next); };
  const setWater = (w: WaterFeature[]) => commit({ ...design, water: w });
  const setFlora = (f: EnclosureFlora[]) => commit({ ...design, flora: f });
  const addFlora = (type: string) => setFlora([...enclosureFlora(design), defaultFlora(type, enclosureFlora(design).length)]);
  const setPart = (key: string, opt: string) => commit({ ...design, parts: { ...design.parts, [key]: opt } });
  const setColor = (key: string, hex: string) => commit({ ...design, colors: { ...design.colors, [key]: hex } });
  const copyFrom = (src: CopySource) => commit({ parts: { ...src.design.parts }, colors: { ...src.design.colors } });

  // Acceptance criteria are the Product Owner's, carried on the PBI. Building is you
  // accepting the work against them, so you confirm each (a judgement, like a lion
  // being "recognisable"). Already-built items being refined start fully confirmed.
  const acceptance = item.acceptance ?? [];
  const [confirmed, setConfirmed] = useState<Set<number>>(() => new Set(editing ? acceptance.map((_, i) => i) : []));
  const toggleAc = (i: number) => setConfirmed((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });
  const built = isDesignDone(item, design);
  const acAll = acceptance.every((_, i) => confirmed.has(i));

  // Tick the plan off automatically as the work is done, so it isn't a second set of boxes to
  // check for what you just did: build steps tick as you design; "get the PO's sign-off" ticks
  // once every acceptance criterion is met (accepting the ACs IS the PO's sign-off). Peer review
  // stays a manual tick. Only ticks forward; a custom task with no match stays manual.
  useEffect(() => {
    if (!onToggleTask) return;
    for (const t of item.tasks ?? []) {
      if (!t.label.trim()) continue;
      if (/sign[- ]?off/i.test(t.label)) {
        // The PO's sign-off IS accepting the acceptance criteria, so mirror them both ways.
        if (acAll !== t.done) onToggleTask(item.id, t.id);
      } else if (!t.done && designSatisfiesTask(item, design, t.label)) {
        onToggleTask(item.id, t.id);
      }
    }
  }, [design, item, onToggleTask, acAll]);

  // The plan reflects the Definition of Done - the work to take this item to Done: build it to
  // its acceptance criteria, then the standing workflow steps (peer review, PO sign-off). So
  // finishing means it is built, it meets the acceptance criteria, and its whole plan is ticked.
  // The DoD itself lives in the header as the standing reference; the plan is how you meet it.
  const planTasks = (item.tasks ?? []).filter((t) => t.label.trim());
  const planDone = planTasks.every((t) => t.done);
  const done = built && acAll && planDone;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">{editing ? 'Edit' : 'Design'} your {item.name.toLowerCase()}</h3>
          <p className="text-[11px] text-muted-foreground">{item.zone} · {item.category} · {item.estimate} pts · {isEnclosure ? 'build the habitat first, then add animals' : isExhibit ? 'one animal, one PBI' : isLand ? 'colour it, then size it on the Park' : isFlora ? 'pick a plant and colour it' : isPath ? 'drawn on the Park when you deploy it' : 'set the colours and add a sign'}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>Back</Button>
      </div>

      {copySources.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border bg-muted/20 px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><Copy className="mr-1 inline h-3 w-3" />Start from a copy</span>
          {copySources.map((s) => (
            <button key={s.id} type="button" onClick={() => copyFrom(s)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs hover:border-primary/60">
              <Preview item={item} design={s.design} cell={3} /> {s.name}
            </button>
          ))}
        </div>
      )}

      {isEnclosure && onSetEnclosure && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border bg-muted/20 px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Footprint</span>
          {(['small', 'medium', 'large'] as const).map((size) => {
            const on = (item.enclosureSize ?? 'medium') === size;
            return (
              <button key={size} type="button" onClick={() => onSetEnclosure(size)}
                className={cn('rounded-full border px-2.5 py-0.5 text-xs capitalize', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40')}>{size}</button>
            );
          })}
          <span className="text-[11px] text-muted-foreground/70">A bigger habitat holds more animals - each one is drawn to scale inside it.</span>
        </div>
      )}

      {isEnclosure && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border bg-muted/20 px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Shape</span>
          {ENCLOSURE_SHAPES.map((s) => {
            const on = (design.parts.shape ?? 'rounded') === s.key;
            return (
              <button key={s.key} type="button" onClick={() => setPart('shape', s.key)}
                className={cn('rounded-full border px-2.5 py-0.5 text-xs', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40')}>{s.label}</button>
            );
          })}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        {/* Live preview */}
        <div className="flex min-h-[120px] items-center justify-center rounded-md bg-gradient-to-b from-sky-100/50 to-emerald-50/40 p-3 dark:from-sky-950/30 dark:to-emerald-950/20">
          {isEnclosure ? <EnclosurePreview item={item} design={design} onSetWater={setWater} onSetFlora={setFlora} />
            : isPath ? (
              <div className="flex w-full max-w-[240px] flex-col items-center gap-2">
                <svg width="200" height="70" aria-hidden>
                  <polyline points="8,58 60,20 140,50 192,14" fill="none" stroke="rgba(0,0,0,.28)" strokeWidth={pathWidthPx(design.parts.thickness) + 3} strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="8,58 60,20 140,50 192,14" fill="none" stroke={design.colors.path ?? '#c9a86a'} strokeWidth={pathWidthPx(design.parts.thickness)} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-center text-[11px] text-muted-foreground">You draw the route on the Park when you deploy it.</span>
              </div>
            )
            : <Preview item={item} design={design} cell={cell} />}
        </div>

        {/* Controls */}
        {isEnclosure ? (
          <div className="space-y-3">
            <ColourPickerRow label="Ground" value={design.colors.ground} onChange={(hex) => setColor('ground', hex)} />
            <ColourPickerRow label="Fence" value={design.colors.fence} onChange={(hex) => setColor('fence', hex)} />
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setWater([...enclosureWater(design), defaultWater(enclosureWater(design).length)])}
                className="rounded-full border border-primary/50 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/10">+ Add water feature</button>
              <span className="text-[11px] text-muted-foreground/70">Drag to move, drag the corner to resize, hover for &times;.</span>
            </div>
            {enclosureWater(design).length > 0 && (
              <ColourPickerRow label="Water" value={design.colors.water} onChange={(hex) => setColor('water', hex)} />
            )}
            <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Planting</span>
              {FLORA_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => addFlora(t)}
                  className="rounded-full border border-emerald-600/50 bg-emerald-600/5 px-2.5 py-0.5 text-xs font-medium capitalize text-emerald-700 hover:bg-emerald-600/10 dark:text-emerald-400">+ {t}</button>
              ))}
            </div>
            {enclosureFlora(design).length > 0 && (
              <>
                <span className="block text-[11px] text-muted-foreground/70">Drag a plant to move it, drag its corner to resize, hover for &times;.</span>
                <ColourPickerRow label="Foliage" value={design.colors.foliage} onChange={(hex) => setColor('foliage', hex)} />
                <ColourPickerRow label="Trunk / bed" value={design.colors.trunk} onChange={(hex) => setColor('trunk', hex)} />
              </>
            )}
          </div>
        ) : isExhibit ? (
          <div className="space-y-3">
            {EXHIBIT_PARTS.map((p) => {
              const opt = design.parts[p.key] ?? p.options[0];
              return (
                <div key={p.key} className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="w-24 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{p.label}</span>
                    {p.options.map((o) => (
                      <button key={o} type="button" onClick={() => setPart(p.key, o)}
                        className={cn('rounded-full border px-2.5 py-0.5 text-xs capitalize', opt === o ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40')}>{o}</button>
                    ))}
                  </div>
                  <ColourPickerRow label={`${p.label} colour`} value={design.colors[p.colorKey]} onChange={(hex) => setColor(p.colorKey, hex)} disabled={opt === 'none'} />
                </div>
              );
            })}
          </div>
        ) : isFlora ? (
          <div className="space-y-3">
            {isLand ? (
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border bg-muted/20 px-3 py-2">
                <span className="rounded-full border border-primary bg-primary px-2.5 py-0.5 text-xs capitalize text-primary-foreground">{design.parts.type ?? item.template}</span>
                <span className="text-[11px] text-muted-foreground/70">{(design.parts.type ?? item.template) === 'river'
                  ? 'Colour it here. On the Park it flows the full width - drag it up or down to place it, and drag its edge to set how wide it is.'
                  : 'Colour it here, then drag it on the Park to set how far it runs and how wide it is.'}</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Type</span>
                <div className="flex flex-wrap gap-1.5">
                  {FLORA_TYPES.map((o) => (
                    <button key={o} type="button" onClick={() => setPart('type', o)}
                      className={cn('rounded-full border px-2.5 py-0.5 text-xs capitalize', (design.parts.type ?? 'tree') === o ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40')}>{o}</button>
                  ))}
                </div>
              </div>
            )}
            {floraColors(design.parts.type ?? item.template).map((c) => (
              <ColourPickerRow key={c.key} label={c.label} value={design.colors[c.key]} onChange={(hex) => setColor(c.key, hex)} />
            ))}
          </div>
        ) : isPath ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Width</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {PATH_WIDTHS.map((w) => (
                  <button key={w.key} type="button" onClick={() => setPart('thickness', w.key)} aria-pressed={(design.parts.thickness ?? 'medium') === w.key}
                    className={cn('flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs', (design.parts.thickness ?? 'medium') === w.key ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40')}>
                    <span className="rounded-full bg-foreground" style={{ width: 18, height: Math.max(2, w.px / 2) }} /> {w.label}
                  </button>
                ))}
              </div>
            </div>
            <ColourPickerRow label="Path colour" value={design.colors.path} onChange={(hex) => setColor('path', hex)} />
            <p className="rounded-md border border-dashed border-border bg-muted/20 p-2 text-[11px] text-muted-foreground">The route itself is drawn on the Park when you <b>Place &amp; open</b> this - the width and colour you set here are what it lays.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Building</span>
              <div className="flex flex-wrap gap-1.5">
                {BUILDING_TYPES.map((o) => (
                  <button key={o} type="button" onClick={() => setPart('type', o)}
                    className={cn('rounded-full border px-2.5 py-0.5 text-xs capitalize', (design.parts.type ?? 'shop') === o ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40')}>{o}</button>
                ))}
              </div>
            </div>
            {AMENITY_COLORS.map((c) => (
              <ColourPickerRow key={c.key} label={c.label} value={design.colors[c.key]}
                onChange={(hex) => commit({ ...design, colors: { ...design.colors, [c.key]: hex }, parts: c.key === 'sign' ? { ...design.parts, sign: 'on' } : design.parts })} />
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={design.parts.sign === 'on'} onChange={(e) => setPart('sign', e.target.checked ? 'on' : 'off')} />
              Put up a sign
            </label>
          </div>
        )}
      </div>

      {/* Acceptance criteria: the PBI's own, confirmed by you as you accept the work. */}
      <div className="mt-4 space-y-3">
        {/* The plan reflects the Definition of Done: build steps tick themselves as you design;
            the workflow steps (peer review, PO sign-off) you tick when you have done them. The
            item is Done when the whole plan is ticked. */}
        {onToggleTask && (item.tasks ?? []).some((t) => t.label.trim()) && (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-baseline gap-x-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Plan <span className="font-normal normal-case tracking-normal text-muted-foreground/70">how this item meets the Definition of Done</span>
            </div>
            <TaskChecklist item={item} onToggle={onToggleTask} />
          </div>
        )}

        {acceptance.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-baseline gap-x-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Acceptance criteria <span className="font-normal normal-case tracking-normal text-muted-foreground/70">from the Product Backlog</span>
            </div>
            <ul className="space-y-1">
              {acceptance.map((c, i) => {
                const on = confirmed.has(i);
                return (
                  <li key={i}>
                    <button type="button" onClick={() => toggleAc(i)} className="flex w-full items-center gap-2 text-left text-sm">
                      <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]', on ? 'bg-emerald-500 text-white' : 'border border-border')}>{on && <Check className="h-3 w-3" />}</span>
                      <span className={cn(on ? 'text-foreground' : 'text-muted-foreground')}>{c}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="text-[11px] text-muted-foreground/70">Tick each once your build meets it - this is you accepting the work against the Product Owner's criteria.</p>
          </div>
        )}

        {isExhibit && <p className="text-[11px] text-muted-foreground">Your choices shape who values this most - families like it bright and lively, comfort seekers calm and muted, enthusiasts a distinctive, well finished animal.</p>}
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        {/* A close within reach of the primary action - the top "Back" scrolls out of view. */}
        <Button variant="outline" size="sm" onClick={onCancel}>Close</Button>
        <Button size="sm" disabled={!done} onClick={() => onFinish(design)}>{editing ? 'Save changes' : 'Finish the build'}</Button>
      </div>
    </div>
  );
}
