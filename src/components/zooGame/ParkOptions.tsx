import { useId, useState } from 'react';
import { Plus, Minus, Trash2, Check } from 'lucide-react';
import type { ZooGameState, BacklogItem } from './types';
import {
  currentDesign, floraColors, ENCLOSURE_SIZE, ENCLOSURE_SHAPES,
  PLANTING_TYPES, HABITAT_FEATURE_TYPES, PATH_WIDTHS, PATH_SURFACES, groupSize, piecesFor, pieceByKey, applyPiece, floraPalette,
  hasRoomToRoam, homeSizeOf, SWATCHES, coatWord, looksFor, isTank, groupChoices, BARRIERS, chosenBarrier,
  enclosureWater, enclosureFlora,
  type ItemDesign,
} from './design';
import { groupsFor, openCriteria, wouldSettle, labelOf, iconOf, type GroupDef, type GroupId } from './buildGroups';
import { inspect, ACCEPTANCE_CRITERIA } from './parkChecks';
import { structuresFor } from './toolboxItems';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { EYEBROW, FOCUS } from './ui/tokens';
import { DodList } from './Board';
import { ToolIcon } from './ToolIcon';
import { AcceptanceCriteriaIcon } from './AcceptanceCriteriaIcon';
import { TOOLBAR_ICONS, type ToolbarIcon as Drawing } from './toolbarIcons';
import { BOARD } from './board/BoardIcon';
import { BOARD_ICONS } from './board/boardIcons';

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
 *  A picture, not a word.
 *
 *  It was a word for a long time, and the words are long: "Structure", "Perimeter", "Interior",
 *  "How many", "On the park", "Definition of Done". Ten of those is around twelve hundred pixels of
 *  button in a column that is six hundred and sixty wide, so the strip wrapped to two rows and the
 *  second row came out of the park. Every fix for that traded one for the other - give the menus a
 *  row of their own and the park loses a row of its own: "it does not look good, it reduces the
 *  size of the studio work area."
 *
 *  Icons are the fix that costs neither. The same ten buttons are about four hundred pixels, which
 *  fits beside the item chip with room over, so there is one row and the park keeps its space.
 *
 *  The word has not gone anywhere. It is the button's accessible name, it is its tooltip, and it is
 *  the heading on the panel the button opens - which is where it teaches, because that is where you
 *  are looking when you use the control.
 *
 *  Lit when it holds the answer to something this object is failing. The light is a dot rather than
 *  a colour change on the button: a row of buttons that change colour is a row where nothing stands
 *  out, and the dot is the only thing on the strip moving. */
