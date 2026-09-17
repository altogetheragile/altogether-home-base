import { useState } from 'react';
import { Plus, Trash2, Check, ChevronDown } from 'lucide-react';
import type { ZooGameState, BacklogItem } from './types';
import {
  currentDesign, floraColors, floraDefaultColors, ENCLOSURE_SIZE, ENCLOSURE_SHAPES,
  PLANTING_TYPES, HABITAT_FEATURE_TYPES, PATH_WIDTHS, PATH_SURFACES, LANDSCAPE_TYPES, BUILDING_TYPES, groupSize, piecesFor, pieceByKey, applyPiece, floraPalette,
  hasRoomToRoam, homeSizeOf, SWATCHES, coatWord, looksFor, isTank, groupChoices, BARRIERS, barrierOf,
  type ItemDesign,
} from './design';
import { groupsFor, openCriteria, wouldSettle, isAbout, labelOf, type GroupDef, type GroupId } from './buildGroups';
import { inspect } from './parkChecks';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { EYEBROW, FOCUS } from './ui/tokens';

// ============= The build strip =============
//
// One row above the park: what is selected, how far off Done it is, and one button per part of the
// work. Pressing a button opens that part's controls under it.
//
// It used to be every control the object had, laid out flat. Five rows for a habitat, about fifty
// targets, all the same weight: the swatch that changes the fence colour sat beside the choice of
// barrier that decides whether the lion gets out, in the same size, in the same tone.
//
// So the strip now says which press matters. A group of controls declares what it can settle
// (buildGroups.ts), the criteria are asked of the selected object, and any group holding the answer
// to a question this object is currently failing is lit. The player follows the lights, and "Needs
// only" hides the rest of it until they want to style the thing.
//
// Groups appear only if the object has them, and that list comes from the registry rather than from
// conditions written out here a second time: a bridge has a deck and railings, a habitat has a
// footprint and an inside, a river has neither.

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

/** One labelled row inside an open panel.
 *
 *  An empty label takes no column at all. Most panels hold a single row whose name is the name of
 *  the button that opened them, and "Inside: Inside" is a word doing no work. */
function Row({ label, part, children }: { label: string; part?: string; children: React.ReactNode }) {
  return (
    <div data-part={part} className="flex min-w-0 items-start gap-2 py-1">
      {label && <span className={cn(EYEBROW, 'w-16 shrink-0 pt-1.5 text-muted-foreground')}>{label}</span>}
      <div className="flex flex-wrap items-center gap-1">{children}</div>
    </div>
  );
}

/** One part of the work, as a button on the strip that opens its controls.
 *
 *  Lit when it holds the answer to something this object is failing. The light is a dot rather than
 *  a colour change on the button: a row of buttons that change colour is a row where nothing stands
 *  out, and the dot is the only thing on the strip moving. */
