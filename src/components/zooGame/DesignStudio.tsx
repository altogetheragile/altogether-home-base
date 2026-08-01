import { useState } from 'react';
import type { BacklogItem } from './types';
import {
  renderDesign, designCriteria, isDesignDone, presetFor, GRID_W,
  EXHIBIT_PARTS, AMENITY_COLORS, SWATCHES, type ItemDesign,
} from './design';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Plus, X } from 'lucide-react';

export interface BuildResult { design?: ItemDesign; animals?: ItemDesign[] }

interface DesignStudioProps {
  item: BacklogItem;
  onFinish: (result: BuildResult) => void;
  onCancel: () => void;
  /** In-progress work to resume (kept by the board so it survives the day ending). */
  initial?: BuildResult;
  /** Report the working design up so it is not lost when the studio unmounts. */
  onChange?: (result: BuildResult) => void;
}

const MAX_ANIMALS = 5;

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

/** The part + colour controls for one creature. */
function CreatureControls({ design, onChange }: { design: ItemDesign; onChange: (d: ItemDesign) => void }) {
  const setPart = (key: string, opt: string) => onChange({ ...design, parts: { ...design.parts, [key]: opt } });
  const setColor = (key: string, hex: string) => onChange({ ...design, colors: { ...design.colors, [key]: hex } });
  return (
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
  );
}

/** Acceptance-criteria checklist for a design. */
function Criteria({ item, design }: { item: BacklogItem; design: ItemDesign }) {
  return (
    <ul className="space-y-1">
      {designCriteria(item, design).map((x) => (
        <li key={x.label} className={cn('flex items-center gap-2 text-sm', x.pass ? 'text-foreground' : 'text-muted-foreground')}>
          <span className={cn('flex h-4 w-4 items-center justify-center rounded-full text-[10px]', x.pass ? 'bg-emerald-500 text-white' : 'border border-border')}>{x.pass ? <Check className="h-3 w-3" /> : ''}</span>
          {x.label}
        </li>
      ))}
    </ul>
  );
}

/** Build an item by assembling and colouring it. An exhibit is an enclosure you can
 *  fill with several animals (each a creature you refine); an amenity is a building.
 *  It is Done when every part meets its acceptance criteria. */