function Menu({ group, icon, label, lit, busy, open, onOpenChange, onClosed, children }: {
  /** Only the id is read, so a menu that is not a build group can use this too: the Definition of
   *  Done writes nothing, so it is not one. */
  group: { id: string };
  /** Taken as the drawing rather than as its name, so the one menu on the strip that is not a build
   *  group can wear the board's Definition of Done gem - the same gem the Increment tab wears, and
   *  the same one on the diagram. */
  icon: Drawing;
  label: string; lit: boolean;
  /** Which menu is open is held by the strip, not by each menu: they are one row of one control, and
   *  three panels stacked over the park is three answers to "what am I doing". */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A mode this menu turned on is still running - the pen is out. Said on the button, because the
   *  menu is shut and the mode is not. */
  busy?: boolean;
  /** Closing the menu puts away whatever it turned on. */
  onClosed?: () => void;
  children: React.ReactNode;
}) {
  // One per button on the page, so two strips cannot point at each other's description.
  const litId = `${useId()}lit`;
  return (
    <Popover open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) onClosed?.(); }}>
      <PopoverTrigger asChild>
        <button type="button" data-part={`group-${group.id}`} data-lit={lit ? 'yes' : 'no'}
          data-drawing={busy ? 'yes' : undefined}
          // The name of the button, for anyone not reading the picture. It stays the plain word,
          // because a name that changes as the game goes on is a name that cannot be looked for.
          aria-label={label}
          // ...and so does the tooltip. It used to add "- something here would finish this item"
          // whenever the dot was lit, which is the dot saying itself in words next to itself:
          // "the hover over labels are weird for some - extra duplicate text."
          // The pen is the exception. That is a mode with nothing on screen to show for it once
          // the menu is shut, so the tooltip is the only place it can be said.
          title={busy ? `${label} - the pen is out` : label}
          // The lit state said where a tooltip cannot reach. `aria-label` on the button replaces
          // everything inside it, so the dot's own label was never announced.
          aria-describedby={lit ? litId : undefined}
          className={cn(FOCUS, 'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors',
            open || busy ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground/80 hover:bg-muted/60 hover:text-foreground')}>
          <ToolIcon icon={icon} className="h-5 w-5" />
          {/* On the corner rather than in the row: beside the word it took width, which is the
              thing the icons are here to stop spending. Inside the button's own edge rather than
              over it, because the row scrolls when it has to and anything hanging outside would be
              shaved off at the end of it. */}
          {lit && (
            <>
              <span data-part="lit" aria-hidden
                className="absolute right-[3px] top-[3px] h-1.5 w-1.5 rounded-full bg-amber-500 ring-2 ring-card" />
              <span id={litId} className="sr-only">something here would finish this item</span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" data-part={`panel-${group.id}`} className="zoo-theme w-[19rem] p-2"
        // The park is the drawing surface, so a press on it must not shut the menu the pen lives
        // in: closing is what puts the pen away, and a menu that closed on the first press would
        // put it away before the first point landed.
        onInteractOutside={busy ? (e) => e.preventDefault() : undefined}>
        {/* The word, where it teaches.
            It used to be on the button, and inside the panel the row's own label was blanked when
            it repeated it - "Interior: Interior" is a word doing no work. With a picture on the
            button that left single-row panels with no word at all, so the name moved in here and
            the rows go on being quiet underneath it. */}
        {/* Not `panel-<id>`: that prefix is how the game counts how many menus are standing open,
            and a heading inside a panel would have counted as a second panel. */}
        <div data-part={`menu-name-${group.id}`} className={cn(EYEBROW, 'px-1 pb-1 text-muted-foreground')}>{label}</div>
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
      <PopoverContent align="start" className="zoo-theme w-auto p-2">
        <div className="grid grid-cols-6 gap-1.5">
          {options.map((c) => (
            <button key={c} type="button" aria-label={`${label} ${c}`} title={c}
              onClick={() => { onPick(c); setOpen(false); }}
              className={cn(FOCUS, 'h-7 w-7 rounded-md border-2', current === c ? 'border-primary' : 'border-border')}
              style={{ background: c }} />
          ))}
        </div>
        {/* ...and any colour at all. The grid is a palette somebody chose, which is the right thing
            to offer first - "#8e6bbf" is not a decision anybody makes - but a palette is a fence as
            well as a shortcut, and there was no way over it. Asked for after a play-through: "for
            all the colour pickers can there be a wider more customisable colour picker?" */}
        <label className="mt-2 flex items-center gap-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
          <input type="color" data-part="any-colour" value={current ?? '#c8a06a'}
            aria-label={`Any ${label.toLowerCase()} colour`}
            onChange={(e) => onPick(e.target.value)}
            className={cn(FOCUS, 'h-7 w-9 cursor-pointer rounded-md border border-border bg-transparent p-0.5')} />
          Any colour
          <span className="ml-auto font-mono uppercase tabular-nums">{current ?? ''}</span>
        </label>
      </PopoverContent>
    </Popover>
  );
}

export interface ParkOptionsApi {
  onDesign: (id: string, design: ItemDesign) => void;
  onAddInside?: (id: string, kind: string) => void;
  /** Take one back out again. A habitat's inside was add-only, so a pond dug by mistake stayed. */
  onRemoveInside?: (id: string, kind: string) => void;
  /** What kind of thing the Developers are building: the first act, and until it is made there is
   *  nothing to place. */
  onChooseStructure?: (id: string, key: string) => void;
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
  // One menu at a time. Each used to hold its own, so opening a second left the first standing and
  // three could be stacked over the park at once.
  // 'dod' is not a build group - it writes nothing - but it is one of the row's menus and only one
  // of them may be open at a time, so it shares the state.
  const [openMenu, setOpenMenu] = useState<GroupId | 'dod' | null>(null);
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
  const lit = (g: GroupDef) => wouldSettle(g, open, subject);
  // Every control this thing has, always.
  //
  // There was a "Needs only" tick box that hid the ones the item's criteria were not about, on by
  // default. Nobody asked for it - it arrived inside #645, a commit about making the strip one row -
  // and it is the wrong shape for what this screen is: the Developers decide HOW, and a strip that
  // quietly withholds half the hows is answering that for them. Asked while playing: "what is the
  // 'Needs' check box? Who asked for that?"
  //
  // What it was for is already done better by the dots: a lit group is one that would finish this
  // item. That points without hiding.
  const shown = all;

  /** The controls for one part of the work. Each of these is what used to sit on the flat strip. */
  const body = (id: GroupId, menu: string) => {
    /** A row keeps its label only where it says something the menu did not. */
    const L = (label: string) => (label.toLowerCase() === menu.toLowerCase() ? '' : label);
    switch (id) {
      // What kind of thing to build: the first decision and the Developers'. Picking the card used
      // to put a ghost under the cursor with the shape already settled, so the first act of
      // building was dropping somebody else's decision on the grass.
      case 'structure': {
        const kinds = structuresFor(subject.category);
        const picked = design.parts.structure;
        // Shelved where there are enough of them to need it - thirty animals in one list is not a
        // list. A scroll rather than a second menu: what is being chosen is one thing.
        const shelves = [...new Set(kinds.map((k) => k.group ?? ''))];
        return (
          <div className="max-h-[17rem] space-y-1 overflow-y-auto">
            <p className="px-1 pb-1 text-[11px] text-muted-foreground">
              {picked ? `What this is being built as. ${menu === 'Species' ? 'The card says what was asked for.' : ''}`.trim()
                : `What are you building? Nothing goes on the park until you say.`}
            </p>
            {shelves.map((shelf) => (
              <div key={shelf} className="space-y-1">
                {shelf && <div className={cn(EYEBROW, 'px-1 pt-1 text-muted-foreground')}>{shelf}</div>}
                {kinds.filter((k) => (k.group ?? '') === shelf).map((k) => (
                  <button key={k.key} type="button" data-part={`structure-${k.key}`} aria-pressed={picked === k.key}
                    onClick={() => api.onChooseStructure?.(subject.id, k.key)}
                    className={cn(FOCUS, 'flex w-full items-baseline gap-2 rounded-md border-2 px-2 py-1.5 text-left',
                      picked === k.key ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/60')}>
                    <span className="text-xs font-semibold">{k.name}</span>
                    {k.what && <span className="text-[11px] text-muted-foreground">{k.what}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        );
      }
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
      // No row label: the menu is called Surface already, and a row repeating its own menu's name
      // is a word doing no work.
      case 'ground':
        return (
          <Row label={L('Surface')}>
            {(tank ? WATER_COLOURS : GROUND_COLOURS).map((c) => (
              <Swatch key={c} hex={c} label="Surface"
                on={(tank ? design.colors?.water : design.colors?.ground) === c}
                onClick={() => set({ colors: { ...design.colors, [tank ? 'water' : 'ground']: c } })} />
            ))}
            <MoreColours label="Surface"
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
          <Row label={L('Perimeter')}>
            {/* Asked WITH the animals in it, which is how the criterion asks. Without them, an
                unchosen barrier shows as a low hedge while the card says "a 4m fence, holds them" -
                two answers to one question, and the strip's one is the one that looks like a choice
                somebody made. Reported from playing it: "the hedge setting I picked defaults to high
                fence." */}
            {BARRIERS.map((b) => {
              // What was CHOSEN, not what would do. Showing the adequate default as pressed was the
              // strip answering the question on the Developers' behalf and then looking like they
              // had answered it: "I'm still not picking the enclosure from scratch as a Dev."
              const on = chosenBarrier(design)?.key === b.key;
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
      case 'inside': {
        // What is actually in there, how many of each, and a way to put one in or take one out.
        // It used to be one button that zoomed the park - which is still here, because arranging
        // them is done in there - but "add shelter" was a press you had to go somewhere else to
        // make, and nothing said what was already in.
        const water = enclosureWater(design).length;
        const flora = enclosureFlora(design);
        const countOf = (k: string) => (k === 'water' ? water : flora.filter((f) => f.type === k).length);
        return (
          <div className="space-y-0.5">
            {INSIDE_KINDS.map((k) => {
              const n = countOf(k);
              return (
                <div key={k} data-part={`inside-${k}`} className="flex items-center gap-1.5">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5">
                    <input type="checkbox" className="h-3.5 w-3.5 shrink-0 accent-primary" checked={n > 0}
                      aria-label={k}
                      onChange={(e) => (e.target.checked
                        ? api.onAddInside?.(subject.id, k)
                        : Array.from({ length: n }, () => api.onRemoveInside?.(subject.id, k)))} />
                    <span className="truncate text-xs capitalize">{k}</span>
                  </label>
                  <span className="flex shrink-0 items-center gap-0.5">
                    <button type="button" data-part={`fewer-${k}`} disabled={!n}
                      aria-label={`One fewer ${k}`} title={`One fewer ${k}`}
                      onClick={() => api.onRemoveInside?.(subject.id, k)}
                      className={cn(FOCUS, 'flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-30')}>
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-4 text-center text-xs tabular-nums">{n}</span>
                    <button type="button" data-part={`more-${k}`}
                      aria-label={`One more ${k}`} title={`One more ${k}`}
                      onClick={() => api.onAddInside?.(subject.id, k)}
                      className={cn(FOCUS, 'flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted')}>
                      <Plus className="h-3 w-3" />
                    </button>
                  </span>
                </div>
              );
            })}
            <button type="button" onClick={() => api.onInside?.(subject.id)}
              className={cn(FOCUS, 'mt-1 w-full rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted')}>
              Look inside, to move them about
            </button>
          </div>
        );
      }

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
      // How big the plants grew - a sapling, a tree, a mature oak. A choice about the PLANT, which
      // is why both drawings read it. These chips used to write a rectangle on the park instead:
      // "what's the point of expanding the trees?"
      case 'grown':
        return (
          <Row label={L('Size')}>
            {(['small', 'medium', 'large'] as const).map((key) => (
              <Chip key={key} on={(design.parts.size ?? 'medium') === key}
                title={{ small: 'A sapling', medium: 'A tree', large: 'A mature one' }[key]}
                onClick={() => set({ parts: { ...design.parts, size: key } })}>{key[0].toUpperCase()}</Chip>
            ))}
          </Row>
        );

      // A planting item is a CLUMP, not one plant: "we can only add one tree and one type of tree.
      // There used to be the ability to plant multiple trees of different types."
      //
      // Called How many, like the animals', because it is the same act. What KIND of plant this is
      // belongs to Planting; which piece each one in the clump is belongs here.
      case 'clump':
        return (
          <>
            {api.onAddCopy && (
              <Row label={L('Plant another')}>
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
          </>
        );

      // What colour it is. What it IS is Planting's, how big it grew is Size's, how many there are
      // is How many's - this is what is left, and it is the same question Look asks of an animal.
      case 'planting':
        return (
          <>
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
    <div data-part="park-options" data-for={subject.id} className={cn('flex flex-col gap-y-1', className)}>
      {/* One row. It was two for a while - the menus kept apart from the item chip, because the
          chip grows by sixty pixels the moment "Ask Priya" appears on it and that was enough to
          move where the row wrapped and drop the menus a line.
          That bought stability with the park's vertical space, which is a poor trade on the screen
          the park is the point of: "It does not look good. It reduces the size of the studio work
          area." The chip holds its width instead - see below - so one row is stable too. */}
      <div data-part="park-controls"
        className="flex min-h-[2.75rem] items-center gap-x-1.5 overflow-x-auto overflow-y-hidden">
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
            // Says which of the two it is.
            //
            // The item being built wears its name here, and the same item wears its name on the
            // board a few inches away - so the page offered two controls called "Lion" and nothing
            // on either to say what the difference was. A newcomer playing the live game cold
            // stopped on it three times: "There are two Lion buttons - 'Lion 2 Next: accept 1 more
            // criterion' and 'Lion 3 of 4 Ask Priya' - I am not sure which is which or why there
            // are two." The third time the game had of naming two things the same way, after the
            // example zoom and the Review's two pictures.
            aria-label={`${inside ? `Inside ${inside.name}` : subject.name}, the one being built`
              + (how.criteria.length > 0 ? ` - ${how.count} criteria met` : '')
              + (ask ? ` - ask ${how.po} to accept it` : api.onOpenCard ? ' - open its card' : '')}
            className={cn(FOCUS, 'flex h-9 min-w-0 shrink items-center gap-1.5 rounded-md border px-2.5 text-xs',
              how.accepted ? 'border-emerald-500/60 bg-emerald-500/10'
                : ask ? 'border-primary/60 bg-primary/10' : 'border-border bg-card',
              (ask || api.onOpenCard) && 'hover:bg-muted/60')}>
            {/* The tick means the Product Owner has accepted it, and nothing else. It used to mean
                "every fact is in", which is a different thing and sat on the chip beside a button
                asking her to come and look - a finished tick over an unanswered question. */}
            {how.accepted && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />}
            {/* The mark for acceptance criteria, at the head of the button rather than inline in
                the small print under the name. Inline it would be eleven pixels, and the clipboard
                and the check stop being two things at about fourteen. Here it has room, and it
                marks the whole button as the one that opens them rather than one line of it.
                Eighteen rather than sixteen or twenty: sixteen sits small against two lines of
                text and twenty starts to lead them. Chosen by rendering all three. */}
            {how.criteria.length > 0 && (
              <AcceptanceCriteriaIcon className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
            )}
            {/* The name, and under it what the count is a count OF.
                It used to be the name and a bare "0 of 5" beside it, and nothing said what the five
                were - the panel it opens is headed "Acceptance criteria · 0 of 5" and the button
                that opens it said neither word. Asked of it directly: "can we call this acceptance
                criteria - it is not clear what is behind it."
                Stacked rather than strung out, which is what the seat band does with a person's
                name and what they are doing. On one line "acceptance criteria" is a hundred pixels
                taken off the item's own name; on a line of its own it costs the chip nothing it was
                not already spending on the count and the ask. */}
            {/* `text-left` because a <button> centres its text, and two stacked lines of different
                lengths centred over each other read as a label rather than as a name with a note
                under it. */}
            <span className="flex min-w-0 flex-col items-start text-left leading-tight">
              <span className="w-full truncate font-bold">{inside ? `Inside ${inside.name}` : subject.name}</span>
              {how.criteria.length > 0 && (
                <span data-part="pbi-criteria"
                  className="w-full truncate text-[10px] font-normal text-muted-foreground">
                  {/* The same words as the heading of the panel this opens, so pressing it lands
                      somewhere that says what you just pressed. */}
                  {ACCEPTANCE_CRITERIA} <span className="tabular-nums">&middot; {how.count}</span>
                </span>
              )}
            </span>
            {/* The room for this is kept whether or not it is wanted.
                It appears the moment the Product Owner becomes the only thing between this item and
                Done, and it is sixty pixels wide - enough, on a row that wrapped, to move where it
                wrapped and drop the menus a line out from under whichever one was open. Reported
                while drawing a path: "the studio menu shifts down as the PO approval kicks in."
                The icons stopped the row wrapping, and that is NOT the same as stopping this. Taken
                out on the strength of the one-row fix, the menus stopped dropping a line and started
                sliding sixty pixels to the right instead, still out from under an open one. The
                direction changed and the fault did not.
                So the room stays kept. It costs sixty pixels of the item's own name, which truncates
                and is on the button's title and its accessible name in full. */}
            <span aria-hidden={!ask}
              className={cn('shrink-0 font-semibold text-emerald-700 dark:text-emerald-400', !ask && 'invisible')}>
              Ask {how.po}
            </span>
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
          {/* The menus, on a line of their own.
              They are a fixed set, so on their own they wrap the same way every time. Sharing a row
              with the item chip they did not: the chip grows by sixty pixels the moment "Ask Priya"
              appears on it, which is enough to move where the row wraps and drop the menus a line -
              out from under whichever one was open. Reported while drawing a path: "the studio menu
              shifts down as the PO approval kicks in." */}
          <div data-part="park-menus" className="contents">
          {shown.map((g) => (
            <Menu key={g.id} group={g} icon={TOOLBAR_ICONS[iconOf(g, subject)]} label={labelOf(g, subject)} lit={lit(g)}
              open={openMenu === g.id}
              onOpenChange={(o) => setOpenMenu(o ? g.id : null)}
              // The pen is a mode, and a mode you cannot see is a mode that surprises you. It used
              // to be a chip on a flat strip that was always on screen; behind a menu, closing the
              // menu left it out invisibly and every press on the park drew instead of selecting.
              // The same trap Look Inside was fixed for, from the other side.
              busy={g.id === 'path' && !!drawing}
              onClosed={g.id === 'path' && drawing ? () => onDrawing?.(false) : undefined}>
              {body(g.id, labelOf(g, subject))}
            </Menu>
          ))}
          {/* The bar every item has to clear, on the screen where the building happens.
              It was on the Increment tab and in the Learn drawer and nowhere here - so the game's
              own strapline, "build to your Definition of Done", asked for something you could not
              see while building. Reported as "I have no visibility of the DoD - where is it on the
              screen?"
              Read-only: agreeing it is the Scrum Team's act, and the Retrospective is where this
              game has them do it. Kept apart from the item's acceptance criteria on purpose -
              COURSE-AND-BOARD.md is explicit that merging the two is the mistake. The criteria
              belong to this item; the Definition of Done belongs to every item. */}
          {/* The board's own gem, in the board's own colours, where every other button on the strip
              is a line drawing in the button's ink. The difference is the point: the nine beside it
              are controls that write something, and this one writes nothing. It is the same picture
              a learner met on the diagram and on the Increment tab. */}
          <Menu group={{ id: 'dod' }} icon={BOARD_ICONS[BOARD.definitionOfDone]}
            label="Definition of Done" lit={false}
            open={openMenu === 'dod'} onOpenChange={(o) => setOpenMenu(o ? 'dod' : null)}>
            <div data-part="dod-panel" className="space-y-1.5">
              {/* The same list the card shows, not a second one. It already knows how to say a line
                  the park measured, a line only the Scrum Team can judge, and the state this game
                  starts every player in: nothing agreed at all. */}
              <DodList state={state} item={subject} />
              <p className="border-t border-border pt-1.5 text-[11px] leading-snug text-muted-foreground">
                This is the bar every item clears. What {subject.name} has to show on top of it is on
                its own card.
              </p>
            </div>
          </Menu>
          </div>
        </>
      )}
      </div>

      {/* Everything measurable is met. Worth saying rather than leaving the player to notice that no
          dot is lit: the measurable part is done, and what is left is a conversation.
          
          On its own line, UNDER the controls, because it arrives in the middle of using them. It was
          the last item in the same wrapping row, so the moment the Product Owner's approval became
          the only thing left, this sentence appeared, took the width it needed, and moved where the
          row wrapped - sliding the menus down from under an open one. Reported while drawing a path:
          "the studio menu shifts down as the PO approval kicks in". Nothing above it moves now. */}
      {how.ready && how.criteria.length > 0 && (
        <p data-part="nothing-open" className="text-xs text-muted-foreground">
          Everything the park can check is met{how.outstanding ? '' : ` - ${how.po} judges the rest`}.
        </p>
      )}
    </div>
  );
}
