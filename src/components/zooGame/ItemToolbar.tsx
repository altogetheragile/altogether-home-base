import { useEffect, useState, type ReactNode } from 'react';
import type { BacklogItem } from './types';
import {
  designSatisfiesTask,
  EXHIBIT_PARTS, AMENITY_COLORS, FLORA_TYPES, PLANTING_TYPES, HABITAT_FEATURE_TYPES, BUILDING_TYPES,
  ENCLOSURE_SHAPES, PATH_WIDTHS, SWATCHES, floraColors, floraDefaultColors, enclosureFlora,
  addWaterTo, addFloraTo, isLandscapeType, type ItemDesign,
} from './design';
import { isSignOffTask } from './engine';
import { ExplainButton } from './Explain';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Copy, Droplets, Sprout, X, Trash2, Maximize2, Shapes, Store, Ruler, Cat, PawPrint, Ear, Circle, Palette, type LucideIcon } from 'lucide-react';

// ============= Building on the canvas =============
//
// The design controls come to the thing being made, the way they do in a drawing tool: select it on
// the park and a small toolbar appears above it holding only what THIS item needs. Every change
// lands on the park immediately, so there is no preview to keep in sync with the real thing and no
// panel covering the product while you work on it.
//
// The Scrum stays where it was. The plan and the acceptance criteria are one button on the right,
// which carries the count and will not let the build finish until they are met - the same gate the
// studio had, just no longer occupying half the screen while you pick a colour.

const BTN = 'flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40';

function Divider() {
  return <span className="mx-0.5 h-6 w-px shrink-0 bg-border" aria-hidden />;
}

/** A toolbar button that opens a small panel of choices. Children are given a `close` so a menu
 *  that asks one question can answer it and get out of the way. */
function Menu({ label, swatch, icon: Icon, children, title }: { label: string; swatch?: string; icon?: LucideIcon; children: (close: () => void) => ReactNode; title?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" title={title ?? label} className={BTN}>
          {/* A picture of the part, or the colour it is wearing. A row of identical grey words is
              hard to aim at; a row where each control looks like the thing it changes is not. */}
          {swatch === undefined && Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />}
          {swatch !== undefined && (
            <span className="h-4 w-4 rounded border border-border/70" style={{ background: swatch }} aria-hidden />
          )}
          <span className="max-w-[8rem] truncate capitalize">{label}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" sideOffset={6} align="center" className="w-auto max-w-[20rem] p-2">{children(() => setOpen(false))}</PopoverContent>
    </Popover>
  );
}

/** The choices themselves: pills that wrap, like the reference tools use. */
function Options({ options, value, onPick, labels }: { options: readonly string[]; value?: string; onPick: (o: string) => void; labels?: Record<string, string> }) {
  return (
    <div className="flex max-w-[18rem] flex-wrap gap-1">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onPick(o)}
          className={cn('rounded-full border px-2.5 py-0.5 text-xs capitalize transition-colors',
            value === o ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted')}>
          {labels?.[o] ?? o}
        </button>
      ))}
    </div>
  );
}

/** A colour: the square shows what it is now, and opens the palette. */
function Colours({ value, onChange, onPicked }: { value?: string; onChange: (hex: string) => void; onPicked?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {SWATCHES.map((s) => (
        <button key={s} type="button" title={s} onClick={() => { onChange(s); onPicked?.(); }}
          className={cn('h-6 w-6 rounded-md border transition-transform hover:scale-110',
            value?.toLowerCase() === s ? 'border-2 border-foreground' : 'border-border/60')} style={{ background: s }} />
      ))}
      <input type="color" value={value ?? '#cccccc'} onChange={(e) => onChange(e.target.value)} title="Any other colour"
        className="ml-1 h-6 w-8 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5" />
    </div>
  );
}

/** A colour straight on the toolbar - a swatch you press, like the fill and border squares in a
 *  drawing tool. */
