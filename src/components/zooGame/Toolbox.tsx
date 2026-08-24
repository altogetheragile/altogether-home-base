import { useState } from 'react';
import type { BacklogItem } from './types';
import { renderDesign, presetFor, GRID_W } from './design';
import { TOOLBOX, type ToolboxItem } from './toolboxItems';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X, Check } from 'lucide-react';
import { ICONS, iconKey } from './itemIcons';
import { AnimalSprite } from './AnimalSprite';
import { Overlay } from './ui/Overlay';
import { hasAnimalArt } from './art/animalArt';
import { SURFACE, PADDING } from './ui/tokens';

/** A small greyscale silhouette of a template's shape (uncoloured - you colour it in
 *  the studio), so users can see what each toolbox piece looks like before picking it. */
function Preview({ item, cell = 3 }: { item: ToolboxItem; cell?: number }) {
  const species = item.template ?? item.name;
  // An illustrated species shows its own drawing: what you are picking is the animal, not a shape
  // to colour in, and the picker should say so.
  if (item.category === 'exhibit' && hasAnimalArt(species)) {
    // Fitted, not scaled: every card is the same size, so the elephant must come down to it rather
    // than spill over the edge of one and take its head off.
    return (
      <div className="flex items-end justify-center" style={{ width: GRID_W * cell, height: 14 * cell }}>
        <AnimalSprite species={species} cell={cell} fit={{ w: GRID_W * cell, h: 14 * cell }} />
      </div>
    );
  }
  const fake = { id: item.template ?? item.name, category: item.category, template: item.template } as BacklogItem;
  const grid = renderDesign(fake, presetFor(fake));
  return (
    <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${GRID_W}, ${cell}px)` }} aria-hidden>
      {grid.flatMap((row, r) => row.map((color, c) => (
        <span key={`${r}-${c}`} style={{ width: cell, height: cell, background: color ?? 'transparent' }} />
      )))}
    </div>
  );
}

/** The Toolbox: a curated palette of predefined pieces to build the zoo from. Picking one
 *  adds it to the Product Backlog (pre-filled), ready to estimate and tailor in the studio. */
export function Toolbox({ onPick, onClose }: { onPick: (item: ToolboxItem) => void; onClose: () => void }) {
  const [added, setAdded] = useState<Record<string, number>>({});
  const pick = (t: ToolboxItem) => { onPick(t); setAdded((a) => ({ ...a, [t.name]: (a[t.name] ?? 0) + 1 })); };

  return (
    <Overlay onClose={onClose} labelledBy="toolbox-title">
      <div className={cn(SURFACE.card, PADDING.roomy, 'm-auto w-full max-w-3xl shadow-xl')}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 id="toolbox-title" className="text-lg font-bold">Toolbox</h3>
            <p className="text-[11px] text-muted-foreground">Pick pieces to build your zoo from - each becomes a Backlog item you estimate, then tailor in the studio.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Done</Button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {TOOLBOX.map((cat) => (
            <section key={cat.group} className="space-y-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{cat.group}</h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {cat.items.map((it) => {
                  const n = added[it.name] ?? 0;
                  return (
                    <button key={it.name} type="button" onClick={() => pick(it)}
                      className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/50">
                        {it.category === 'exhibit'
                          ? <Preview item={it} cell={2} />
                          : it.category === 'enclosure'
                            ? <span className="rounded-sm border-2 border-muted-foreground/50 bg-background" style={{ width: it.footprint === 'large' ? 28 : it.footprint === 'small' ? 15 : 22, height: it.footprint === 'large' ? 20 : it.footprint === 'small' ? 11 : 16 }} />
                          : (() => {
                            // The piece's own icon: a bath for the toilets, a route for a pathway.
                            const Icon = ICONS[iconKey(it)];
                            return <Icon className={cn('h-5 w-5', it.category === 'amenity' ? 'text-muted-foreground' : 'text-emerald-600')} />;
                          })()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{it.name}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{it.category === 'enclosure' ? `${it.footprint} footprint` : it.zone === 'General' ? it.category : it.zone}</span>
                      </span>
                      {n > 0 && <span className={cn('flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300')}><Check className="h-3 w-3" />{n > 1 ? n : ''}</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
          <span className="text-[11px] text-muted-foreground">Added items appear in the Product Backlog, unsized - estimate them, then build.</span>
          <Button size="sm" onClick={onClose}><X className="mr-1 h-3.5 w-3.5" /> Close toolbox</Button>
        </div>
      </div>
    </Overlay>
  );
}
