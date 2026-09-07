import { useState } from 'react';
import type { ZooGameState, BacklogItem } from './types';
import { addFloraTo, addWaterTo, presetFor, PLANTING_TYPES, HABITAT_FEATURE_TYPES, type ItemDesign } from './design';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { FOCUS } from './ui/tokens';
import { Waypoints, Fence, PawPrint, Store, Sprout, Droplets, type LucideIcon } from 'lucide-react';

// The palette: six tools along the foot of the park.
//
// Borrowed from the games where this is settled. A palette, not a menu: every tool the build has is
// on the surface, each a glyph with a word under it, and there is no second level to go looking in.
// Six tools is the whole catalogue - expression lives in what you do with them, not in more of them.
//
// A tool that has nothing to do with what is in your hands is dimmed and says why, rather than
// being hidden: seeing that a habitat has no route to draw is how you learn what a pathway is.

type ToolKey = 'path' | 'habitat' | 'animal' | 'facility' | 'planting' | 'water';

const TOOLS: { key: ToolKey; label: string; icon: LucideIcon; gesture: string }[] = [
  { key: 'path', label: 'Path', icon: Waypoints, gesture: 'draw its route on the park' },
  { key: 'habitat', label: 'Habitat', icon: Fence, gesture: 'pick its footprint' },
  { key: 'animal', label: 'Animal', icon: PawPrint, gesture: 'how many, and which coat' },
  { key: 'facility', label: 'Facility', icon: Store, gesture: 'what kind of building' },
  { key: 'planting', label: 'Planting', icon: Sprout, gesture: 'place trees, bushes and rocks' },
  { key: 'water', label: 'Water', icon: Droplets, gesture: 'a pool inside the habitat' },
];

/** Which tools this item can be built with. A pathway has a route; a habitat has a footprint, water
 *  and planting; an animal has a group and a coat. The rest are somebody else's work. */
function toolsFor(item: BacklogItem): Record<ToolKey, boolean> {
  const c = item.category;
  return {
    path: c === 'path',
    habitat: c === 'enclosure',
    animal: c === 'exhibit',
    facility: c === 'amenity',
    planting: c === 'enclosure' || c === 'flora' || c === 'amenity',
    water: c === 'enclosure' || c === 'flora',
  };
}

