import { useState } from 'react';
import type { BacklogItem } from './types';
import { templateFor, palettesFor, cellColor, designCriteria, isDesignDone, emptyDesign, type ItemDesign } from './design';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface DesignStudioProps {
  item: BacklogItem;
  onFinish: (design: ItemDesign) => void;
  onCancel: () => void;
}

/** Build an item by designing it: pick a template's finish from curated options.
 *  It is Done when it meets its acceptance criteria. The choices shape visitor
 *  appeal, so how you build it is a real product decision. */
export function DesignStudio({ item, onFinish, onCancel }: DesignStudioProps) {
  const [design, setDesign] = useState<ItemDesign>(item.design ?? emptyDesign());
  const t = templateFor(item);
  const palettes = palettesFor(item);
  const cell = Math.max(16, Math.min(26, Math.floor(240 / t.w)));
  const criteria = designCriteria(item, design);
  const done = isDesignDone(item, design);

  const toggleFeature = (id: string) =>
    setDesign((d) => ({ ...d, features: d.features.includes(id) ? d.features.filter((f) => f !== id) : [...d.features, id] }));

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Design your {item.name.toLowerCase()}</h3>
          <p className="text-[11px] text-muted-foreground">{item.zone} · {item.category} · {item.estimate} pts</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>Back</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        {/* Live preview */}
        <div className="flex items-center justify-center rounded-md bg-muted/40 p-3">
          <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${t.w}, ${cell}px)` }}>
            {t.grid.flatMap((row, r) => row.split('').map((role, c) => {
              const color = cellColor(item, design, role, r, c);
              return <span key={`${r}-${c}`} style={{ width: cell, height: cell, background: color ?? 'transparent' }} />;
            }))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <Opt title="Colour scheme">
            <div className="flex flex-wrap gap-2">
              {palettes.map((p, i) => (
                <button key={p.name} type="button" title={p.name} onClick={() => setDesign((d) => ({ ...d, palette: i }))}
                  className={cn('flex h-8 w-11 overflow-hidden rounded-md border-2', design.palette === i ? 'border-foreground' : 'border-transparent ring-1 ring-border')}>
                  {['primary', 'accent', 'secondary'].filter((k) => p.colors[k]).slice(0, 3).map((k) => <span key={k} className="flex-1" style={{ background: p.colors[k] }} />)}
                </button>
              ))}
            </div>
          </Opt>
          <Opt title="Pattern">
            <div className="flex gap-2">
              {(['none', 'stripes', 'spots'] as const).map((pt) => (
                <button key={pt} type="button" onClick={() => setDesign((d) => ({ ...d, pattern: pt }))}
                  className={cn('rounded-full border px-3 py-1 text-xs', design.pattern === pt ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40')}>{pt}</button>
              ))}
            </div>
          </Opt>
          <Opt title="Features">
            <div className="flex flex-col gap-1.5">
              {t.features.map((f) => {
                const on = design.features.includes(f.id);
                return (
                  <button key={f.id} type="button" onClick={() => toggleFeature(f.id)}
                    className={cn('flex items-center justify-between rounded-md border px-3 py-1.5 text-sm', on ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40')}>
                    {f.label}<span className="font-mono text-[10px]">{on ? 'on' : 'off'}</span>
                  </button>
                );
              })}
            </div>
          </Opt>
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
        <p className="pt-1 text-[11px] text-muted-foreground">Your choices shape who values this most - families like it bright and lively, others like it calm.</p>
      </div>

      <div className="mt-3 flex justify-end">
        <Button size="sm" disabled={!done} onClick={() => onFinish(design)}>Finish and mark Done</Button>
      </div>
    </div>
  );
}

function Opt({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}
