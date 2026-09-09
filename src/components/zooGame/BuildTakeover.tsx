import { useEffect, type PointerEvent as ReactPointerEvent } from 'react';
import type { ZooGameState, BacklogItem } from './types';
import type { EditApi } from './ParkView';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EYEBROW, FOCUS } from './ui/tokens';
import { answerable, checkCriterion, checkedAt } from './parkChecks';
import { enclosureWater, enclosureFlora, ENCLOSURE_SIZE, ENCLOSURE_SHAPES, PLANTING_TYPES, HABITAT_FEATURE_TYPES, BUILDING_TYPES, groupSize, hasRoomToRoam, designSatisfiesTask, currentDesign, floraColors, floraDefaultColors, LANDSCAPE_TYPES } from './design';
import { isSignOffTask } from './engine';
import { Check, Circle, X } from 'lucide-react';

/** What a piece of scenery can be. The landscape features and the planting in one list, because
 *  from a Backlog item's point of view they are the same thing: something that stands in the park
 *  and is not a habitat, an animal or a building. */
const SCENERY_TYPES: string[] = [...new Set([...LANDSCAPE_TYPES.filter((t) => t !== 'carpark' && t !== 'entrance'), ...PLANTING_TYPES])];
/** Enough colours to make a choice, and not so many that it is a paint program. */
const SCENERY_COLOURS = ['#43a047', '#7a5230', '#8fa3b0', '#c8a06a', '#7cc0e8', '#e0679a', '#6b7280'];
/** A building's palette: walls, roof and sign. */
const BUILDING_COLOURS = ['#e6ddcf', '#cfd8e3', '#a4623a', '#3f6f4f', '#c8761f', '#6b7280', '#f2e6c9'];

// Everything about an object is built here, and nothing else is.
//
// The park is for placement and orientation - drop a footprint, draw a path, move a thing. The
// object itself - its footprint, its ground, its fence, its shelter, its water, its planting, its
// animals - is built in a takeover over the park, at a size you can work at. That is the answer to
// "building on the park is impossible": the park was being asked to be a drawing board as well as a
// zoo, and it is bad at one of those jobs.
//
// The panel on the right is the item's ACCEPTANCE CRITERIA, and it is not the Definition of Done.
// The criteria belong to this item and differ item by item; the Definition of Done is the team's bar
// for every item and is shown once, at the Done gate. They are never merged and never relabelled.

const GROUND = ['#c8a06a', '#e0a642', '#a8cf8f', '#6b7280', '#e8e2d5'];