function Menu({ group, label, lit, busy, onClosed, children }: {
  group: GroupDef; label: string; lit: boolean;
  /** A mode this menu turned on is still running - the pen is out. Said on the button, because the
   *  menu is shut and the mode is not. */
  busy?: boolean;
  /** Closing the menu puts away whatever it turned on. */
  onClosed?: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) onClosed?.(); }}>
      <PopoverTrigger asChild>
        <button type="button" data-part={`group-${group.id}`} data-lit={lit ? 'yes' : 'no'}
          data-drawing={busy ? 'yes' : undefined}
          title={busy ? `${label} - the pen is out` : lit ? `${label} - something here would finish this item` : label}
          className={cn(FOCUS, 'flex h-9 shrink-0 items-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-colors',
            open || busy ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-muted/60')}>
          {label}
          {lit && <span data-part="lit" aria-label="would finish this item"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />}
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" data-part={`panel-${group.id}`} className="w-[19rem] p-2"
        // The park is the drawing surface, so a press on it must not shut the menu the pen lives
        // in: closing is what puts the pen away, and a menu that closed on the first press would
        // put it away before the first point landed.
        onInteractOutside={busy ? (e) => e.preventDefault() : undefined}>
        {children}
      </PopoverContent>
    </Popover>
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
 *  The bench this replaced opened a full palette from each colour well, and losing that was losing
 *  choices rather than tidying them: "we used to be able to select more colours for buildings". So
 *  each panel keeps the handful worth reaching for first, and the rest are one press away. */
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
  /** What a facility offers - the thing the visitors' needs are counted against. */
  onSetServices?: (id: string, services: 'food' | 'toilet' | 'rest' | null) => void;
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
  /** Open the card, from the chip that names it. The criteria are the item's, so the place to read
   *  them all is the item. */
  onOpenCard?: (id: string) => void;
  /** Offer the finished work to the Product Owner. This used to live on a pill floating under the
   *  object on the park; it belongs beside the controls that finished it. */
  onAskToCheck?: (id: string) => void;
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
  // On by default. The strip opens showing the work rather than the styling, and the styling is one
  // press away - which is the right way round for a team with a Sprint Goal.
  const [needsOnly, setNeedsOnly] = useState(true);
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
  const placed = !!subject.pos;
  const living = state.backlog.filter((it) => it.enclosureId === subject.id);
  const tank = isTank(design, living, subject);

  const open = openCriteria(state, subject);
  const how = inspect(state, subject);
  const all = groupsFor(subject);
  const lit = (g: GroupDef) => wouldSettle(g, open);
  // With the filter on, the strip is the controls this item's criteria are ABOUT - met or not - and
  // the dots say which of them are still outstanding. Filtering on "still open" instead would take
  // a button away the moment it was used, which is how you lose the control you change your mind
  // with. Filtering towards nothing empties the strip altogether, and an empty strip looks broken:
  // a tree is asked nothing the park can check, and styling it is the entire point of one.
  const about = (g: GroupDef) => isAbout(g, subject);
  const shown = needsOnly && all.some(about) ? all.filter(about) : all;

  /** The controls for one part of the work. Each of these is what used to sit on the flat strip. */
  const body = (id: GroupId, menu: string) => {
    /** A row keeps its label only where it says something the menu did not. */
    const L = (label: string) => (label.toLowerCase() === menu.toLowerCase() ? '' : label);
    switch (id) {
      case 'footprint':
        return (
          <Row label={L('Size')}>
            {(['small', 'medium', 'large'] as const).map((k) => (
              <Chip key={k} on={(subject.enclosureSize ?? 'medium') === k} onClick={() => api.onSetEnclosure(subject.id, k)}>
                {k === 'small' ? 'S' : k === 'medium' ? 'M' : 'L'}
              </Chip>
            ))}
            <span className="w-full pt-1 text-[11px] text-muted-foreground">
              {Math.round(ENCLOSURE_SIZE[subject.enclosureSize ?? 'medium'].w / 22)} &times;{' '}
              {Math.round(ENCLOSURE_SIZE[subject.enclosureSize ?? 'medium'].h / 22)} tiles
              {living.length ? '' : ' · nothing lives here yet'}
            </span>
          </Row>
        );
      case 'shape':
        return (
          <Row label={L('Shape')}>
            {ENCLOSURE_SHAPES.map((sh) => (
              <Chip key={sh.key} on={(design.parts.shape ?? 'rect') === sh.key}
                onClick={() => set({ parts: { ...design.parts, shape: sh.key } })}>{sh.label}</Chip>
            ))}
          </Row>
        );
      // Land or water. A reef is not kept in a field with a pond in the corner: it is kept in a
      // tank, glass on every side and water to the top. Everything that swims gets one without
      // being asked; everything else can be given one.
      case 'holds':
        return (
          <Row label={L('Holds')}>
            <Chip on={!tank} onClick={() => set({ parts: { ...design.parts, ground: 'land' } })}>Land</Chip>
            <Chip on={tank} onClick={() => set({ parts: { ...design.parts, ground: 'water' } })}>A tank</Chip>
          </Row>
        );
      case 'ground':
        return (
          <Row label={L(tank ? 'Water' : 'Ground')}>
            {(tank ? WATER_COLOURS : GROUND_COLOURS).map((c) => (
              <Swatch key={c} hex={c} label={tank ? 'Water' : 'Ground'}
                on={(tank ? design.colors?.water : design.colors?.ground) === c}
                onClick={() => set({ colors: { ...design.colors, [tank ? 'water' : 'ground']: c } })} />
            ))}
            <MoreColours label={tank ? 'Water' : 'Ground'}
              current={tank ? design.colors?.water : design.colors?.ground} options={ALL_COLOURS}
              onPick={(c) => set({ colors: { ...design.colors, [tank ? 'water' : 'ground']: c } })} />
          </Row>
        );
      // What holds them in - the one choice in the game that can be wrong in two directions. A hedge
      // shows a lion beautifully and does not hold it; a wall holds it and hides it. What each one
      // holds, and what the animals in here need, is in `barrierVerdict`, and the acceptance
      // criterion says so in the words of the animal that would get out.
      case 'barrier':
        return (
          <Row label={L('Barrier')}>
            {/* Asked WITH the animals in it, which is how the criterion asks. Without them, an
                unchosen barrier shows as a low hedge while the card says "a 4m fence, holds them" -
                two answers to one question, and the strip's one is the one that looks like a choice
                somebody made. Reported from playing it: "the hedge setting I picked defaults to high
                fence." */}
            {BARRIERS.map((b) => {
              const on = barrierOf(design, living).key === b.key;
              return (
                <button key={b.key} type="button" data-part={`barrier-${b.key}`} aria-pressed={on}
                  title={b.note} onClick={() => set({ parts: { ...design.parts, barrier: b.key } })}
                  className={cn(FOCUS, 'rounded-md border-2 px-2 py-1 text-[11px] font-medium',
                    on ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/60')}>
                  {b.label}
                </button>
              );
            })}
          </Row>
        );
      case 'fence':
        return (
          <Row label={L('Fence')}>
            {FENCE_COLOURS.map((c) => (
              <Swatch key={c} hex={c} label="Fence" on={design.colors?.fence === c}
                onClick={() => set({ colors: { ...design.colors, fence: c } })} />
            ))}
          </Row>
        );
      case 'inside':
        return (
          <Row label={L('Inside')}>
            <Chip onClick={() => api.onInside?.(subject.id)} title="Zoom the park to this habitat">Look inside</Chip>
            <span className="w-full pt-1 text-[11px] text-muted-foreground">
              The ground, the planting and the water are in here. A hatched box with none of them is a pen.
            </span>
          </Row>
        );

      // ---- an animal ----
      case 'stock':
        return (
          <>
            {/* How many, in the words this animal's keeper would use. A lion lives alone, in a pair
                or in a family; a reef shoals. One / pair / family was a mammal's social life offered
                to everything in the zoo - and a shoal of six was the most a tank could hold. */}
            <Row label={L('How many')}>
              {groupChoices(subject).map(({ label, group }) => (
                <Chip key={label} on={groupSize(design.group) === groupSize(group)}
                  onClick={() => set({ group: { ...group } })}>{label}</Chip>
              ))}
            </Row>
            {/* What choosing a family costs, said where the choice is made. It used to be said
                nowhere at all: picking a family quietly failed a criterion two panels away, and the
                only visible change was the "Ask Priya" button disappearing. */}
            {(() => {
              const home = homeSizeOf(subject, state.backlog);
              const species = subject.template ?? subject.id;
              if (!design.group || hasRoomToRoam(design.group, home, species)) return null;
              const roomy = (['small', 'medium', 'large'] as const).find((k) => hasRoomToRoam(design.group!, k, species));
              return (
                <p data-part="crowded" className="px-1 pt-1 text-[11px] leading-snug text-amber-700 dark:text-amber-300">
                  {groupSize(design.group)} in a {home ?? 'medium'} habitat &middot;{' '}
                  {roomy ? `they need a ${roomy} one` : 'too many for any habitat'}
                </p>
              );
            })()}
          </>
        );
      // A few named looks rather than a palette. "White" is a white lion - the thing a zoo puts on
      // its posters - where "#f0efe9" is a decision with no opinion in it.
      case 'look':
        return (
          <Row label={L(coatWord(subject) === 'Coat' ? 'Look' : 'Colour')}>
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
          </Row>
        );
      // Where they live. An animal has no place of its own on the park - it lives inside a habitat -
      // so "move" for an animal means moving house.
      case 'lives-in':
        return (
          <Row label={L('Lives in')}>
            {state.backlog.filter((it) => it.category === 'enclosure' && (it.design || it.draftDesign)).map((h) => (
              <Chip key={h.id} on={subject.enclosureId === h.id} onClick={() => api.onPutIn?.(subject.id, h.id)}>{h.name}</Chip>
            ))}
          </Row>
        );

      // ---- a building ----
      case 'type':
        return (
          <Row label={L('Type')}>
            {BUILDING_TYPES.slice(0, 5).map((t) => (
              <Chip key={t} on={kind === t} onClick={() => set({ parts: { ...design.parts, type: t } })}>{t}</Chip>
            ))}
          </Row>
        );
      // What it OFFERS, which is a different question from what it looks like.
      //
      // The zoo counts three things a visitor needs: somewhere to eat, a toilet, somewhere to sit.
      // The simulation has always read this field and nothing in the game ever set it, so a building
      // could be designed, built, opened and meet nobody's need. Reported from playing it: "how is
      // this a criteria? How do we fulfil this?"
      case 'offers':
        return (
          <Row label={L('Offers')}>
            {([['food', 'Food and drink'], ['toilet', 'Toilets'], ['rest', 'Somewhere to sit']] as const).map(([k, label]) => (
              <Chip key={k} on={subject.services === k}
                onClick={() => api.onSetServices?.(subject.id, subject.services === k ? null : k)}>{label}</Chip>
            ))}
            {!subject.services && (
              <span className="w-full pt-1 text-[11px] text-muted-foreground">nothing visitors need, yet</span>
            )}
          </Row>
        );
      // Walls, roof, the board over the front - and the door, which is the part you aim at a path.
      // The sign is the one that is not a decoration: a building says what it is, or it is a shed
      // with a queue outside it.
      case 'colours':
        return (
          <>
            {([['sign', 'Sign'], ['walls', 'Walls'], ['roof', 'Roof'], ['door', 'Door']] as const).map(([key, label]) => (
              <Row key={key} label={label}>
                {BUILDING_COLOURS.map((c) => (
                  <Swatch key={c} hex={c} label={label} on={design.colors?.[key] === c}
                    onClick={() => set({ colors: { ...design.colors, [key]: c } })} />
                ))}
                <MoreColours label={label} current={design.colors?.[key]} options={ALL_COLOURS}
                  onPick={(c) => set({ colors: { ...design.colors, [key]: c } })} />
              </Row>
            ))}
          </>
        );

      // ---- planting ----
      case 'planting':
        return (
          <>
            {/* A planting card is a kind of planting - a choice about the thing itself, not about
                what card it came from. Landscape features came from their card knowing what they
                are, so they are not asked again. */}
            {!LANDSCAPE_TYPES.includes(kind) && (
              <Row label="Kind">
                {PLANTING_TYPES.map((t) => (
                  <Chip key={t} on={kind === t}
                    onClick={() => set({ parts: { ...design.parts, type: t, piece: t }, colors: { ...design.colors, ...floraDefaultColors(t) } })}>{t}</Chip>
                ))}
              </Row>
            )}
            {/* How big the plants grew - a sapling, a tree, a mature oak. A choice about the PLANT,
                which is why both drawings read it. These chips used to write a rectangle on the park
                instead: "what's the point of expanding the trees?" */}
            {!LANDSCAPE_TYPES.includes(kind) && (
              <Row label={L('Size')}>
                {(['small', 'medium', 'large'] as const).map((key) => (
                  <Chip key={key} on={(design.parts.size ?? 'medium') === key}
                    title={{ small: 'A sapling', medium: 'A tree', large: 'A mature one' }[key]}
                    onClick={() => set({ parts: { ...design.parts, size: key } })}>{key[0].toUpperCase()}</Chip>
                ))}
              </Row>
            )}
            {/* A planting item is a CLUMP, not one plant: "we can only add one tree and one type of
                tree. There used to be the ability to plant multiple trees of different types." */}
            {!LANDSCAPE_TYPES.includes(kind) && api.onAddCopy && (
              <Row label="Plant another">
                {piecesFor(kind).map((p) => (
                  <Chip key={p.key} title={`Add a ${p.label.toLowerCase()} beside it`}
                    onClick={() => api.onAddCopy?.(subject.id, p.key)}>+ {p.label}</Chip>
                ))}
              </Row>
            )}
            {/* What it is planted with, and the way to take one out again. THE WHOLE clump, the
                item's own plant first. It used to list the extra plants only, under a heading that
                counted them all, so one press read as planting two: "I add an oak and two appear."
                One question, one answer - the list IS the clump. */}
            {(() => {
              const copies = subject.copies ?? [];
              if (!api.onSetCopyPiece) return null;
              const own = design.parts.piece ?? piecesFor(kind)[0]?.key ?? '';
              const clump = [{ piece: own }, ...copies];
              return (
                <Row part="plants" label={`${clump.length} ${clump.length === 1 ? 'plant' : 'plants'}`}>
                  {clump.map((c, i) => {
                    const piece = pieceByKey(c.piece) ?? piecesFor(kind)[0];
                    // Taking out the first plant is the next one taking its place: a planting item
                    // has to plant something, so the last plant standing cannot be pulled up.
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
                </Row>
              );
            })()}
            {floraColors(kind).map((slot) => (
              <Row key={slot.key} label={slot.label}>
                {floraPalette(slot.key, kind).map((c) => (
                  <Swatch key={c} hex={c} label={slot.label} on={design.colors?.[slot.key] === c}
                    onClick={() => set({ colors: { ...design.colors, [slot.key]: c } })} />
                ))}
              </Row>
            ))}
          </>
        );

      // ---- the pen ----
      // The pen, how wide the path is, the runs already laid and what they are surfaced in. Four
      // groups on the flat strip, and one piece of work: laying a path.
      //
      // A habitat was offered the pen alone, so a player could draw its way in and then not say how
      // wide it was. A BUILDING was offered nothing, though a kiosk is asked "can I walk to it from
      // the way in?" like everything else: "all buildings need to be connected by paths. Only the
      // enclosures has this as part of the PBI."
      case 'path':
        return (
          <>
            {onDrawing && (
              <Row label={L(subject.category === 'path' ? 'Draw' : 'Path to it')}>
                <Chip on={!!drawing} onClick={() => onDrawing?.(!drawing)}>
                  {drawing ? 'Drawing - press each corner in turn'
                    : subject.category === 'path' ? 'Draw a run' : 'Draw a path to it'}
                </Chip>
                {drawing && (
                  <span className="w-full pt-1 text-[11px] text-muted-foreground">
                    Each press carries on from the last, so the path bends where you stop. Press the
                    same spot twice to finish one, or reach the thing you were heading for. Closing
                    this menu puts the pen away.
                  </span>
                )}
              </Row>
            )}
            <Row label={L('Width')}>
              {PATH_WIDTHS.map((w) => (
                <Chip key={w.key} on={(design.parts.thickness ?? 'medium') === w.key}
                  title={w.key === 'thin' ? 'Single file' : 'Two can walk it abreast'}
                  onClick={() => set({ parts: { ...design.parts, thickness: w.key } })}>{w.label}</Chip>
              ))}
            </Row>
            <Row label={L('Surface')}>
              {PATH_SURFACES.map((c) => (
                <Swatch key={c.hex} hex={c.hex} label={c.label} on={design.colors?.path === c.hex}
                  onClick={() => set({ colors: { ...design.colors, path: c.hex } })} />
              ))}
            </Row>
            {/* The runs this pathway is made of, and the way to take one back up. */}
            {(() => {
              const runs = (state.connectors ?? []).filter((c) => c.itemId === subject.id);
              if (!runs.length) return null;
              const named = (end: { featureId?: string }) => (end.featureId
                ? state.backlog.find((x) => x.id === end.featureId)?.name : null);
              return (
                <Row label={`${runs.length} run${runs.length === 1 ? '' : 's'}`}>
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
                </Row>
              );
            })()}
          </>
        );

      // ---- what every object standing on the park can do ----
      case 'park':
        return (
          <Row label={L('Place')}>
            {api.onTurn && (
              <Chip onClick={() => api.onTurn?.(subject.id, ((subject.rot ?? 0) + 90) % 360)}
                title="Turn it a quarter">Turn</Chip>
            )}
            {placed && api.onUnplace && (
              <Chip onClick={() => api.onUnplace?.(subject.id)}
                title="Take it off the park and put it down again">Move</Chip>
            )}
            {!placed && <span className="text-[11px] text-muted-foreground">not on the park yet</span>}
          </Row>
        );
      default:
        return null;
    }
  };

  return (
    <div data-part="park-options" data-for={subject.id}
      className={cn('flex min-h-[2.75rem] flex-wrap items-center gap-x-2 gap-y-2', className)}>
      {/* What is selected, how far off it is, and the one move left when it is not far off at all.
          The count used to be in three places: a pill under the object on the park, a pill floating
          over its corner, and nowhere near the controls that change it. They each worked it out for
          themselves, so they could disagree about the same habitat. One calculation now (`inspect`),
          read here and by the panel. */}
      {(() => {
        const ask = how.ready && !how.asked && !how.accepted && api.onAskToCheck;
        const press = () => (ask ? api.onAskToCheck?.(subject.id) : api.onOpenCard?.(subject.id));
        return (
          <button type="button" data-part="pbi-chip" data-ready={how.ready ? 'yes' : 'no'}
            onClick={press} disabled={!ask && !api.onOpenCard}
            title={ask ? `Offer it to ${how.po}` : api.onOpenCard ? 'Open the card and read its criteria' : undefined}
            className={cn(FOCUS, 'flex h-9 min-w-0 shrink items-center gap-1.5 rounded-md border px-2.5 text-xs',
              how.ready ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-border bg-card',
              (ask || api.onOpenCard) && 'hover:bg-muted/60')}>
            {how.ready && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />}
            <span className="truncate font-bold">{inside ? `Inside ${inside.name}` : subject.name}</span>
            {how.criteria.length > 0 && (
              <span className="shrink-0 tabular-nums text-muted-foreground">{how.count}</span>
            )}
            {ask && <span className="shrink-0 font-semibold text-emerald-700 dark:text-emerald-400">Ask {how.po}</span>}
          </button>
        );
      })()}

      {/* ---- inside a habitat: what goes in, and nothing about the fence ---- */}
      {inside ? (
        <>
          <div className="flex flex-wrap items-center gap-1">
            {INSIDE_KINDS.map((k) => (
              <Chip key={k} onClick={() => api.onAddInside?.(inside.id, k)}>+ {k}</Chip>
            ))}
          </div>
          <Chip onClick={() => api.onInside?.(null)}>Back to the park</Chip>
        </>
      ) : (
        <>
          {shown.map((g) => (
            <Menu key={g.id} group={g} label={labelOf(g, subject)} lit={lit(g)}
              // The pen is a mode, and a mode you cannot see is a mode that surprises you. It used
              // to be a chip on a flat strip that was always on screen; behind a menu, closing the
              // menu left it out invisibly and every press on the park drew instead of selecting.
              // The same trap Look Inside was fixed for, from the other side.
              busy={g.id === 'path' && !!drawing}
              onClosed={g.id === 'path' && drawing ? () => onDrawing?.(false) : undefined}>
              {body(g.id, labelOf(g, subject))}
            </Menu>
          ))}
          {/* Everything measurable is met. Worth saying rather than leaving the player to notice
              that no dot is lit: the measurable part is done, and what is left is a conversation. */}
          {how.ready && how.criteria.length > 0 && (
            <span data-part="nothing-open" className="text-xs text-muted-foreground">
              Everything the park can check is met{how.outstanding ? '' : ` - ${how.po} judges the rest`}.
            </span>
          )}
          {/* The filter, at the end of the row where it does not compete with the work. */}
          <label data-part="needs-only" title="Show only the controls that would finish this item"
            className={cn('ml-auto flex shrink-0 cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground')}>
            <input type="checkbox" className="h-3 w-3 accent-primary" checked={needsOnly}
              onChange={(e) => setNeedsOnly(e.target.checked)} />
            Needs only
          </label>
        </>
      )}
    </div>
  );
}
