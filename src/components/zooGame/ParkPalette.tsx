import { useState } from 'react';
import type { ZooGameState, BacklogItem } from './types';
import { addFloraTo, PLANTING_TYPES, HABITAT_FEATURE_TYPES, PATH_WIDTHS, PATH_SURFACES, type ItemDesign, currentDesign } from './design';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { EYEBROW, FOCUS } from './ui/tokens';
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
  const d = design ?? currentDesign(item);
  const hint = placing
    ? 'drop it where it can go - green is room, red is not'
    : TOOLS.find((t) => t.key === (open ?? (drawing ? 'path' : null)))?.gesture;

  const why = (key: ToolKey) => (key === 'path'
    ? `${item.name} has no route to draw - that is a pathway's work. It is built on the card, not on the park.`
    : `${item.name} is not planting. It is built on its card, and placed here.`);

  const press = (key: ToolKey) => {
    // The pen goes down as soon as you press Path - drawing is what the tool is for - and the width
    // and surface sit under it. Reported from playing it: "I cannot specify width and colour", and
    // the plan asks for both ("Set its width and colour"), so there was a step nothing could tick.
    if (key === 'path') onDrawing?.(!drawing);
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
        if (!allowed) return button;
        return (
          <Popover key={t.key} open={open === t.key} onOpenChange={(o) => setOpen(o ? t.key : null)}>
            <PopoverTrigger asChild>{button}</PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-auto max-w-[22rem] p-2">
              {t.key === 'path' && (
                <div className="space-y-2">
                  <div>
                    <div className={cn(EYEBROW, 'text-muted-foreground')}>Width</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {PATH_WIDTHS.map((w) => (
                        <button key={w.key} type="button"
                          onClick={() => onDesign(item.id, { ...d, parts: { ...d.parts, thickness: w.key } })}
                          className={cn(FOCUS, 'flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                            d.parts.thickness === w.key ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/60')}>
                          <span className="rounded-full bg-foreground/70" style={{ width: 18, height: Math.max(2, w.px / 2) }} />
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className={cn(EYEBROW, 'text-muted-foreground')}>Surface</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {PATH_SURFACES.map((c) => (
                        <button key={c.hex} type="button" aria-label={`Surface ${c.label}`} title={c.label}
                          onClick={() => onDesign(item.id, { ...d, colors: { ...d.colors, path: c.hex } })}
                          className={cn(FOCUS, 'h-6 w-6 rounded-md border-2', d.colors.path === c.hex ? 'border-primary' : 'border-border')}
                          style={{ background: c.hex }} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Then click where the run starts and where it ends.</p>
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