function ColourButton({ label, value, onChange, part, focus, onFocus, onClosed }: {
  label: string; value?: string; onChange: (hex: string) => void;
  /** Which part of the thing this colours, so clicking that part on the park opens this. */
  part?: string; focus?: string | null; onFocus?: (key: string | null) => void; onClosed?: string | null;
}) {
  const [own, setOwn] = useState(false);
  const controlled = !!part && !!onFocus;
  const open = controlled ? focus === part : own;
  const setOpen = (o: boolean) => (controlled ? onFocus!(o ? part! : (onClosed ?? null)) : setOwn(o));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* The square alone told you nothing: two brown-ish squares side by side could be anything.
            It is named, and clicking the ground or the fence out on the park opens the right one. */}
        <button type="button" title={`${label} colour`} aria-label={`${label} colour`}
          className={cn('flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-1.5 text-xs font-medium transition-colors',
            open ? 'bg-primary/10 text-primary' : 'hover:bg-muted')}>
          <span className="h-5 w-5 rounded border-2 border-border/70 shadow-sm" style={{ background: value ?? '#cccccc' }} />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" sideOffset={6} align="center" className="w-auto p-2">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
        <Colours value={value} onChange={onChange} onPicked={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

/** A picture for each part of a creature, so the five menus are told apart by shape as well as by
 *  reading them. Nothing here is literal - there is no lucide icon for "tail". */
const PART_ICON: Record<string, LucideIcon> = { body: Cat, head: Circle, ears: Ear, tail: PawPrint, markings: Palette };

/** A line of guidance under the controls. It takes a whole line: as one more shrink-0 item in a
 *  wrapping row of buttons, a sentence simply ran out past the edge of the panel. */
function Hint({ children }: { children: ReactNode }) {
  return <span className="basis-full px-1 pt-0.5 text-[11px] leading-snug text-muted-foreground">{children}</span>;
}

export interface CopySource { id: string; name: string; design: ItemDesign }

interface ItemToolbarProps {
  item: BacklogItem;
  design: ItemDesign;
  onDesign: (design: ItemDesign) => void;
  onSetEnclosure?: (size: 'small' | 'medium' | 'large') => void;
  onToggleTask: (taskId: string) => void;
  /** Accepting a criterion. The card is still where they live, but ticking them ONLY there meant an
   *  eye round-trip across the screen for every one: you colour on the park and judge on the board.
   *  The same list, the same state, reachable from whichever end you happen to be at. */
  onConfirmAc: (index: number, value: boolean) => void;
  onClose: () => void;
  copySources?: CopySource[];
  /** Which part of the thing is selected on the park - 'ground', 'fence', 'water', 'flora:2'.
   *  Clicking a part out there opens the control for it in here, which is the only way the two
   *  brown squares were ever going to explain themselves. */
  focus?: string | null;
  onFocus?: (key: string | null) => void;
  /** Docked in the design bench rather than floating over the park: no pill, no shadow, and no name
   *  or close button, because the panel it sits in already says what is being worked on. */
  docked?: boolean;
}

/** The floating toolbar for the selected item: only the controls this kind of thing needs. */
export function ItemToolbar(props: ItemToolbarProps) {
  const { item, design, onDesign, onSetEnclosure, onToggleTask, onClose, copySources = [], focus, onFocus, docked = false } = props;
  // A plant or habitat feature picked out on the park: its own colours join the toolbar while it is
  // selected, and leave again when it is not. `flora:2` selects it, `flora:2:trunk` opens a palette.
  const floraIdx = focus?.startsWith('flora:') ? Number(focus.split(':')[1]) : null;
  const flora = enclosureFlora(design);
  const selectedFlora = floraIdx != null && flora[floraIdx] ? flora[floraIdx] : null;
  const isExhibit = item.category === 'exhibit';
  const isEnclosure = item.category === 'enclosure';
  const isFlora = item.category === 'flora';
  const isPath = item.category === 'path';
  const isLand = isFlora && isLandscapeType(design.parts.type ?? item.template);

  const setPart = (key: string, opt: string) => onDesign({ ...design, parts: { ...design.parts, [key]: opt } });
  const setColor = (key: string, hex: string) => onDesign({ ...design, colors: { ...design.colors, [key]: hex } });

  // The plan ticks itself off as the work is done, so it is not a second set of boxes for what you
  // just did. Peer review stays manual, and the Product Owner's sign-off is never ticked here.
  useEffect(() => {
    for (const t of item.tasks ?? []) {
      if (!t.label.trim() || isSignOffTask(t.label)) continue;
      if (!t.done && designSatisfiesTask(item, design, t.label)) onToggleTask(t.id);
    }
  }, [design, item, onToggleTask]);


  return (
    // Wraps rather than scrolls: clipped at both edges it read as broken, and a toolbar you have to
    // scroll sideways is a toolbar with things hidden in it.
    <div className={cn('flex flex-wrap items-center gap-0.5',
      docked ? 'gap-y-1' : 'rounded-xl border border-border bg-background/98 px-1.5 py-1 shadow-xl')}>
      {!docked && <>
        <span className="mr-1 max-w-[10rem] shrink-0 truncate px-1 text-xs font-semibold" title={item.name}>{item.name}</span>
        <Divider />
      </>}

      {copySources.length > 0 && (
        <>
          <Menu label="Copy from" icon={Copy} title="Start from one you have already built">{(close) => (
            <div className="space-y-1">
              {copySources.map((s) => (
                <button key={s.id} type="button" onClick={() => { onDesign({ parts: { ...s.design.parts }, colors: { ...s.design.colors } }); close(); }}
                  className="flex w-full items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs hover:border-primary/60">
                  <Copy className="h-3 w-3 text-muted-foreground" /> {s.name}
                </button>
              ))}
            </div>
          )}</Menu>
          <Divider />
        </>
      )}

      {isEnclosure && (
        <>
          {onSetEnclosure && (
            <Menu label="Size" icon={Maximize2} title={`How big the habitat is - ${item.enclosureSize ?? 'medium'}. Each animal is drawn to scale inside it.`}>{(close) => (<>
              <Options options={['small', 'medium', 'large']} value={item.enclosureSize ?? 'medium'} onPick={(o) => { onSetEnclosure(o as 'small' | 'medium' | 'large'); close(); }} />
              <p className="mt-1.5 max-w-[14rem] text-[11px] text-muted-foreground">A bigger habitat holds more animals.</p>
            </>)}</Menu>
          )}
          <Menu label="Shape" icon={Shapes} title={`What shape the habitat is - ${ENCLOSURE_SHAPES.find((s) => s.key === (design.parts.shape ?? 'rounded'))?.label ?? 'rounded'}`}>{(close) => (
            <Options options={ENCLOSURE_SHAPES.map((s) => s.key)} value={design.parts.shape ?? 'rounded'} onPick={(o) => { setPart('shape', o); close(); }}
              labels={Object.fromEntries(ENCLOSURE_SHAPES.map((s) => [s.key, s.label]))} />
          )}</Menu>
          <Divider />
          <ColourButton label="Ground" part="ground" focus={focus} onFocus={onFocus} value={design.colors.ground} onChange={(hex) => setColor('ground', hex)} />
          <ColourButton label="Fence" part="fence" focus={focus} onFocus={onFocus} value={design.colors.fence} onChange={(hex) => setColor('fence', hex)} />
          {selectedFlora && (
            <>
              <Divider />
              <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold capitalize text-primary-foreground">{selectedFlora.type}</span>
              {floraColors(selectedFlora.type).map((c) => {
                const key = c.key as 'foliage' | 'trunk';
                return (
                  <ColourButton key={key} label={c.label} part={`flora:${floraIdx}:${key}`} focus={focus} onFocus={onFocus} onClosed={`flora:${floraIdx}`}
                    value={selectedFlora[key] ?? floraDefaultColors(selectedFlora.type)[key]}
                    onChange={(hex) => onDesign({ ...design, flora: flora.map((f, j) => (j === floraIdx ? { ...f, [key]: hex } : f)) })} />
                );
              })}
              <button type="button" className={BTN} title={`Remove this ${selectedFlora.type}`}
                onClick={() => { onDesign({ ...design, flora: flora.filter((_, j) => j !== floraIdx) }); onFocus?.(null); }}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </>
          )}
          <Divider />
          <button type="button" className={BTN} title="Add a water feature, then drag it inside the habitat"
            onClick={() => onDesign({ ...design, water: addWaterTo(design) })}>
            <Droplets className="h-3.5 w-3.5 text-sky-600" /> Water
          </button>
          {/* This one does NOT close on a pick: you usually want three trees, not one. */}
          <Menu label="Add planting" icon={Sprout} title="Plants and habitat features">{() => (
            <div className="space-y-2">
              <div>
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Planting</div>
                <Options options={PLANTING_TYPES} onPick={(t) => onDesign({ ...design, flora: addFloraTo(design, t) })} />
              </div>
              <div>
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Features</div>
                <Options options={HABITAT_FEATURE_TYPES} onPick={(t) => onDesign({ ...design, flora: addFloraTo(design, t) })} />
              </div>
              <p className="max-w-[16rem] text-[11px] text-muted-foreground">Drag them inside the habitat to arrange, drag a corner to resize, hover for &times;.</p>
            </div>
          )}</Menu>
        </>
      )}

      {isExhibit && EXHIBIT_PARTS.map((p) => {
        const opt = design.parts[p.key] ?? p.options[0];
        return (
          // Every control on this bar is named for the part it belongs to and nothing else - Ground,
          // Fence, Head, Tail - so the row reads as a list of the thing's parts. It used to be
          // labelled with its current setting, which gave you "round", "maned", "tufted": a row of
          // adjectives with no nouns, where the two colour buttons beside them said what they were.
          <Menu key={p.key} label={p.label} icon={PART_ICON[p.key] ?? Circle} title={`${p.label} - ${opt}`}
            swatch={opt === 'none' ? undefined : design.colors[p.colorKey]}>{(close) => (
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{p.label}</div>
              <Options options={p.options} value={opt} onPick={(o) => setPart(p.key, o)} />
              {opt !== 'none' && (
                <>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{p.label} colour</div>
                  <Colours value={design.colors[p.colorKey]} onChange={(hex) => setColor(p.colorKey, hex)} onPicked={close} />
                </>
              )}
            </div>
          )}</Menu>
        );
      })}

      {isFlora && !isLand && (
        <>
          <Menu label="Type" icon={Sprout} title={`What kind of planting this is - ${design.parts.type ?? item.template ?? 'tree'}`}>{(close) => (
            <Options options={FLORA_TYPES} value={design.parts.type ?? 'tree'} onPick={(o) => { setPart('type', o); close(); }} />
          )}</Menu>
          <Divider />
          {floraColors(design.parts.type ?? item.template).map((c) => (
            <ColourButton key={c.key} label={c.label} value={design.colors[c.key] ?? floraDefaultColors(design.parts.type ?? item.template ?? 'tree')[c.key as 'foliage' | 'trunk']}
              onChange={(hex) => setColor(c.key, hex)} />
          ))}
        </>
      )}

      {isLand && (
        <>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{design.parts.type ?? item.template}</span>
          <Divider />
          {floraColors(design.parts.type ?? item.template).map((c) => (
            <ColourButton key={c.key} label={c.label} value={design.colors[c.key]} onChange={(hex) => setColor(c.key, hex)} />
          ))}
          <Hint>Drag its edge on the park to size it.</Hint>
        </>
      )}

      {isPath && (
        <>
          <Menu label="Width" icon={Ruler} title={`How wide the path is - ${(PATH_WIDTHS.find((w) => w.key === (design.parts.thickness ?? 'medium'))?.label ?? 'medium').toLowerCase()}`}>{(close) => (
            <Options options={PATH_WIDTHS.map((w) => w.key)} value={design.parts.thickness ?? 'medium'} onPick={(o) => { setPart('thickness', o); close(); }}
              labels={Object.fromEntries(PATH_WIDTHS.map((w) => [w.key, w.label]))} />
          )}</Menu>
          <ColourButton label="Path colour" value={design.colors.path} onChange={(hex) => setColor('path', hex)} />
          <Hint>Every run is laid at this width and colour.</Hint>
        </>
      )}

      {item.category === 'amenity' && (
        <>
          <Menu label="Kind" icon={Store} title={`What kind of building - ${design.parts.type ?? 'shop'}`}>{(close) => (
            <Options options={BUILDING_TYPES} value={design.parts.type ?? 'shop'} onPick={(o) => { setPart('type', o); close(); }} />
          )}</Menu>
          <Divider />
          {AMENITY_COLORS.map((c) => (
            <ColourButton key={c.key} label={c.label} value={design.colors[c.key]}
              onChange={(hex) => onDesign({ ...design, colors: { ...design.colors, [c.key]: hex }, parts: c.key === 'sign' ? { ...design.parts, sign: 'on' } : design.parts })} />
          ))}
          <button type="button" onClick={() => setPart('sign', design.parts.sign === 'on' ? 'off' : 'on')}
            className={cn(BTN, design.parts.sign === 'on' && 'bg-primary/10 text-primary')}>
            <Sprout className="h-3.5 w-3.5" /> Sign
          </button>
        </>
      )}

      {/* Floating over the park these came along for the ride, because the card was a screen
          away. Docked under the board they would be a second copy of what the bench already
          shows open below, and the way out is the park itself. */}
      {!docked && <>
        <Divider />
        {/* The Product Owner's criteria, right where you are making the thing they are about. */}
        {(item.acceptance ?? []).length > 0 && (() => {
          const met = (item.acceptance ?? []).filter((_, i) => !!item.acConfirmed?.[i]).length;
          const all = (item.acceptance ?? []).length;
          return (
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className={cn(BTN, 'border', met === all ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-border bg-muted/60')}
                  title="What the Product Owner asked for">
                  <Check className="h-3.5 w-3.5" /> Accepted <span className="tabular-nums">{met}/{all}</span> <ChevronDown className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="end" sideOffset={6} className="w-72 p-2.5">
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  Acceptance criteria <span className="font-normal normal-case tracking-normal">the Product Owner&rsquo;s</span>
                </div>
                <ul className="space-y-1">
                  {(item.acceptance ?? []).map((label, i) => {
                    const on = !!item.acConfirmed?.[i];
                    return (
                      <li key={i}>
                        <button type="button" onClick={() => props.onConfirmAc(i, !on)} className="flex w-full items-start gap-1.5 text-left text-[12px]">
                          <span className={cn('mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full', on ? 'bg-emerald-500 text-white' : 'border border-border')}>{on && <Check className="h-2.5 w-2.5" />}</span>
                          <span className={cn(on ? 'text-muted-foreground line-through' : 'text-foreground')}>{label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-1.5 text-[11px] text-muted-foreground/70">Also on the item&rsquo;s card - it is the same list.</p>
              </PopoverContent>
            </Popover>
          );
        })()}
        <ExplainButton cards={['definition-of-done', 'increment']} compact />
        <button type="button" onClick={onClose} aria-label="Deselect" title="Deselect"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </>}
    </div>
  );
}