export function BuildTakeover({ state, item, edit, canBuild = true, onPlace, onPutIn, onClose, className }: {
  state: ZooGameState;
  item: BacklogItem;
  edit: EditApi;
  /** Whether the person looking may build. How a thing gets made is the Developers'; a Product
   *  Owner watching sees what it is and what it still has to be, and no controls. */
  canBuild?: boolean;
  /** Commit a thing that stands on the park: the takeover closes and it follows the cursor. */
  onPlace?: (id: string) => void;
  /** Commit an animal: it goes into the habitat that was chosen for it. */
  onPutIn?: (id: string, enclosureId: string) => void;
  onClose: () => void;
  className?: string;
}) {
  const design = currentDesign(item);
  const criteria = item.acceptance.filter(Boolean);
  const met = criteria.filter((c) => checkCriterion(state, item, c)?.met).length;
  const isHabitat = item.category === 'enclosure';
  const isAnimal = item.category === 'exhibit';
  const isBuilding = item.category === 'amenity';
  const isScenery = item.category === 'flora';
  const size = ENCLOSURE_SIZE[item.enclosureSize ?? 'medium'];

  const set = (d: Partial<typeof design>) => edit.onDesign(item.id, { ...design, ...d });

  /** Move a pool or a piece of planting to where you want it inside the fence.
   *
   *  Asked while playing it: "what happened to being able to place water and flora inside an
   *  enclosure?" It went with the old studio. Everything landed where the code put it, which is
   *  fine for the first one and useless for the fourth. Held in the habitat's own coordinates
   *  (0 to 1 across the pen), so it means the same thing in both drawings. */
  const dragPiece = (e: ReactPointerEvent, kind: 'water' | 'flora', index: number, box: { x: number; y: number; w: number; h: number }) => {
    e.preventDefault();
    e.stopPropagation();
    const svg = (e.target as SVGElement).ownerSVGElement;
    if (!svg) return;
    const move = (ev: PointerEvent) => {
      const r = svg.getBoundingClientRect();
      const px = ((ev.clientX - r.left) / r.width) * 320;
      const py = ((ev.clientY - r.top) / r.height) * 220;
      const fx = Math.max(0.06, Math.min(0.94, (px - box.x) / box.w));
      const fy = Math.max(0.08, Math.min(0.92, (py - box.y) / box.h));
      if (kind === 'flora') {
        const flora = enclosureFlora(design).map((f, i) => (i === index ? { ...f, x: fx, y: fy } : f));
        edit.onDesign(item.id, { ...design, flora });
      } else {
        const water = enclosureWater(design).map((wf, i) => (i === index
          ? { ...wf, x: Math.max(0, Math.min(1 - wf.w, fx - wf.w / 2)), y: Math.max(0, Math.min(1 - wf.h, fy - wf.h / 2)) } : wf));
        edit.onDesign(item.id, { ...design, water });
      }
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // The plan ticks itself off as the work is done, so it is not a second set of boxes for what you
  // just did. It used to live on the old floating toolbar, and went with it - which left every item
  // with a plan nothing could ever finish, and Done needs the plan finished: "I still cannot move
  // this PBI to Done - all the ACs are met." Peer review stays manual and the Product Owner's
  // sign-off is never ticked here.
  useEffect(() => {
    for (const t of item.tasks ?? []) {
      if (!t.label.trim() || isSignOffTask(t.label)) continue;
      if (!t.done && designSatisfiesTask(item, design, t.label)) edit.onToggleTask(item.id, t.id);
    }
  }, [design, item, edit]);

  /** Every habitat this animal could live in, and whether it would work. */
  const habitats = state.backlog.filter((it) => it.category === 'enclosure').map((h) => {
    const box = ENCLOSURE_SIZE[h.enclosureSize ?? 'medium'];
    // Built, not accepted. Waiting for the Product Owner to sign the habitat off before the lion can
    // even move in is a queue rather than a dependency: the animal needs somewhere to live, and
    // somewhere to live is a habitat that has been built and is standing on the park.
    const built = !!h.design;
    const room = hasRoomToRoam(design.group, h.enclosureSize ?? 'medium');
    return {
      item: h, built, room,
      line: !built ? 'not built yet - an animal goes in once its habitat is standing'
        : room ? `${Math.round(box.w / 22)} × ${Math.round(box.h / 22)} · room for ${groupSize(design.group)}`
          : `${Math.round(box.w / 22)} × ${Math.round(box.h / 22)} · too small for ${groupSize(design.group)}`,
    };
  });
  const chosen = habitats.find((h) => h.item.id === item.enclosureId) ?? null;

  return (
    <div data-part="build-takeover"
      className={cn('flex min-h-0 flex-col overflow-hidden rounded-xl border-2 border-border bg-background shadow-xl', className)}>
      <header className="flex items-start gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <span className={cn(EYEBROW, 'text-primary')}>In hand</span>
          <h2 className="truncate text-2xl font-bold leading-tight">{item.name}</h2>
          <p className="text-xs text-muted-foreground">
            {item.estimate} pts &middot; {item.zone} &middot; {item.category}
            {(item.assignedDevs ?? []).length > 0 && (() => {
              const who = state.team.developers.filter((d) => (item.assignedDevs ?? []).includes(d.id));
              return who.length ? ` · ${who.map((d) => d.name).join(' and ')} ${who.length === 1 ? 'is' : 'are'} building it` : '';
            })()}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" title="Keep it in hand and go back to the park"
          className={cn(FOCUS, 'rounded-md p-1 text-muted-foreground hover:text-foreground')}>
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-4 py-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* What is being built, drawn plainly and big enough to work at. */}
        <section className="min-w-0">
          <div className="rounded-lg border border-border bg-[#8cc063]/25 p-2">
            <svg viewBox="0 0 320 220" role="img" aria-label={`${item.name} as it is being built`}
              style={{ display: 'block', width: '100%', height: 'auto', maxHeight: 260 }}>
              <rect x={0} y={0} width={320} height={220} fill="#8cc063" />
              <g opacity={0.18} stroke="#2f4f2f">
                {Array.from({ length: 15 }, (_, i) => <line key={`v${i}`} x1={(i + 1) * 20} y1={0} x2={(i + 1) * 20} y2={220} />)}
                {Array.from({ length: 10 }, (_, i) => <line key={`h${i}`} x1={0} y1={(i + 1) * 20} x2={320} y2={(i + 1) * 20} />)}
              </g>
              {isHabitat && (() => {
                const w = Math.min(260, size.w * 1.4), h = Math.min(150, size.h * 1.4);
                const x = (320 - w) / 2, y = (220 - h) / 2;
                return (
                  <g>
                    <rect x={x} y={y} width={w} height={h} rx={design.parts.shape === 'rounded' ? 14 : 4}
                      fill={design.colors?.ground ?? '#c8a06a'} stroke={design.colors?.fence ?? '#8a6a3b'} strokeWidth={6} />
                    {enclosureWater(design).map((wf, i) => (
                      <ellipse key={`w${i}`} data-piece={`water-${i}`} style={{ cursor: canBuild ? 'grab' : 'default' }}
                        onPointerDown={canBuild ? (e) => dragPiece(e, 'water', i, { x, y, w, h }) : undefined}
                        cx={x + w * (wf.x + wf.w / 2)} cy={y + h * (wf.y + wf.h / 2)}
                        rx={(w * wf.w) / 2} ry={(h * wf.h) / 2} fill="#7cc0e8" />
                    ))}
                    {enclosureFlora(design).map((f, i) => (
                      <g key={`f${i}`} data-piece={`flora-${i}`} style={{ cursor: canBuild ? 'grab' : 'default' }}
                        onPointerDown={canBuild ? (e) => dragPiece(e, 'flora', i, { x, y, w, h }) : undefined}>
                        {/rock|shelter/i.test(f.type)
                          ? <rect x={x + w * f.x - 14} y={y + h * f.y - 10} width={28} height={20} rx={3}
                              fill={f.foliage ?? '#8a5a2b'} />
                          : <circle cx={x + w * f.x} cy={y + h * f.y} r={9} fill={f.foliage ?? '#3f8f43'} />}
                      </g>
                    ))}
                    <text x={x + w / 2} y={y - 8} textAnchor="middle" fontSize={11} fontWeight={700} fill="#2f4f2f">
                      {Math.round(size.w / 22)} &times; {Math.round(size.h / 22)} tiles
                    </text>
                  </g>
                );
              })()}
              {isAnimal && (() => {
                const n = Math.max(1, groupSize(design.group));
                return Array.from({ length: Math.min(n, 6) }, (_, i) => (
                  <circle key={i} cx={80 + (i % 3) * 80} cy={90 + Math.floor(i / 3) * 60} r={18}
                    fill={design.colors?.coat ?? '#c8761f'} stroke="#7a4712" strokeWidth={3} />
                ));
              })()}
              {isBuilding && (
                <g>
                  <rect x={110} y={80} width={100} height={70} rx={4} fill={design.colors?.walls ?? design.colors?.wall ?? '#e6ddcf'} stroke="#6b7c93" strokeWidth={3} />
                  <polygon points="102,80 218,80 160,48" fill={design.colors?.roof ?? '#a4623a'} />
                  {design.parts.sign === 'on' && (
                    <rect x={132} y={96} width={56} height={16} rx={3} fill={design.colors?.sign ?? '#3f6f4f'} />
                  )}
                </g>
              )}
              {/* Scenery, in the colours you chose. A blank preview is what made a bridge look like
                  a thing with nothing to it. */}
              {isScenery && (() => {
                const kind = design.parts.type ?? item.template ?? 'tree';
                const a = design.colors?.foliage ?? '#43a047';
                const bcol = design.colors?.trunk ?? '#7a5230';
                if (kind === 'river' || kind === 'bridge') {
                  return (
                    <g>
                      <rect x={20} y={95} width={280} height={30} fill={kind === 'river' ? (a === '#43a047' ? '#7cc0e8' : a) : '#7cc0e8'} />
                      {kind === 'bridge' && (<>
                        <rect x={120} y={80} width={80} height={60} rx={4} fill={a} />
                        <rect x={120} y={78} width={80} height={6} fill={bcol} />
                        <rect x={120} y={136} width={80} height={6} fill={bcol} />
                      </>)}
                    </g>
                  );
                }
                if (kind === 'fountain' || kind === 'pond') {
                  return (<g>
                    <ellipse cx={160} cy={110} rx={60} ry={38} fill="#7cc0e8" stroke={bcol} strokeWidth={6} />
                    {kind === 'fountain' && <circle cx={160} cy={110} r={12} fill={bcol} />}
                  </g>);
                }
                if (kind === 'rocks') return <g><rect x={130} y={90} width={60} height={40} rx={8} fill={a} /></g>;
                return (<g>
                  <rect x={155} y={110} width={10} height={40} fill={bcol} />
                  <circle cx={160} cy={100} r={34} fill={a} />
                </g>);
              })()}
            </svg>
          </div>

          {/* The controls, flat and all of them visible. Nothing is behind a fold: this is the one
              place an object is built, so it says everything it can do. */}
          {!canBuild && (
            <p className="mt-3 rounded-lg border border-border bg-muted/40 px-2.5 py-2 text-[11px] text-muted-foreground">
              The Developers are building it. How it gets made is theirs; what it has to be is on the right,
              and that is yours.
            </p>
          )}
          <div className={cn('mt-3 space-y-2 text-xs', !canBuild && 'hidden')}>
            {isHabitat && (<>
              <Row label="Footprint">
                {(['small', 'medium', 'large'] as const).map((k) => (
                  <Chip key={k} on={(item.enclosureSize ?? 'medium') === k} onClick={() => edit.onSetEnclosure(item.id, k)}>
                    {k === 'small' ? 'S' : k === 'medium' ? 'M' : 'L'}
                  </Chip>
                ))}
              </Row>
              <Row label="Shape">
                {ENCLOSURE_SHAPES.slice(0, 3).map((sh) => (
                  <Chip key={sh.key} on={(design.parts.shape ?? ENCLOSURE_SHAPES[0].key) === sh.key}
                    onClick={() => set({ parts: { ...design.parts, shape: sh.key } })}>{sh.label}</Chip>
                ))}
              </Row>
              <Row label="Ground">
                {GROUND.map((c) => (
                  <button key={c} type="button" aria-label={`Ground ${c}`}
                    onClick={() => set({ colors: { ...design.colors, ground: c } })}
                    className={cn(FOCUS, 'h-6 w-6 rounded-md border-2', design.colors?.ground === c ? 'border-primary' : 'border-border')}
                    style={{ background: c }} />
                ))}
              </Row>
              <Row label="Inside">
                {/* Everything that can go in a habitat, named for what it is. "Shelter" was the only
                    word offered for rocks, and half the planting was not offered at all - asked
                    while playing it: "what happened to rocks?" They were there, under another name.
                    Each one lands in the pen and can be dragged where you want it. */}
                <Chip onClick={() => edit.onAddInside?.(item.id, 'water')}>+ Water</Chip>
                {[...HABITAT_FEATURE_TYPES, ...PLANTING_TYPES].map((t) => (
                  <Chip key={t} onClick={() => edit.onAddInside?.(item.id, t)}>+ {t}</Chip>
                ))}
              </Row>
            </>)}

            {isAnimal && (<>
              <Row label="How many">
                {([
                  { label: 'One', group: { males: 1, females: 0, juveniles: 0, cubs: 0 } },
                  { label: 'A pair', group: { males: 1, females: 1, juveniles: 0, cubs: 0 } },
                  { label: 'A family', group: { males: 1, females: 1, juveniles: 1, cubs: 2 } },
                ] as const).map((g) => (
                  <Chip key={g.label} on={groupSize(design.group) === groupSize(g.group)}
                    onClick={() => set({ group: { ...g.group } })}>{g.label}</Chip>
                ))}
              </Row>
              <Row label="Coat">
                {['#c8761f', '#e0c9a6', '#5b4636'].map((c) => (
                  <button key={c} type="button" aria-label={`Coat ${c}`}
                    onClick={() => set({ colors: { ...design.colors, coat: c } })}
                    className={cn(FOCUS, 'h-6 w-6 rounded-full border-2', design.colors?.coat === c ? 'border-primary' : 'border-border')}
                    style={{ background: c }} />
                ))}
              </Row>
            </>)}

            {/* Scenery - a river, a bridge, a fountain, a stand of trees. It had no controls at all:
                the takeover opened on a blank preview and a Place button, so "the bridge is not
                configurable" was exactly right. What kind of thing it is, and the colours that kind
                has. Its size is set on the park, by dragging its edge, where you can see it. */}
            {isScenery && (<>
              <Row label="What kind">
                {SCENERY_TYPES.map((t) => (
                  <Chip key={t} on={(design.parts.type ?? item.template) === t}
                    onClick={() => set({ parts: { ...design.parts, type: t, piece: t }, colors: { ...design.colors, ...floraDefaultColors(t) } })}>{t}</Chip>
                ))}
              </Row>
              {floraColors(design.parts.type ?? item.template).map((slot) => (
                <Row key={slot.key} label={slot.label}>
                  {SCENERY_COLOURS.map((c) => (
                    <button key={c} type="button" aria-label={`${slot.label} ${c}`}
                      onClick={() => set({ colors: { ...design.colors, [slot.key]: c } })}
                      className={cn(FOCUS, 'h-6 w-6 rounded-md border-2', design.colors?.[slot.key] === c ? 'border-primary' : 'border-border')}
                      style={{ background: c }} />
                  ))}
                </Row>
              ))}
              <p className="text-[11px] text-muted-foreground">Its size is yours to set on the park: drag a corner once it is standing.</p>
            </>)}

            {isBuilding && (<>
              {/* A building's own colours. It could say what kind of thing it was and nothing else,
                  so every shop, cafe and kiosk in the park came out the same grey. */}
              {([['walls', 'Walls'], ['roof', 'Roof'], ['sign', 'Sign']] as const).map(([key, label]) => (
                <Row key={key} label={label}>
                  {BUILDING_COLOURS.map((c) => (
                    <button key={c} type="button" aria-label={`${label} ${c}`}
                      onClick={() => set({ colors: { ...design.colors, [key]: c } })}
                      className={cn(FOCUS, 'h-6 w-6 rounded-md border-2', design.colors?.[key] === c ? 'border-primary' : 'border-border')}
                      style={{ background: c }} />
                  ))}
                </Row>
              ))}
              <p className="text-[11px] text-muted-foreground">Its size is yours to set on the park: drag a corner once it is standing.</p>
            </>)}

            {isBuilding && (
              <Row label="What kind">
                {BUILDING_TYPES.slice(0, 4).map((t) => (
                  <Chip key={t} on={design.parts.type === t} onClick={() => set({ parts: { ...design.parts, type: t } })}>{t}</Chip>
                ))}
              </Row>
            )}
          </div>
        </section>

        {/* The item's own criteria, answered by the park with its working shown - and the ones that
            can only be answered once it is standing, tagged so the wait is not a mystery. */}
        <section className="min-w-0 space-y-3">
          <div data-part="takeover-criteria" className="rounded-lg border border-border bg-muted/30 p-3">
            <h3 className="text-sm font-bold">
              Acceptance criteria <span className="font-normal text-muted-foreground">&middot; {met} of {criteria.length}</span>
            </h3>
            <ul className="mt-2 space-y-2">
              {criteria.map((c) => {
                const v = checkCriterion(state, item, c);
                const where = checkedAt(c);
                return (
                  <li key={c} className="flex items-start gap-2">
                    {v?.met
                      ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-snug">{c}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {v?.evidence ?? (answerable(c) ? 'Checked when it stands on the park' : `${state.team.productOwner.name.replace(/\s*\(PO\)$/i, '')} judges this one`)}
                      </span>
                    </span>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      where === 'park' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-secondary text-secondary-foreground')}>
                      {where === 'park' ? 'on the park' : 'here'}
                    </span>
                  </li>
                );
              })}
            </ul>
            {/* What the park can answer, and what it never will. Saying "once all 4 are green"
                was a promise the game could not keep: one of the four is a judgement, and a learner
                waiting for it to tick itself has nothing left to try. */}
            <p className="mt-2 text-[11px] text-muted-foreground">
              {(() => {
                const facts = criteria.filter(answerable);
                const po = state.team.productOwner.name.replace(/\s*\(PO\)$/i, '');
                return facts.length === criteria.length
                  ? `${po} signs off once all ${criteria.length} are green.`
                  : `The park checks ${facts.length}. ${po} judges the rest, and signs off when you ask.`;
              })()}
            </p>
          </div>

          {/* Where it goes. For a habitat that is a site on the park; for an animal it is a habitat,
              and the picker says whether they would fit before anybody commits. */}
          <div data-part="where-it-goes" className="rounded-lg border border-border p-3">
            <h3 className="text-sm font-bold">{isAnimal ? 'Which habitat they live in' : 'Where it will go'}</h3>
            {!canBuild ? null : isAnimal ? (
              <ul className="mt-2 space-y-1.5">
                {habitats.map((h) => (
                  <li key={h.item.id}>
                    <button type="button" data-habitat={h.item.id}
                      onClick={() => onPutIn && h.built && onPutIn(item.id, h.item.id)}
                      disabled={!h.built}
                      className={cn(FOCUS, 'flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors',
                        item.enclosureId === h.item.id ? 'border-primary bg-primary/[0.06]'
                          : h.built ? 'border-border hover:border-primary/60' : 'cursor-not-allowed border-dashed border-border/60 opacity-60')}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{h.item.name}</span>
                        <span className={cn('block text-[11px]', h.built && !h.room ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground')}>
                          {h.line}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
                {!habitats.length && <li className="text-xs text-muted-foreground">No habitats in the Backlog yet.</li>}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                {item.pos
                  ? 'Standing on the park. Move it there, or place it again from here.'
                  : `Nothing chosen yet. ${isHabitat ? `${Math.round(size.w / 22)} × ${Math.round(size.h / 22)} tiles has to fit where you put it.` : 'Place it where visitors will meet it.'}`}
              </p>
            )}
          </div>
        </section>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <Button variant="outline" onClick={onClose}>{canBuild ? 'Keep as draft' : 'Close'}</Button>
        <span className="min-w-0 flex-1 text-[11px] text-muted-foreground">
          A draft stays in hand. Nothing is on the park until you place it.
        </span>
        {!canBuild ? null : isAnimal ? (
          <Button disabled={!chosen?.built || !onPutIn}
            title={chosen?.built ? undefined : 'Choose a habitat that is built'}
            onClick={() => chosen && onPutIn?.(item.id, chosen.item.id)}>
            {chosen ? `Put them in ${chosen.item.name}` : 'Choose a habitat'}
          </Button>
        ) : (
          <Button onClick={() => onPlace?.(item.id)}>Place on the park</Button>
        )}
      </footer>
    </div>
  );
}

/** One labelled row of controls. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Chip({ on, onClick, children }: { on?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cn(FOCUS, 'rounded-md border px-2 py-1 text-xs font-medium capitalize transition-colors',
        on ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted/60')}>
      {children}
    </button>
  );
}
