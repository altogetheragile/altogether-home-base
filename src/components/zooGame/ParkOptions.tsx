import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ZooGameState, BacklogItem } from './types';
import {
  currentDesign, floraColors, floraDefaultColors, ENCLOSURE_SIZE, ENCLOSURE_SHAPES,
  PLANTING_TYPES, HABITAT_FEATURE_TYPES, PATH_WIDTHS, PATH_SURFACES, LANDSCAPE_TYPES, BUILDING_TYPES, groupSize, piecesFor, pieceByKey, applyPiece, floraPalette,
  hasRoomToRoam, homeSizeOf, SWATCHES, coatWord, looksFor, isTank, groupChoices, BARRIERS, barrierOf,
  type ItemDesign,
} from './design';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { EYEBROW, FOCUS } from './ui/tokens';

// ============= The options strip =============
//
// One row under the park, naming what is selected and offering only what that object has. It is the
// same strip for building a thing and for changing it a week later, because they are the same act:
// there is no moment where an object is "being built" and a different set of controls applies.
//
// It replaces the build takeover. The takeover put the object on a bench of its own, which meant
// building something without being able to see where it stood, and turning or moving it only after
// closing the window. Everything is built on the park now, and the strip is what building with.
//
// Groups appear only if the object has them. A bridge has a deck and railings; a habitat has a
// footprint and an inside; a river has neither. Nothing here asks "what kind of thing is this?" for
// an object that came from a Product Backlog item - the card already said.

const BUILDING_COLOURS = ['#e6ddcf', '#cfd8e3', '#a4623a', '#3f6f4f', '#c8761f', '#6b7280'];
/** Everything, behind the "+". The strip shows the handful you reach for first; this is the rest,
 *  the same palette the bench used to open from every colour well. */
const ALL_COLOURS = [...new Set([
  ...BUILDING_COLOURS, ...SWATCHES,
  '#f2e6c9', '#b23a48', '#7a5230', '#2f4f4f', '#d9b382', '#9aa1a8',
  '#1f4e79', '#7b8f3a', '#c9a227', '#8e6bbf', '#e8e2d5', '#3a3a3a',
])];
const GROUND_COLOURS = ['#c8a06a', '#e0a642', '#a8cf8f', '#6b7280', '#e8e2d5'];
const FENCE_COLOURS = ['#8a6a3b', '#6b7280', '#3f6f4f', '#8fa3b0'];
/** What an animal's coat can be. */
const WATER_COLOURS = ['#2f8fc0', '#1f6f9a', '#3fb3a6', '#7cc0e8', '#2a4f7a'];
/** The planting a habitat can hold, and the loose scenery a planting card can be. */
const INSIDE_KINDS = ['water', ...HABITAT_FEATURE_TYPES, ...PLANTING_TYPES];