export function DesignStudio({ item, onFinish, onCancel, initial, onChange }: DesignStudioProps) {
  const isExhibit = item.category === 'exhibit';
  const cell = Math.floor(232 / GRID_W);

  // Exhibit: a list of animals in the enclosure. Amenity: a single building design.
  // Resume from `initial` (draft kept by the board) before the item's built state.
  const [animals, setAnimals] = useState<ItemDesign[]>(initial?.animals ?? item.animals ?? [presetFor(item)]);
  const [sel, setSel] = useState(0);
  const [building, setBuilding] = useState<ItemDesign>(initial?.design ?? item.design ?? presetFor(item));

  const commitAnimals = (next: ItemDesign[]) => { setAnimals(next); onChange?.({ animals: next }); };
  const commitBuilding = (next: ItemDesign) => { setBuilding(next); onChange?.({ design: next }); };

  const selected = animals[Math.min(sel, animals.length - 1)];
  const updateSel = (d: ItemDesign) => commitAnimals(animals.map((x, i) => (i === sel ? d : x)));
  const addAnimal = () => { if (animals.length >= MAX_ANIMALS) return; commitAnimals([...animals, { ...selected, parts: { ...selected.parts }, colors: { ...selected.colors } }]); setSel(animals.length); };
  const removeAnimal = (i: number) => { if (animals.length <= 1) return; commitAnimals(animals.filter((_, j) => j !== i)); setSel((s) => Math.max(0, s > i ? s - 1 : s === i ? Math.min(i, animals.length - 2) : s)); };

  const readyCount = animals.filter((a) => isDesignDone(item, a)).length;
  const exhibitDone = animals.length >= 1 && readyCount === animals.length;
  const amenityDone = isDesignDone(item, building);
  const done = isExhibit ? exhibitDone : amenityDone;
  const finish = () => onFinish(isExhibit ? { animals } : { design: building });

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Design your {item.name.toLowerCase()}</h3>
          <p className="text-[11px] text-muted-foreground">{item.zone} · {item.category} · {item.estimate} pts · {isExhibit ? 'add one or more animals to the enclosure' : 'set the colours and add a sign'}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>Back</Button>
      </div>

      {isExhibit && (
        <div className="mb-3 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Animals in this enclosure ({animals.length})</div>
          <div className="flex flex-wrap items-end gap-2">
            {animals.map((a, i) => (
              <div key={i} className="relative">
                <button type="button" onClick={() => setSel(i)}
                  className={cn('flex items-center justify-center rounded-md border-2 bg-gradient-to-b from-sky-100/50 to-emerald-50/40 p-1 dark:from-sky-950/30 dark:to-emerald-950/20',
                    i === sel ? 'border-primary' : 'border-transparent ring-1 ring-border')}>
                  <Preview item={item} design={a} cell={4} />
                </button>
                <span className={cn('absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full ring-2 ring-card', isDesignDone(item, a) ? 'bg-emerald-500' : 'bg-amber-400')} title={isDesignDone(item, a) ? 'ready' : 'not finished'} />
                {animals.length > 1 && (
                  <button type="button" onClick={() => removeAnimal(i)} aria-label="Remove animal"
                    className="absolute -left-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"><X className="h-2.5 w-2.5" /></button>
                )}
              </div>
            ))}
            {animals.length < MAX_ANIMALS && (
              <button type="button" onClick={addAnimal} className="flex h-[72px] w-14 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border text-[10px] text-muted-foreground hover:border-primary/60 hover:text-foreground">
                <Plus className="h-4 w-4" /> Add
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">Tip: add another animal, then change its body (round, upright, long) for variety - a whole pride in one enclosure.</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        {/* Live preview of the animal / building being edited */}
        <div className="flex items-start justify-center rounded-md bg-gradient-to-b from-sky-100/50 to-emerald-50/40 p-3 dark:from-sky-950/30 dark:to-emerald-950/20">
          <Preview item={item} design={isExhibit ? selected : building} cell={cell} />
        </div>

        {/* Controls */}
        {isExhibit ? (
          <CreatureControls design={selected} onChange={updateSel} />
        ) : (
          <div className="space-y-3">
            {AMENITY_COLORS.map((c) => (
              <ColourPickerRow key={c.key} label={c.label} value={building.colors[c.key]}
                onChange={(hex) => commitBuilding({ ...building, colors: { ...building.colors, [c.key]: hex }, parts: c.key === 'sign' ? { ...building.parts, sign: 'on' } : building.parts })} />
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={building.parts.sign === 'on'} onChange={(e) => commitBuilding({ ...building, parts: { ...building.parts, sign: e.target.checked ? 'on' : 'off' } })} />
              Put up a sign
            </label>
          </div>
        )}
      </div>

      {/* Acceptance criteria (for the selected animal / the building) */}
      <div className="mt-4 space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Acceptance criteria{isExhibit && animals.length > 1 ? ` - animal ${sel + 1} of ${animals.length}` : ''}
        </div>
        <Criteria item={item} design={isExhibit ? selected : building} />
        {isExhibit && <p className="pt-1 text-[11px] text-muted-foreground">{readyCount}/{animals.length} animals ready. Your choices shape who values this most - families like it bright and lively, comfort seekers calm and muted, enthusiasts a distinctive, well finished animal.</p>}
      </div>

      <div className="mt-3 flex items-center justify-end gap-3">
        {isExhibit && !done && <span className="text-[11px] text-amber-600 dark:text-amber-400">Finish every animal to mark the enclosure Done.</span>}
        <Button size="sm" disabled={!done} onClick={finish}>Finish and mark Done</Button>
      </div>
    </div>
  );
}
