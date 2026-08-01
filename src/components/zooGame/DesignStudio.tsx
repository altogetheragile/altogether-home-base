import { useState } from 'react';
import type { BacklogItem } from './types';
import {
  renderDesign, designCriteria, isDesignDone, presetFor, GRID_W,
  EXHIBIT_PARTS, AMENITY_COLORS, SWATCHES, type ItemDesign,
} from './design';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface DesignStudioProps {
  item: BacklogItem;
  onFinish: (design: ItemDesign) => void;
  onCancel: () => void;
}

/** Live preview of the assembled design at a given cell size. */
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

/** A colour control: a native picker (fully editable) plus quick-pick swatches. The
 *  swatch row also lets the player set a colour on a part that has none yet. */
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

/** Build an item by assembling and colouring it. Exhibits are a creature kit; a
 *  species is a preset you refine. It is Done when it meets its acceptance criteria.
 *  The choices shape who values it, so how you build it is a real product decision. */
export function DesignStudio({ item, onFinish, onCancel }: DesignStudioProps) {
  const [design, setDesign] = useState<ItemDesign>(item.design ?? presetFor(item));
  const isExhibit = item.category === 'exhibit';
  const cell = Math.floor(232 / GRID_W);
  const criteria = designCriteria(item, design);
  const done = isDesignDone(item, design);

  const setPart = (key: string, opt: string) => setDesign((d) => ({ ...d, parts: { ...d.parts, [key]: opt } }));
  const setColor = (key: string, hex: string) => setDesign((d) => ({ ...d, colors: { ...d.colors, [key]: hex } }));

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Design your {item.name.toLowerCase()}</h3>
          <p className="text-[11px] text-muted-foreground">{item.zone} · {item.category} · {item.estimate} pts · {isExhibit ? 'a starting shape you refine and colour' : 'set the colours and add a sign'}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>Back</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        {/* Live preview */}
        <div className="flex items-start justify-center rounded-md bg-gradient-to-b from-sky-100/50 to-emerald-50/40 p-3 dark:from-sky-950/30 dark:to-emerald-950/20">
          <Preview item={item} design={design} cell={cell} />
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {isExhibit ? (
            EXHIBIT_PARTS.map((p) => {
              const opt = design.parts[p.key] ?? p.options[0];
              const noColour = opt === 'none';
              return (
                <div key={p.key} className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="w-24 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{p.label}</span>
                    {p.options.map((o) => (
                      <button key={o} type="button" onClick={() => setPart(p.key, o)}
                        className={cn('rounded-full border px-2.5 py-0.5 text-xs capitalize', opt === o ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40')}>{o}</button>
                    ))}
                  </div>
                  <ColourPickerRow label={`${p.label} colour`} value={design.colors[p.colorKey]} onChange={(hex) => setColor(p.colorKey, hex)} disabled={noColour} />
                </div>
              );
            })
          ) : (
            <>
              {AMENITY_COLORS.map((c) => (
                <ColourPickerRow key={c.key} label={c.label} value={design.colors[c.key]}
                  onChange={(hex) => { setColor(c.key, hex); if (c.key === 'sign') setPart('sign', 'on'); }} />
              ))}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={design.parts.sign === 'on'} onChange={(e) => setPart('sign', e.target.checked ? 'on' : 'off')} />
                Put up a sign
              </label>
            </>
          )}
        </div>
      </div>

      {/* Acceptance criteria */}
      <div className="mt-4 space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Acceptance criteria</div>
        <ul className="space-y-1">
          {criteria.map((x) => (
            <li key={x.label} className={cn('flex items-center gap-2 text-sm', x.pass ? 'text-foreground' : 'text-muted-foreground')}>
              <span className={cn('flex h-4 w-4 items-center justify-center rounded-full text-[10px]', x.pass ? 'bg-emerald-500 text-white' : 'border border-border')}>{x.pass ? <Check className="h-3 w-3" /> : ''}</span>
              {x.label}
            </li>
          ))}
        </ul>
        {isExhibit && <p className="pt-1 text-[11px] text-muted-foreground">Your choices shape who values this most - families like it bright and lively, comfort seekers like it calm and muted, enthusiasts like a distinctive, well finished animal.</p>}
      </div>

      <div className="mt-3 flex justify-end">
        <Button size="sm" disabled={!done} onClick={() => onFinish(design)}>Finish and mark Done</Button>
      </div>
    </div>
  );
}