/** One labelled group of controls. */
function Group({ label, part, children }: { label: string; part?: string; children: React.ReactNode }) {
  return (
    <div data-part={part} className="flex min-w-0 shrink-0 items-center gap-1.5 border-l border-border pl-2.5 first:border-l-0 first:pl-0">
      <span className={cn(EYEBROW, 'shrink-0 text-muted-foreground')}>{label}</span>
      <div className="flex flex-wrap items-center gap-1">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children, title }: { on?: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={cn(FOCUS, 'rounded-md border px-2 py-1 text-xs font-medium capitalize transition-colors',
        on ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-muted/60')}>
      {children}
    </button>
  );
}

function Swatch({ hex, on, onClick, label }: { hex: string; on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" aria-label={`${label} ${hex}`} title={label} onClick={onClick}
      className={cn(FOCUS, 'h-6 w-6 rounded-md border-2', on ? 'border-primary' : 'border-border')}
      style={{ background: hex }} />
  );
}

/** The rest of the colours.
 *
 *  The strip is one row under the park, so it can hold about half a dozen swatches per part before
 *  it stops being a row. The bench it replaced opened a full palette from each colour well, and
 *  losing that was losing choices rather than tidying them: "we used to be able to select more
 *  colours for buildings". So the row keeps the handful worth reaching for first, and the rest are
 *  one press away - which is where they were before. */
function MoreColours({ label, current, options, onPick }: {
  label: string; current?: string; options: string[]; onPick: (hex: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={`More ${label.toLowerCase()} colours`} title={`More ${label.toLowerCase()} colours`}
          className={cn(FOCUS, 'flex h-6 w-6 items-center justify-center rounded-md border-2 border-dashed border-border text-muted-foreground hover:text-foreground')}>
          <Plus className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <div className="grid grid-cols-6 gap-1.5">
          {options.map((c) => (
            <button key={c} type="button" aria-label={`${label} ${c}`} title={c}
              onClick={() => { onPick(c); setOpen(false); }}
              className={cn(FOCUS, 'h-7 w-7 rounded-md border-2', current === c ? 'border-primary' : 'border-border')}
              style={{ background: c }} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export interface ParkOptionsApi {
  onDesign: (id: string, design: ItemDesign) => void;
  onAddInside?: (id: string, kind: string) => void;
  onSetEnclosure: (id: string, size: 'small' | 'medium' | 'large') => void;
  onTurn?: (id: string, rot: number) => void;
  /** Take it off the park: it goes back into your hands to be put down again. */
  onUnplace?: (id: string) => void;
  /** Look inside a habitat - the park zooms to it. */
  onInside?: (id: string | null) => void;
  /** Take a run of path back up. The bench that used to list an item's runs went with the takeover,
   *  and nothing replaced it: "we used to have joints on paths too and the ability to delete them."
   *  A run laid in the wrong place could not be picked up at all. */
  onRemoveRun?: (connectorId: string) => void;
  /** Plant another beside this one: a planting item is a clump, not one tree. */
  onAddCopy?: (id: string, piece: string) => void;
  /** Change what one of them is - an oak beside a bush beside a blossom. */
  onSetCopyPiece?: (id: string, index: number, piece: string) => void;
  /** Take one plant out of a clump, counting the item's own plant as the first of them - the list
   *  in the strip IS the clump, so the index it hands back is an index into all of it. */
  onRemovePlant?: (id: string, index: number) => void;
  /** Move an animal into a habitat - which is what "where it lives" means for an animal. */
  onPutIn?: (id: string, enclosureId: string) => void;
}

export function ParkOptions({ state, item, api, inside, drawing, onDrawing, className }: {
  state: ZooGameState;
  /** What is selected. Nothing selected, nothing to show. */
  item: BacklogItem | null;
  api: ParkOptionsApi;
  /** The habitat the park is zoomed into, if any. */
  inside?: BacklogItem | null;
  drawing?: boolean;
  onDrawing?: (on: boolean) => void;
  className?: string;
}) {
  const subject = inside ?? item;
  if (!subject) {
    return (
      <div data-part="park-options" className={cn('flex min-h-[2.75rem] items-center gap-2 text-xs text-muted-foreground', className)}>
        Pick a card to build it, or press something on the park to change it.
      </div>
    );
  }
  const design = currentDesign(subject);
  const set = (d: Partial<ItemDesign>) => api.onDesign(subject.id, { ...design, ...d });
  const kind = design.parts.type ?? subject.template ?? '';
  const isHabitat = subject.category === 'enclosure';
  const isScenery = subject.category === 'flora';
  const isBuilding = subject.category === 'amenity';
  const isPath = subject.category === 'path';
  const isAnimal = subject.category === 'exhibit';
  const placed = !!subject.pos;

  return (
    <div data-part="park-options" data-for={subject.id}
      className={cn('flex min-h-[2.75rem] flex-wrap items-center gap-x-3 gap-y-2', className)}>
      <span className="shrink-0 text-sm font-bold">{inside ? `Inside ${inside.name}` : subject.name}</span>

      {/* ---- inside a habitat: what goes in, and nothing about the fence ---- */}
      {inside && (
        <>
          <Group label="Add">
            {INSIDE_KINDS.map((k) => (
              <Chip key={k} onClick={() => api.onAddInside?.(inside.id, k)}>+ {k}</Chip>
            ))}
          </Group>
          <Group label="Back">
            <Chip onClick={() => api.onInside?.(null)}>Back to the park</Chip>
          </Group>
        </>
      )}

      {/* ---- a habitat ---- */}
      {!inside && isHabitat && (
        <>
          <Group label="Footprint">
            {(['small', 'medium', 'large'] as const).map((k) => (
              <Chip key={k} on={(subject.enclosureSize ?? 'medium') === k} onClick={() => api.onSetEnclosure(subject.id, k)}>
                {k === 'small' ? 'S' : k === 'medium' ? 'M' : 'L'}
              </Chip>
            ))}
          </Group>
          <Group label="Shape">
            {ENCLOSURE_SHAPES.map((sh) => (
              <Chip key={sh.key} on={(design.parts.shape ?? 'rect') === sh.key}
                onClick={() => set({ parts: { ...design.parts, shape: sh.key } })}>{sh.label}</Chip>
            ))}
          </Group>
          {/* Land or water. A reef is not kept in a field with a pond in the corner: it is kept in a
              tank, glass on every side and water to the top. Everything that swims gets one without
              being asked; everything else can be given one. */}
          {(() => {
            const living = state.backlog.filter((it) => it.enclosureId === subject.id);
            const tank = isTank(design, living, subject);
            return (
              <>
                <Group label="Holds">
                  <Chip on={!tank} onClick={() => set({ parts: { ...design.parts, ground: 'land' } })}>Land</Chip>
                  <Chip on={tank} onClick={() => set({ parts: { ...design.parts, ground: 'water' } })}>A tank</Chip>
                </Group>
                <Group label={tank ? 'Water' : 'Ground'}>
                  {(tank ? WATER_COLOURS : GROUND_COLOURS).map((c) => (
                    <Swatch key={c} hex={c} label={tank ? 'Water' : 'Ground'}
                      on={(tank ? design.colors?.water : design.colors?.ground) === c}
                      onClick={() => set({ colors: { ...design.colors, [tank ? 'water' : 'ground']: c } })} />
                  ))}
                  <MoreColours label={tank ? 'Water' : 'Ground'}
                    current={tank ? design.colors?.water : design.colors?.ground} options={ALL_COLOURS}
                    onPick={(c) => set({ colors: { ...design.colors, [tank ? 'water' : 'ground']: c } })} />
                </Group>
              </>
            );
          })()}
          {/* What holds them in - the one choice in the game that can be wrong in two directions.
              A hedge shows a lion beautifully and does not hold it; a wall holds it and hides it.
              What each one holds, and what the animals in here need, is in `barrierVerdict`, and the
              acceptance criterion says so in the words of the animal that would get out. */}
          <Group label="Holds them">
            {/* Asked WITH the animals in it, which is how the criterion asks. Without them, an
                unchosen barrier shows as a low hedge while the card says "a 4m fence, holds them" -
                two answers to one question, and the strip's one is the one that looks like a choice
                somebody made. Reported from playing it: "the hedge setting I picked defaults to high
                fence." */}
            {BARRIERS.map((b) => {
              const on = barrierOf(design, state.backlog.filter((it) => it.enclosureId === subject.id)).key === b.key;
              return (
                <button key={b.key} type="button" data-part={`barrier-${b.key}`} aria-pressed={on}
                  title={b.note} onClick={() => set({ parts: { ...design.parts, barrier: b.key } })}
                  className={cn(FOCUS, 'rounded-md border-2 px-2 py-1 text-[11px] font-medium',
                    on ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/60')}>
                  {b.label}
                </button>
              );
            })}
          </Group>
          <Group label="Fence">
            {FENCE_COLOURS.map((c) => (
              <Swatch key={c} hex={c} label="Fence" on={design.colors?.fence === c}
                onClick={() => set({ colors: { ...design.colors, fence: c } })} />
            ))}
          </Group>
          <Group label="Inside">
            <Chip onClick={() => api.onInside?.(subject.id)} title="Zoom the park to this habitat">Look inside</Chip>
          </Group>
        </>
      )}

      {/* ---- scenery: a river, a bridge, a stand of trees ---- */}
      {!inside && isScenery && (
        <>
          {/* A planting card is a kind of planting - that is a choice about the thing itself, not
              about what card it came from. Landscape features came from their card knowing what
              they are, so they are not asked again. */}
          {!LANDSCAPE_TYPES.includes(kind) && (
            <Group label="Kind">
              {PLANTING_TYPES.map((t) => (
                <Chip key={t} on={kind === t}
                  onClick={() => set({ parts: { ...design.parts, type: t, piece: t }, colors: { ...design.colors, ...floraDefaultColors(t) } })}>{t}</Chip>
              ))}
            </Group>
          )}
          {/* How big the plants grew - a sapling, a tree, a mature oak. A choice about the PLANT,
              which is why it is written into the design beside what kind it is and what colour it
              is, and why both drawings read it. These chips used to write a rectangle on the park
              instead, which made the plan draw a bigger slab and changed nothing anywhere else.
              Reported from playing it: "what's the point of expanding the trees?" */}
          {!LANDSCAPE_TYPES.includes(kind) && (
            <Group label="Size">
              {(['small', 'medium', 'large'] as const).map((key) => (
                <Chip key={key} on={(design.parts.size ?? 'medium') === key}
                  title={{ small: 'A sapling', medium: 'A tree', large: 'A mature one' }[key]}
                  onClick={() => set({ parts: { ...design.parts, size: key } })}>{key[0].toUpperCase()}</Chip>
              ))}
            </Group>
          )}
          {/* A planting item is a CLUMP, not one plant. The model has always held several - each
              with its own kind and its own spot on the park, and the park has always drawn them and
              let them be dragged - but the strip never grew the control, so a planting card was one
              tree of one kind. Reported from playing it: "we can only add one tree and one type of
              tree. There used to be the ability to plant multiple trees of different types." */}
          {!LANDSCAPE_TYPES.includes(kind) && api.onAddCopy && (
            <Group label="Plant another">
              {piecesFor(kind).map((p) => (
                <Chip key={p.key} title={`Add a ${p.label.toLowerCase()} beside it`}
                  onClick={() => api.onAddCopy?.(subject.id, p.key)}>+ {p.label}</Chip>
              ))}
            </Group>
          )}
          {/* What it is planted with, and the way to take one out again - the same shape as a
              pathway's runs, because it is the same kind of list: the pieces this one item is.
              THE WHOLE clump, the item's own plant first. It used to list the extra plants only,
              under a heading that counted them all: "2 plants" over one row. So the first press of
              "Plant another" put a second tree beside a tree nobody had been shown a row for, and
              from the park it read as one press planting two. Reported from playing it: "I add an
              oak and two appear." One question, one answer - the list IS the clump. */}
          {(() => {
            const copies = subject.copies ?? [];
            if (!api.onSetCopyPiece) return null;
            const own = design.parts.piece ?? piecesFor(kind)[0]?.key ?? '';
            const clump = [{ piece: own }, ...copies];
            return (
              <Group part="plants" label={`${clump.length} ${clump.length === 1 ? 'plant' : 'plants'}`}>
                {clump.map((c, i) => {
                  const piece = pieceByKey(c.piece) ?? piecesFor(kind)[0];
                  // Taking out the first plant is the next one taking its place: a planting item has
                  // to plant something, so the last plant standing cannot be pulled up.
                  const last = i === 0 && !copies.length;
                  return (
                    <span key={i === 0 ? 'own' : `${(c as { x?: number }).x}-${(c as { y?: number }).y}-${i}`}
                      className="flex items-center gap-0.5">
                      <select value={c.piece ?? piece?.key ?? ''} data-part={`copy-${i}`}
                        title={i === 0 ? 'The plant this card arrived as' : undefined}
                        onChange={(e) => (i === 0
                          ? set(applyPiece(design, pieceByKey(e.target.value) ?? piecesFor(kind)[0]))
                          : api.onSetCopyPiece?.(subject.id, i - 1, e.target.value))}
                        className={cn(FOCUS, 'rounded-md border border-border bg-card px-1 py-1 text-[11px] font-medium')}>
                        {piecesFor(kind).map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </select>
                      {api.onRemovePlant && (
                        <button type="button" data-part={`remove-copy-${i}`} disabled={last}
                          title={last ? 'A planting has to plant something' : `Take this ${piece?.label.toLowerCase() ?? 'plant'} out`}
                          aria-label={`Take plant ${i + 1} out`}
                          onClick={() => api.onRemovePlant?.(subject.id, i)}
                          className={cn(FOCUS, 'rounded-md border border-border bg-card p-1 text-muted-foreground hover:border-destructive/60 hover:text-destructive disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted-foreground')}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </Group>
            );
          })()}
          {floraColors(kind).map((slot) => (
            <Group key={slot.key} label={slot.label}>
              {floraPalette(slot.key, kind).map((c) => (
                <Swatch key={c} hex={c} label={slot.label} on={design.colors?.[slot.key] === c}
                  onClick={() => set({ colors: { ...design.colors, [slot.key]: c } })} />
              ))}
            </Group>
          ))}
        </>
      )}

      {/* ---- an animal: how many of them there are, and what they look like ---- */}
      {!inside && isAnimal && (
        <>
          {/* How many, in the words this animal's keeper would use. A lion lives alone, in a pair
              or in a family; a reef shoals. One / pair / family was a mammal's social life offered
              to everything in the zoo - and a shoal of six was the most a tank could hold. */}
          <Group label="How many">
            {groupChoices(subject).map(({ label, group }) => (
              <Chip key={label} on={groupSize(design.group) === groupSize(group)}
                onClick={() => set({ group: { ...group } })}>{label}</Chip>
            ))}
          </Group>
          {/* What choosing a family costs, said where the choice is made. It used to be said nowhere
              at all out here: picking a family quietly failed a criterion two panels away, and the
              only visible change was the "Ask Priya" button disappearing. This is the one place in
              the game where one Backlog item's design is measured against another's, and it is the
              reason stocking is a decision rather than a setting. */}
          {(() => {
            const home = homeSizeOf(subject, state.backlog);
            const species = subject.template ?? subject.id;
            if (!design.group || hasRoomToRoam(design.group, home, species)) return null;
            const roomy = (['small', 'medium', 'large'] as const).find((k) => hasRoomToRoam(design.group!, k, species));
            return (
              <p data-part="crowded" className="max-w-[13rem] text-[11px] leading-snug text-amber-700 dark:text-amber-300">
                {groupSize(design.group)} in a {home ?? 'medium'} habitat &middot;{' '}
                {roomy ? `they need a ${roomy} one` : 'too many for any habitat'}
              </p>
            );
          })()}
          {/* A few named looks rather than a palette. "White" is a white lion - the thing a zoo puts
              on its posters, and what the enthusiasts come for - where "#f0efe9" is a decision with
              no opinion in it. The same argument that gave the planting ready pieces: you choose an
              oak, not a green. A fish gets its own list and its own word, because a row of browns
              labelled "Coat" is the wrong control in the wrong words for a reef. */}
          <Group label={coatWord(subject) === 'Coat' ? 'Look' : 'Colour'}>
            {looksFor(subject).map((look) => {
              const on = (design.colors?.coat ?? looksFor(subject)[0].coat) === look.coat;
              return (
                <button key={look.key} type="button" data-part={`look-${look.key}`} aria-pressed={on}
                  onClick={() => set({ colors: { ...design.colors, coat: look.coat } })}
                  className={cn(FOCUS, 'inline-flex items-center gap-1.5 rounded-md border-2 px-2 py-1 text-[11px] font-medium',
                    on ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/60')}>
                  <span className="h-3 w-3 shrink-0 rounded-full border border-black/20" style={{ background: look.coat }} />
                  {look.label}
                </button>
              );
            })}
          </Group>
          {/* Where they live. An animal has no place of its own on the park - it lives inside a
              habitat - so "move" for an animal means moving house. */}
          <Group label="Lives in">
            {state.backlog.filter((it) => it.category === 'enclosure' && (it.design || it.draftDesign)).map((h) => (
              <Chip key={h.id} on={subject.enclosureId === h.id} onClick={() => api.onPutIn?.(subject.id, h.id)}>{h.name}</Chip>
            ))}
          </Group>
        </>
      )}

      {/* ---- a building: what sort of building it is, and its colours ---- */}
      {!inside && isBuilding && (
        <Group label="Type">
          {BUILDING_TYPES.slice(0, 5).map((t) => (
            <Chip key={t} on={kind === t} onClick={() => set({ parts: { ...design.parts, type: t } })}>{t}</Chip>
          ))}
        </Group>
      )}
      {/* Walls, roof, the board over the front - and the door, which is the part you aim at a path.
          It was not offered at all out here, though the drawing has always had one. */}
      {!inside && isBuilding && ([['walls', 'Walls'], ['roof', 'Roof'], ['door', 'Door'], ['sign', 'Sign']] as const).map(([key, label]) => (
        <Group key={key} label={label}>
          {BUILDING_COLOURS.map((c) => (
            <Swatch key={c} hex={c} label={label} on={design.colors?.[key] === c}
              onClick={() => set({ colors: { ...design.colors, [key]: c } })} />
          ))}
          <MoreColours label={label} current={design.colors?.[key]} options={ALL_COLOURS}
            onPick={(c) => set({ colors: { ...design.colors, [key]: c } })} />
        </Group>
      ))}

      {/* ---- the pen: for a pathway, and for anything that has to be joined to the way in ---- */}
      {/* The same three controls for all of them, because it is the same work: the pen, how wide the
          path is, and the runs already laid with a way to take one back up. A habitat was offered the
          pen alone - so a player could draw its way in and then not say how wide it was, while the
          same path drawn from a pathway item could be a track or a boulevard.
          A BUILDING was offered nothing. A kiosk is asked "can I walk to it from the way in?" like
          everything else, and had no pen to answer it with, so the one criterion the park can settle
          for a facility could only ever be waived. Reported from playing it: "all buildings need to
          be connected by paths. Only the enclosures has this as part of the PBI."
          Not `placed`: that asks whether somebody has DRAGGED it, and a habitat the park seated
          itself is standing on the park just as much as one you moved. Gating on it meant a player
          who never dragged their pen was offered no pen to draw with, and the one criterion the park
          answers by looking for a path could not be met by hand at all. */}
      {!inside && (isPath || isHabitat || isBuilding) && (
        <>
          {onDrawing && (
            <Group label={isPath ? 'Draw' : 'Path to it'}>
              <Chip on={!!drawing} onClick={() => onDrawing?.(!drawing)}>
                {drawing ? 'Drawing - click where it starts, then where it ends'
                  : isPath ? 'Draw a run' : 'Draw a path to it'}
              </Chip>
            </Group>
          )}
          <Group label="Width">
            {PATH_WIDTHS.map((w) => (
              <Chip key={w.key} on={design.parts.thickness === w.key}
                onClick={() => set({ parts: { ...design.parts, thickness: w.key } })}>{w.label}</Chip>
            ))}
          </Group>
          {/* The runs this pathway is made of, and the way to take one back up. */}
          {(() => {
            const runs = (state.connectors ?? []).filter((c) => c.itemId === subject.id);
            if (!runs.length) return null;
            const named = (end: { featureId?: string }) => (end.featureId
              ? state.backlog.find((x) => x.id === end.featureId)?.name : null);
            return (
              <Group label={`${runs.length} run${runs.length === 1 ? '' : 's'}`}>
                {runs.map((c, i) => {
                  const from = named(c.a), to = named(c.b);
                  const where = from && to ? `${from} to ${to}` : from ? `from ${from}` : to ? `to ${to}` : 'across the grass';
                  return api.onRemoveRun ? (
                    <button key={c.id} type="button" data-part="remove-run"
                      onClick={() => api.onRemoveRun?.(c.id)}
                      title={`Take run ${i + 1} back up - ${where}`}
                      aria-label={`Take run ${i + 1} back up, ${where}`}
                      className={cn(FOCUS, 'flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-muted-foreground hover:border-destructive/60 hover:text-destructive')}>
                      <span className="h-1.5 w-4 rounded-full" style={{ background: c.color }} aria-hidden />
                      {i + 1}
                      <Trash2 className="h-3 w-3" />
                    </button>
                  ) : null;
                })}
              </Group>
            );
          })()}
          <Group label="Surface">
            {PATH_SURFACES.map((c) => (
              <Swatch key={c.hex} hex={c.hex} label={c.label} on={design.colors?.path === c.hex}
                onClick={() => set({ colors: { ...design.colors, path: c.hex } })} />
            ))}
          </Group>
        </>
      )}

      {/* ---- what every object standing on the park can do ---- */}
      {!inside && !isPath && !isAnimal && (
        <Group label="On the park">
          {api.onTurn && (
            <Chip onClick={() => api.onTurn?.(subject.id, ((subject.rot ?? 0) + 90) % 360)}
              title="Turn it a quarter">Turn</Chip>
          )}
          {placed && api.onUnplace && (
            <Chip onClick={() => api.onUnplace?.(subject.id)}
              title="Take it off the park and put it down again">Move</Chip>
          )}
        </Group>
      )}

      {/* What a habitat's footprint is, in the units the criteria are measured in. */}
      {!inside && isHabitat && (
        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
          {Math.round(ENCLOSURE_SIZE[subject.enclosureSize ?? 'medium'].w / 22)} &times;{' '}
          {Math.round(ENCLOSURE_SIZE[subject.enclosureSize ?? 'medium'].h / 22)} tiles
          {state.backlog.some((it) => it.enclosureId === subject.id) ? '' : ' · nothing lives here yet'}
        </span>
      )}
    </div>
  );
}