export function ParkPalette({ state, item, design, drawing, onDrawing, onDesign, onSetEnclosure, placing, onPlacing, className }: {
  state: ZooGameState;
  item: BacklogItem;
  design?: ItemDesign;
  drawing?: boolean;
  onDrawing?: (on: boolean) => void;
  onDesign: (id: string, design: ItemDesign) => void;
  onSetEnclosure?: (id: string, size: 'small' | 'medium' | 'large') => void;
  /** Whether the thing in hand is following the cursor, waiting to be put down. */
  placing?: boolean;
  onPlacing?: (on: boolean) => void;
  className?: string;
}) {
  const [open, setOpen] = useState<ToolKey | null>(null);
  const can = toolsFor(item);
  const d = design ?? item.design ?? item.draftDesign ?? presetFor(item);
  const hint = placing
    ? 'drop it where it can go - green is room, red is not'
    : TOOLS.find((t) => t.key === (open ?? (drawing ? 'path' : null)))?.gesture;

  const why = (key: ToolKey) => {
    switch (key) {
      case 'path': return `${item.name} has no route to draw - that is a pathway's work.`;
      case 'habitat': return `${item.name} is not a habitat, so it has no footprint to set.`;
      case 'animal': return `${item.name} is not an animal. Animals are stocked into a habitat that is built.`;
      case 'facility': return `${item.name} is not a building.`;
      case 'planting': return `Nothing is planted on ${item.name}.`;
      default: return `${item.name} takes no water.`;
    }
  };

  const press = (key: ToolKey) => {
    // Water is one press: there is nothing to choose, so choosing is not asked for.
    if (key === 'water') { onDesign(item.id, { ...d, water: addWaterTo(d) }); setOpen(null); return; }
    if (key === 'path') { onDrawing?.(!drawing); setOpen(null); return; }
    // A habitat that is not standing anywhere yet is placed before it is sized: pick the tool up and
    // the footprint follows the cursor, green where it can go and red where it cannot.
    if (key === 'habitat' && onPlacing && !item.pos) { onPlacing(!placing); setOpen(null); return; }
    setOpen((cur) => (cur === key ? null : key));
  };

  return (
    <div data-part="park-palette" className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {TOOLS.map((t) => {
        const allowed = can[t.key];
        const on = open === t.key || (t.key === 'path' && !!drawing) || (t.key === 'habitat' && !!placing);
        const Icon = t.icon;
        const button = (
          <button type="button" key={t.key} data-tool={t.key} disabled={!allowed}
            onClick={() => allowed && press(t.key)}
            title={allowed ? `${t.label} - ${t.gesture}` : why(t.key)}
            className={cn(FOCUS, 'flex w-[4.5rem] flex-col items-center gap-0.5 rounded-lg border-2 px-1 py-1.5 transition-colors',
              on ? 'border-primary bg-primary text-primary-foreground'
                : allowed ? 'border-border bg-card hover:border-primary/60'
                  : 'cursor-not-allowed border-dashed border-border/60 bg-muted/30 text-muted-foreground/50')}>
            <Icon className="h-4 w-4" />
            <span className="text-[10px] font-semibold leading-none">{t.label}</span>
          </button>
        );
        if (!allowed || t.key === 'water' || t.key === 'path'
          || (t.key === 'habitat' && onPlacing && !item.pos)) return button;
        return (
          <Popover key={t.key} open={open === t.key} onOpenChange={(o) => setOpen(o ? t.key : null)}>
            <PopoverTrigger asChild>{button}</PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-auto max-w-[22rem] p-2">
              {t.key === 'habitat' && onSetEnclosure && (
                <div className="flex items-center gap-1.5">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button key={size} type="button" onClick={() => onSetEnclosure(item.id, size)}
                      className={cn(FOCUS, 'rounded-md border px-2 py-1 text-xs font-medium capitalize',
                        (item.enclosureSize ?? 'medium') === size ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted/60')}>
                      {size}
                    </button>
                  ))}
                </div>
              )}
              {t.key === 'animal' && (
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {([
                      { label: 'One', group: { males: 1, females: 0, juveniles: 0, cubs: 0 } },
                      { label: 'A pair', group: { males: 1, females: 1, juveniles: 0, cubs: 0 } },
                      { label: 'A family', group: { males: 1, females: 1, juveniles: 1, cubs: 2 } },
                    ] as const).map((g) => (
                      <button key={g.label} type="button" onClick={() => onDesign(item.id, { ...d, group: { ...g.group } })}
                        className={cn(FOCUS, 'rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted/60')}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    A group rather than one animal on its own is one of the criteria - the park checks it.
                  </p>
                </div>
              )}
              {t.key === 'facility' && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {['shop', 'kiosk', 'cafe', 'toilets'].map((kind) => (
                    <button key={kind} type="button" onClick={() => onDesign(item.id, { ...d, parts: { ...d.parts, type: kind } })}
                      className={cn(FOCUS, 'rounded-md border px-2 py-1 text-xs font-medium capitalize',
                        d.parts.type === kind ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted/60')}>
                      {kind}
                    </button>
                  ))}
                </div>
              )}
              {t.key === 'planting' && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {[...PLANTING_TYPES, ...HABITAT_FEATURE_TYPES].map((kind) => (
                    <button key={kind} type="button" onClick={() => onDesign(item.id, { ...d, flora: addFloraTo(d, kind) })}
                      className={cn(FOCUS, 'rounded-md border border-border px-2 py-1 text-xs font-medium capitalize hover:bg-muted/60')}>
                      {kind}
                    </button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
        );
      })}
      {/* What the tool in hand does, said once, where the tools are. */}
      <span className="ml-1 min-w-0 text-[11px] text-muted-foreground">
        {hint ?? `Building ${item.name} · ${state.team.developers.length} Developers on the team`}
      </span>
    </div>
  );
}
