import { useState } from 'react';
import type { BacklogItem } from './types';
import {
  renderDesign, isDesignDone, presetFor, GRID_W,
  EXHIBIT_PARTS, AMENITY_COLORS, FLORA_TYPES, FLORA_COLORS, SWATCHES, type ItemDesign,
} from './design';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Copy } from 'lucide-react';

/** A built design you can copy as a starting point (e.g. an existing lion). */
export interface CopySource { id: string; name: string; design: ItemDesign }

interface DesignStudioProps {
  item: BacklogItem;
  /** The product-wide Definition of Done - confirmed here to make an item Done, and
   *  refined at the Retro so an edit changes the bar for every later item. */
  dod: string[];
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
function EnclosurePreview({ item, design }: { item: BacklogItem; design: ItemDesign }) {
  const dims = { small: { w: 132, h: 92 }, medium: { w: 176, h: 118 }, large: { w: 220, h: 146 } }[item.enclosureSize ?? 'medium'];
  return (
    <div className="relative overflow-hidden rounded-lg" aria-hidden
      style={{ width: dims.w, height: dims.h, background: design.colors.ground ?? '#cbb78d', border: `4px solid ${design.colors.fence ?? '#9a7b4f'}` }}>
      <div className="absolute inset-x-0 bottom-0" style={{ height: '30%', background: 'rgba(0,0,0,.06)' }} />
      {design.parts.water === 'on' && (
        <div className="absolute" style={{ bottom: '14%', right: '12%', width: '40%', height: '32%', borderRadius: 999, background: design.colors.water ?? '#5aa9c8', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.3)' }} />
      )}
    </div>
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
export function DesignStudio({ item, dod, editing, onFinish, onCancel, initial, onChange, copySources = [], onSetEnclosure }: DesignStudioProps) {
  const isExhibit = item.category === 'exhibit';
  const isEnclosure = item.category === 'enclosure';
  const isFlora = item.category === 'flora';
  const cell = Math.floor(232 / GRID_W);
  const [design, setDesign] = useState<ItemDesign>(initial ?? item.design ?? presetFor(item));

  const commit = (next: ItemDesign) => { setDesign(next); onChange?.(next); };
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

  // The product-wide Definition of Done also gates Done. Criteria that just restate the
  // acceptance criteria or "fully finished" auto-satisfy from what is already checked; the
  // genuinely new ones (safe, signposted, peer-reviewed, ...) are self-certified. Reading
  // the live DoD means an edit at the Retro changes the bar for every later item.
  const dodAuto = (c: string): 'ac' | 'build' | null => {
    const s = c.toLowerCase();
    if (/acceptance crit/.test(s)) return 'ac';
    if (/finish|built|gap|patch|complete|no gaps/.test(s)) return 'build';
    return null;
  };
  const [dodConfirmed, setDodConfirmed] = useState<Set<number>>(() => new Set(editing ? dod.map((_, i) => i) : []));
  const toggleDod = (i: number) => setDodConfirmed((prev) => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  const dodMet = (c: string, i: number) => { const a = dodAuto(c); return a === 'ac' ? acAll : a === 'build' ? built : dodConfirmed.has(i); };
  const done = built && acAll && dod.every(dodMet);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">{editing ? 'Edit' : 'Design'} your {item.name.toLowerCase()}</h3>
          <p className="text-[11px] text-muted-foreground">{item.zone} · {item.category} · {item.estimate} pts · {isEnclosure ? 'build the habitat first, then add animals' : isExhibit ? 'one animal, one PBI' : isFlora ? 'pick a plant and colour it' : 'set the colours and add a sign'}</p>
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

      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        {/* Live preview */}
        <div className="flex items-start justify-center rounded-md bg-gradient-to-b from-sky-100/50 to-emerald-50/40 p-3 dark:from-sky-950/30 dark:to-emerald-950/20">
          {isEnclosure ? <EnclosurePreview item={item} design={design} /> : <Preview item={item} design={design} cell={cell} />}
        </div>

        {/* Controls */}
        {isEnclosure ? (
          <div className="space-y-3">
            <ColourPickerRow label="Ground" value={design.colors.ground} onChange={(hex) => setColor('ground', hex)} />
            <ColourPickerRow label="Fence" value={design.colors.fence} onChange={(hex) => setColor('fence', hex)} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={design.parts.water === 'on'} onChange={(e) => setPart('water', e.target.checked ? 'on' : 'off')} />
              Add a water feature
            </label>
            {design.parts.water === 'on' && (
              <ColourPickerRow label="Water" value={design.colors.water} onChange={(hex) => setColor('water', hex)} />
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
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Plant type</span>
              <div className="flex flex-wrap gap-1.5">
                {FLORA_TYPES.map((o) => (
                  <button key={o} type="button" onClick={() => setPart('type', o)}
                    className={cn('rounded-full border px-2.5 py-0.5 text-xs capitalize', (design.parts.type ?? 'tree') === o ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40')}>{o}</button>
                ))}
              </div>
            </div>
            {FLORA_COLORS.map((c) => (
              <ColourPickerRow key={c.key} label={c.label} value={design.colors[c.key]} onChange={(hex) => setColor(c.key, hex)} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
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

        {/* Definition of Done: the product-wide bar, confirmed to make the item Done. */}
        {dod.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-baseline gap-x-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Definition of Done <span className="font-normal normal-case tracking-normal text-muted-foreground/70">the team&rsquo;s standing bar for every item</span>
            </div>
            <ul className="space-y-1">
              {dod.map((c, i) => {
                const auto = dodAuto(c);
                const on = dodMet(c, i);
                return (
                  <li key={i}>
                    <button type="button" disabled={!!auto} onClick={() => toggleDod(i)}
                      className={cn('flex w-full items-center gap-2 text-left text-sm', auto && 'cursor-default')}>
                      <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]', on ? 'bg-emerald-500 text-white' : 'border border-border')}>{on && <Check className="h-3 w-3" />}</span>
                      <span className={cn(on ? 'text-foreground' : 'text-muted-foreground')}>{c}</span>
                      {auto && <span className="text-[10px] text-muted-foreground/60">· {auto === 'ac' ? 'from acceptance criteria' : 'built above'}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="text-[11px] text-muted-foreground/70">Confirm the product-wide bar too - it applies to every item and is refined at the Retrospective.</p>
          </div>
        )}

        {isExhibit && <p className="text-[11px] text-muted-foreground">Your choices shape who values this most - families like it bright and lively, comfort seekers calm and muted, enthusiasts a distinctive, well finished animal.</p>}
      </div>

      <div className="mt-3 flex justify-end">
        <Button size="sm" disabled={!done} onClick={() => onFinish(design)}>{editing ? 'Save changes' : 'Finish the build'}</Button>
      </div>
    </div>
  );
}
