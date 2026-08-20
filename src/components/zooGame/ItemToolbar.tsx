import { useEffect, type ReactNode } from 'react';
import type { BacklogItem } from './types';
import {
  isDesignDone, designCriteria, designSatisfiesTask, isDeployAcceptance,
  EXHIBIT_PARTS, AMENITY_COLORS, FLORA_TYPES, PLANTING_TYPES, HABITAT_FEATURE_TYPES, BUILDING_TYPES,
  ENCLOSURE_SHAPES, PATH_WIDTHS, SWATCHES, floraColors, floraDefaultColors, enclosureWater,
  addWaterTo, addFloraTo, isLandscapeType, type ItemDesign,
} from './design';
import { isSignOffTask } from './engine';
import { TaskChecklist } from './Board';
import { ExplainButton } from './Explain';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Copy, Droplets, Sprout, X, ListChecks } from 'lucide-react';

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

/** A toolbar button that opens a small panel of choices. */
function Menu({ label, swatch, children, title }: { label: string; swatch?: string; children: ReactNode; title?: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" title={title ?? label} className={BTN}>
          {swatch !== undefined && (
            <span className="h-4 w-4 rounded border border-border/70" style={{ background: swatch }} aria-hidden />
          )}
          <span className="max-w-[8rem] truncate capitalize">{label}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-auto max-w-[20rem] p-2">{children}</PopoverContent>
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
function Colours({ value, onChange }: { value?: string; onChange: (hex: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {SWATCHES.map((s) => (
        <button key={s} type="button" title={s} onClick={() => onChange(s)}
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
function ColourButton({ label, value, onChange }: { label: string; value?: string; onChange: (hex: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" title={label} aria-label={label}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-muted">
          <span className="h-5 w-5 rounded border-2 border-border/70 shadow-sm" style={{ background: value ?? '#cccccc' }} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-auto p-2">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
        <Colours value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}

export interface CopySource { id: string; name: string; design: ItemDesign }

interface ItemToolbarProps {
  item: BacklogItem;
  design: ItemDesign;
  /** True when this is an already-built item being changed rather than a build in progress. */
  editing: boolean;
  onDesign: (design: ItemDesign) => void;
  onSetEnclosure?: (size: 'small' | 'medium' | 'large') => void;
  onToggleTask: (taskId: string) => void;
  onConfirmAc: (index: number, value: boolean) => void;
  onFinish: () => void;
  /** Release it: the hoardings come down and visitors can see it. Only once the Product Owner has
   *  signed off, which means every acceptance criterion - including where it stands. */
  onRelease: () => void;
  onClose: () => void;
  copySources?: CopySource[];
}

/** What has to be true before this item is Done, and the button that takes it there. */
function DonePanel({ item, design, editing, onToggleTask, onConfirmAc, onFinish, onRelease }: Omit<ItemToolbarProps, 'onDesign' | 'onSetEnclosure' | 'onClose' | 'copySources'>) {
  const acceptance = item.acceptance ?? [];
  const buildAcceptance = acceptance.map((label, i) => ({ label, i })).filter((a) => !isDeployAcceptance(a.label));
  const deployAcceptance = acceptance.map((label, i) => ({ label, i })).filter((a) => isDeployAcceptance(a.label));
  // Built and standing on the park: what is left is where it stands, and the sign-off that follows.
  // It is already in place - there is nothing to "place", which is the point of building in place.
  const released = item.status === 'open';
  const deployAll = deployAcceptance.every((a) => !!item.acConfirmed?.[a.i]);
  const signOff = (item.tasks ?? []).find((t) => isSignOffTask(t.label));
  const built = isDesignDone(item, design);
  const acAll = buildAcceptance.every((a) => !!item.acConfirmed?.[a.i]);
  // The Definition of Done is the bar; the Product Owner's sign-off is deliberately not part of this
  // gate - it comes after the item is on the park and its placement criteria are met.
  const planDone = (item.tasks ?? []).filter((t) => t.label.trim() && !isSignOffTask(t.label)).every((t) => t.done);
  const done = built && acAll && planDone;
  const blocker = done ? null
    : !built ? (designCriteria(item, design).find((c) => !c.pass)?.label ?? 'Finish the design')
    : !acAll ? 'Accept the criteria your build meets'
    : ((item.tasks ?? []).find((t) => t.label.trim() && !isSignOffTask(t.label) && !t.done)?.label ?? 'Finish the plan');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-semibold">Taking it to Done</h4>
        <ExplainButton title="Building it to Done"
          body={[
            'How the work gets done is at the sole discretion of the Developers. The design is yours, and so is the plan beside it.',
            'Three different things have to line up. Your PLAN is how you will build it - yours to change. The ACCEPTANCE CRITERIA came with the item and say what the Product Owner asked for. The DEFINITION OF DONE is the product-wide bar every item clears, and it is in the Artifacts panel in the header.',
            'Nothing is Done until it meets the Definition of Done. An Increment is the sum of everything that has.',
          ]} />
      </div>

      {(item.tasks ?? []).some((t) => t.label.trim()) && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Your plan <span className="font-normal normal-case tracking-normal text-muted-foreground/70">the Developers&rsquo;</span>
          </div>
          <TaskChecklist item={item} onToggle={(_id, taskId) => onToggleTask(taskId)} />
        </div>
      )}

      {acceptance.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Acceptance criteria <span className="font-normal normal-case tracking-normal text-muted-foreground/70">the Product Owner&rsquo;s</span>
          </div>
          <ul className="space-y-1">
            {buildAcceptance.map((a) => {
              const on = !!item.acConfirmed?.[a.i];
              return (
                <li key={a.i}>
                  <button type="button" onClick={() => onConfirmAc(a.i, !on)} className="flex w-full items-center gap-2 text-left text-[13px]">
                    <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full', on ? 'bg-emerald-500 text-white' : 'border border-border')}>{on && <Check className="h-3 w-3" />}</span>
                    <span className={cn(on ? 'text-foreground' : 'text-muted-foreground')}>{a.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-[11px] text-muted-foreground/70">Tick each once your build meets it.</p>
          {deployAcceptance.length > 0 && (
            // Where it stands is judged on the park, with it standing there. Before it is built you
            // cannot judge it at all, so these stay dashed out until then.
            <div className={cn('rounded-md border p-2', editing ? 'border-border bg-background' : 'border-dashed border-border bg-muted/20')}>
              <ul className="space-y-1">
                {deployAcceptance.map((a) => {
                  const on = !!item.acConfirmed?.[a.i];
                  return (
                    <li key={a.i}>
                      <button type="button" disabled={!editing} onClick={() => onConfirmAc(a.i, !on)}
                        className="flex w-full items-center gap-2 text-left text-[12px] disabled:cursor-default">
                        <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                          on ? 'bg-emerald-500 text-white' : editing ? 'border border-border' : 'border border-dashed border-muted-foreground/50')}>{on && <Check className="h-3 w-3" />}</span>
                        <span className={cn(on ? 'text-foreground' : 'text-muted-foreground')}>{a.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                {editing ? 'Drag it where it belongs, then confirm - the Product Owner signs off once every criterion is met.'
                  : 'Judged once it is built and standing on the park.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Built, and standing where it will stand. All that is left is the sign-off and the opening. */}
      {editing && !released ? (
        <>
          <p className="text-[11px] text-muted-foreground">
            {!deployAll ? 'Next: confirm where it stands'
              : signOff && !signOff.done ? 'The Product Owner has signed it off.'
              : 'Ready. Opening it takes the hoardings down.'}
          </p>
          <Button size="sm" className="w-full" disabled={!deployAll} onClick={onRelease}>Open it to visitors</Button>
        </>
      ) : released ? (
        <p className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-600 dark:text-emerald-400"><Check className="h-4 w-4" /> Live to visitors</p>
      ) : (
        <>
          {blocker && <p className="text-[11px] text-muted-foreground">Next: {blocker.toLowerCase()}</p>}
          <Button size="sm" className="w-full" disabled={!done} onClick={onFinish}>Finish the build</Button>
        </>
      )}
    </div>
  );
}

/** The floating toolbar for the selected item: only the controls this kind of thing needs. */
export function ItemToolbar(props: ItemToolbarProps) {
  const { item, design, onDesign, onSetEnclosure, onToggleTask, onClose, copySources = [] } = props;
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

  const tasks = (item.tasks ?? []).filter((t) => t.label.trim() && !isSignOffTask(t.label));
  const ticked = tasks.filter((t) => t.done).length;

  return (
    <div className="flex max-w-[min(94vw,60rem)] items-center gap-0.5 overflow-x-auto rounded-xl border border-border bg-background/98 px-1.5 py-1 shadow-xl">
      <span className="mr-1 max-w-[10rem] shrink-0 truncate px-1 text-xs font-semibold" title={item.name}>{item.name}</span>
      <Divider />

      {copySources.length > 0 && (
        <>
          <Menu label="Copy" title="Start from one you have already built">
            <div className="space-y-1">
              {copySources.map((s) => (
                <button key={s.id} type="button" onClick={() => onDesign({ parts: { ...s.design.parts }, colors: { ...s.design.colors } })}
                  className="flex w-full items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs hover:border-primary/60">
                  <Copy className="h-3 w-3 text-muted-foreground" /> {s.name}
                </button>
              ))}
            </div>
          </Menu>
          <Divider />
        </>
      )}

      {isEnclosure && (
        <>
          {onSetEnclosure && (
            <Menu label={item.enclosureSize ?? 'medium'} title="Footprint - each animal is drawn to scale inside it">
              <Options options={['small', 'medium', 'large']} value={item.enclosureSize ?? 'medium'} onPick={(o) => onSetEnclosure(o as 'small' | 'medium' | 'large')} />
              <p className="mt-1.5 max-w-[14rem] text-[11px] text-muted-foreground">A bigger habitat holds more animals.</p>
            </Menu>
          )}
          <Menu label={ENCLOSURE_SHAPES.find((s) => s.key === (design.parts.shape ?? 'rounded'))?.label ?? 'Shape'} title="Shape">
            <Options options={ENCLOSURE_SHAPES.map((s) => s.key)} value={design.parts.shape ?? 'rounded'} onPick={(o) => setPart('shape', o)}
              labels={Object.fromEntries(ENCLOSURE_SHAPES.map((s) => [s.key, s.label]))} />
          </Menu>
          <Divider />
          <ColourButton label="Ground" value={design.colors.ground} onChange={(hex) => setColor('ground', hex)} />
          <ColourButton label="Fence" value={design.colors.fence} onChange={(hex) => setColor('fence', hex)} />
          {enclosureWater(design).length > 0 && <ColourButton label="Water" value={design.colors.water} onChange={(hex) => setColor('water', hex)} />}
          <Divider />
          <button type="button" className={BTN} title="Add a water feature, then drag it inside the habitat"
            onClick={() => onDesign({ ...design, water: addWaterTo(design) })}>
            <Droplets className="h-3.5 w-3.5 text-sky-600" /> Water
          </button>
          <Menu label="Plant" title="Plants and habitat features">
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
          </Menu>
        </>
      )}

      {isExhibit && EXHIBIT_PARTS.map((p) => {
        const opt = design.parts[p.key] ?? p.options[0];
        return (
          <Menu key={p.key} label={opt} title={p.label} swatch={opt === 'none' ? undefined : design.colors[p.colorKey]}>
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{p.label}</div>
              <Options options={p.options} value={opt} onPick={(o) => setPart(p.key, o)} />
              {opt !== 'none' && (
                <>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{p.label} colour</div>
                  <Colours value={design.colors[p.colorKey]} onChange={(hex) => setColor(p.colorKey, hex)} />
                </>
              )}
            </div>
          </Menu>
        );
      })}

      {isFlora && !isLand && (
        <>
          <Menu label={design.parts.type ?? item.template ?? 'tree'} title="What kind">
            <Options options={FLORA_TYPES} value={design.parts.type ?? 'tree'} onPick={(o) => setPart('type', o)} />
          </Menu>
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
          <span className="shrink-0 px-1 text-[11px] text-muted-foreground">Drag its edge on the park to size it.</span>
        </>
      )}

      {isPath && (
        <>
          <Menu label={PATH_WIDTHS.find((w) => w.key === (design.parts.thickness ?? 'medium'))?.label ?? 'Width'} title="Width">
            <Options options={PATH_WIDTHS.map((w) => w.key)} value={design.parts.thickness ?? 'medium'} onPick={(o) => setPart('thickness', o)}
              labels={Object.fromEntries(PATH_WIDTHS.map((w) => [w.key, w.label]))} />
          </Menu>
          <ColourButton label="Path colour" value={design.colors.path} onChange={(hex) => setColor('path', hex)} />
          <span className="shrink-0 px-1 text-[11px] text-muted-foreground">You draw the route when you deploy it.</span>
        </>
      )}

      {item.category === 'amenity' && (
        <>
          <Menu label={design.parts.type ?? 'shop'} title="What kind of building">
            <Options options={BUILDING_TYPES} value={design.parts.type ?? 'shop'} onPick={(o) => setPart('type', o)} />
          </Menu>
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

      <Divider />
      {/* The Scrum, one button wide: the plan, the criteria and the gate they guard. */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={cn(BTN, 'border border-border bg-muted/60')} title="Your plan and the acceptance criteria - what has to be true before this is Done">
            <ListChecks className="h-3.5 w-3.5 text-primary" /> Done? <span className="tabular-nums text-muted-foreground">{ticked}/{tasks.length}</span> <ChevronDown className="h-3 w-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80">
          <DonePanel {...props} />
        </PopoverContent>
      </Popover>
      <button type="button" onClick={onClose} aria-label="Deselect" title="Deselect"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
