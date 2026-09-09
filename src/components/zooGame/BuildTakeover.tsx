import { useEffect } from 'react';
import type { ZooGameState, BacklogItem } from './types';
import type { EditApi } from './ParkView';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EYEBROW, FOCUS } from './ui/tokens';
import { answerable, checkCriterion, checkedAt } from './parkChecks';
import { addWaterTo, addFloraTo, enclosureWater, enclosureFlora, ENCLOSURE_SIZE, ENCLOSURE_SHAPES, PLANTING_TYPES, HABITAT_FEATURE_TYPES, BUILDING_TYPES, groupSize, hasRoomToRoam, designSatisfiesTask, currentDesign } from './design';
import { isSignOffTask } from './engine';
import { Check, Circle, X } from 'lucide-react';

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
  const size = ENCLOSURE_SIZE[item.enclosureSize ?? 'medium'];

  const set = (d: Partial<typeof design>) => edit.onDesign(item.id, { ...design, ...d });

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
                      <ellipse key={i} cx={x + w * (wf.x + wf.w / 2)} cy={y + h * (wf.y + wf.h / 2)}
                        rx={(w * wf.w) / 2} ry={(h * wf.h) / 2} fill="#7cc0e8" />
                    ))}
                    {enclosureFlora(design).map((f, i) => (
                      /rock|shelter/i.test(f.type)
                        ? <rect key={i} x={x + w * f.x - 14} y={y + h * f.y - 10} width={28} height={20} rx={3} fill="#8a5a2b" />
                        : <circle key={i} cx={x + w * f.x} cy={y + h * f.y} r={9} fill="#3f8f43" />
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
                <rect x={110} y={70} width={100} height={80} rx={4} fill={design.colors?.wall ?? '#cfd8e3'} stroke="#6b7c93" strokeWidth={4} />
              )}
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
                {/* Into the habitat's own design, like the water and the planting beside it. It used
                    to drop a copy on the park instead, so a shelter you had plainly added was
                    invisible to "can I tell an animal lives here, not a shed?" - a criterion nobody
                    could satisfy however much they built. */}
                <Chip onClick={() => set({ flora: addFloraTo(design, HABITAT_FEATURE_TYPES[0]) })}>+ Shelter</Chip>
                <Chip onClick={() => set({ water: addWaterTo(design) })}>+ Water</Chip>
                {PLANTING_TYPES.slice(0, 2).map((t) => (
                  <Chip key={t} onClick={() => set({ flora: addFloraTo(design, t) })}>+ {t}</Chip>
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
