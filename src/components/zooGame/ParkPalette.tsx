import { useState } from 'react';
import type { ZooGameState, BacklogItem } from './types';
import { addFloraTo, presetFor, PLANTING_TYPES, HABITAT_FEATURE_TYPES, type ItemDesign } from './design';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { FOCUS } from './ui/tokens';
import { Waypoints, Sprout, type LucideIcon } from 'lucide-react';

// The palette: six tools along the foot of the park.
//
// Borrowed from the games where this is settled. A palette, not a menu: every tool the build has is
// on the surface, each a glyph with a word under it, and there is no second level to go looking in.
// Six tools is the whole catalogue - expression lives in what you do with them, not in more of them.
//
// A tool that has nothing to do with what is in your hands is dimmed and says why, rather than
// being hidden: seeing that a habitat has no route to draw is how you learn what a pathway is.

// Two tools, because two things have no object of their own: a path is a run between points, and
// loose planting is scenery nobody wrote a Backlog item for. A habitat, an animal and a facility are
// cards, and they are built in their takeover - so they are not tools.
type ToolKey = 'path' | 'planting';

const TOOLS: { key: ToolKey; label: string; icon: LucideIcon; gesture: string }[] = [
  { key: 'path', label: 'Path', icon: Waypoints, gesture: 'click where it starts, then where it ends' },
  { key: 'planting', label: 'Planting', icon: Sprout, gesture: 'place trees, bushes and rocks' },
];

/** Which tools this item can be built with. A pathway has a route; a habitat has a footprint, water
 *  and planting; an animal has a group and a coat. The rest are somebody else's work. */
function toolsFor(item: BacklogItem): Record<ToolKey, boolean> {
  return { path: item.category === 'path', planting: item.category === 'flora' };
}

export function ParkPalette({ state, item, design, drawing, onDrawing, onDesign, placing, className }: {
  state: ZooGameState;
  item: BacklogItem;
  design?: ItemDesign;
  drawing?: boolean;
  onDrawing?: (on: boolean) => void;
  onDesign: (id: string, design: ItemDesign) => void;
  /** Whether the thing in hand is following the cursor, waiting to be put down. */
  placing?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState<ToolKey | null>(null);
  const can = toolsFor(item);
  const d = design ?? item.design ?? item.draftDesign ?? presetFor(item);
  const hint = placing
    ? 'drop it where it can go - green is room, red is not'
    : TOOLS.find((t) => t.key === (open ?? (drawing ? 'path' : null)))?.gesture;

  const why = (key: ToolKey) => (key === 'path'
    ? `${item.name} has no route to draw - that is a pathway's work. It is built on the card, not on the park.`
    : `${item.name} is not planting. It is built on its card, and placed here.`);

  const press = (key: ToolKey) => {
    if (key === 'path') { onDrawing?.(!drawing); setOpen(null); return; }
    setOpen((cur) => (cur === key ? null : key));
  };

  return (
    <div data-part="park-palette" className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {TOOLS.map((t) => {
        const allowed = can[t.key];
        const on = open === t.key || (t.key === 'path' && !!drawing);
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
        if (!allowed || t.key === 'path') return button;
        return (
          <Popover key={t.key} open={open === t.key} onOpenChange={(o) => setOpen(o ? t.key : null)}>
            <PopoverTrigger asChild>{button}</PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-auto max-w-[22rem] p-2">
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
