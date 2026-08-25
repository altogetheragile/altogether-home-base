import type { ZooGameState, BacklogItem } from './types';
import type { EditApi } from './ParkView';
import { themeFor } from './zoneTheme';
import { ItemToolbar } from './ItemToolbar';
import { CardDetail, CategoryIcon } from './Board';
import { presetFor } from './design';
import { Chip } from './ui/Chip';
import { ExplainButton } from './Explain';
import { cn } from '@/lib/utils';
import { EYEBROW, FOCUS } from './ui/tokens';
import { Hammer, Spline, Trash2 } from 'lucide-react';

// ============= Where you design the thing you are building =============
//
// The controls used to float over the park on the thing itself, which was elegant for one habitat
// and cramped for everything else - a wrapping pill of menus laid over the product, covering the
// view of the very thing it was changing.
//
// They live here now, under the board, and the split says what each half is for: you DEFINE the
// design here, and you POSITION it on the park. The park is not a preview of this panel - it is the
// Increment, showing the real thing at its real size in its real place, changing as you work.
//
// Touching a part out there still opens its controls in here. That link is the whole reason a row
// of coloured squares is comprehensible at all: two brown squares labelled Ground and Fence explain
// nothing until the moment you tap the ground and watch one of them light up.

/** The runs this pathway is made of, and a way to take one back off.
 *
 *  A route you cannot edit is a route you have to get right first time, which is not how anyone
 *  draws anything. The runs were editable in principle - click the line on the park, press Delete -
 *  but that meant hitting a nine-pixel stroke after turning a mode off, which is not a way anybody
 *  would find. They are listed here, with the rest of the pathway's controls.
 */
function Runs({ state, item, onRemove }: { state: ZooGameState; item: BacklogItem; onRemove?: (id: string) => void }) {
  const runs = (state.connectors ?? []).filter((c) => c.itemId === item.id);
  if (!runs.length) {
    return <p className="text-[11px] text-muted-foreground">No route drawn yet - it is a path to nowhere until there is one.</p>;
  }
  return (
    <div className="space-y-1">
      <div className={cn(EYEBROW, 'text-muted-foreground')}>{runs.length} run{runs.length === 1 ? '' : 's'}</div>
      <ul className="space-y-0.5">
        {runs.map((c, i) => {
          const to = (end: typeof c.a) => (end.featureId ? state.backlog.find((x) => x.id === end.featureId)?.name : null);
          const from = to(c.a), dest = to(c.b);
          const where = from && dest ? `${from} to ${dest}` : from ? `from the ${from}` : dest ? `to the ${dest}` : 'across the grass';
          return (
            <li key={c.id} className="flex items-center gap-1.5 text-[11px]">
              <span className="h-1.5 w-4 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden />
              <span className="min-w-0 truncate text-muted-foreground">Run {i + 1} &middot; {where}</span>
              {onRemove && (
                <button type="button" onClick={() => onRemove(c.id)} title={`Take run ${i + 1} back up`}
                  aria-label={`Take run ${i + 1} back up`}
                  className={cn(FOCUS, "ml-auto shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive")}>
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Nothing selected: say what the space is for rather than leaving a hole in the screen. */
function Empty({ next, wentBack }: { next?: BacklogItem; wentBack?: BacklogItem }) {
  return (
    <div className="flex h-full min-h-[8rem] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-6 text-center">
      <Hammer className="h-5 w-5 text-muted-foreground/50" aria-hidden />
      <p className="text-xs font-medium text-muted-foreground">Nothing on the bench</p>
      <p className="max-w-[22rem] text-[11px] leading-snug text-muted-foreground/80">
        {wentBack
          // Say where it went. An item that ran out of Sprint goes back to be re-estimated against
          // what is left of it - that is the rule, and it is one of the things this game is for.
          ? <><span className="font-medium text-foreground">{wentBack.name}</span> did not finish in the Sprint, so it has gone back to the Product Backlog to be sized against what is left. Your build so far is kept. Pull it into a Sprint again to carry on.</>
          : next
          ? <>Start <span className="font-medium text-foreground">{next.name}</span> and its design lands here. You build it here and place it on the park.</>
          : <>Pick something up from To Do, or select what you are building on the park.</>}
      </p>
    </div>
  );
}

/** The design bench: the controls for whatever is being built, plus its plan and the Product
 *  Owner's criteria - everything you need to finish one item, in one place under the board. */
export function DesignBench({ state, itemId, edit, part, onPart, onToggleTask, onConfirmAc, nextUp, drawing, onDrawing, onRemoveRun }: {
  state: ZooGameState;
  /** The item being built - the same selection the park highlights. */
  itemId?: string | null;
  edit: EditApi;
  part?: { id: string; key: string } | null;
  onPart?: (p: { id: string; key: string } | null) => void;
  onToggleTask: (id: string, taskId: string) => void;
  onConfirmAc: (id: string, index: number, value: boolean) => void;
  /** The next thing in To Do, so the empty bench can name it. */
  nextUp?: BacklogItem;
  /** Laying a pathway's route. The pen belongs here with the rest of the thing's controls; the park
   *  is where you use it, the way the park is where you drag a habitat into place. */
  drawing?: boolean;
  onDrawing?: (on: boolean) => void;
  /** Take one run of a pathway back up. */
  onRemoveRun?: (connectorId: string) => void;
}) {
  // The bench holds what is being built. It used to hold whatever was last selected, which is not
  // the same thing: an item that runs out of Sprint goes back to the Product Backlog, and the bench
  // went on showing it - open, apparently in progress, and on no column of the board. There was no
  // way to finish it and no way to put it down.
  const held = itemId ? state.backlog.find((i) => i.id === itemId) : undefined;
  const wentBack = held?.status === 'backlog' ? held : undefined;
  const item = wentBack ? undefined : held;

  return (
    <section className="flex min-h-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
          Design bench
          {item && <>
            <span className="text-muted-foreground">&middot;</span>
            <CategoryIcon item={item} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate font-normal">{item.name}</span>
            <Chip>{item.zone}</Chip>
          </>}
        </h3>
        <ExplainButton cards={['increment', 'definition-of-done']} />
      </div>

      {!item ? <Empty next={nextUp} wentBack={wentBack} /> : (
        // Two jobs, two panels, two tints. The Developers' side is how the thing is made; the
        // Product Owner's side is what it has to be true of before anyone calls it Done. Told apart
        // by a wash of colour rather than a rule, so the bench reads as two things at a glance
        // without the screen turning into a chart.
        <div className="grid gap-2 sm:grid-cols-2 sm:items-start">
          <div className="rounded-lg border border-sky-400/40 bg-sky-500/[0.05] p-2">
            <div className={cn(EYEBROW, 'mb-1.5 text-sky-700 dark:text-sky-300')}>How it is made</div>
            {/* The same controls that used to float over the park, docked. Identical component, so
                there is one place a control is defined and one place it can go wrong. */}
            <ItemToolbar docked
              item={item}
              design={item.category === 'enclosure'
                // Until a colour is chosen the habitat is drawn in its zone's colours, so that is
                // what the swatch has to show - a grey square for a tan fence is a lie.
                ? { ...working(item), colors: { ...zoneColors(state, item), ...working(item).colors } }
                : working(item)}
              copySources={edit.copySources(item)}
              onAddPlant={(piece) => edit.onAddPlant(item.id, piece)}
              onSetPlantPiece={(i, piece) => edit.onSetPlantPiece(item.id, i, piece)}
              onRemovePlant={(i) => edit.onRemovePlant(item.id, i)}
              onDesign={(d) => edit.onDesign(item.id, d)}
              onSetEnclosure={item.category === 'enclosure' ? (size) => edit.onSetEnclosure(item.id, size) : undefined}
              onToggleTask={(taskId) => onToggleTask(item.id, taskId)}
              onConfirmAc={(i, v) => onConfirmAc(item.id, i, v)}
              focus={part?.id === item.id ? part.key : null}
              onFocus={(key) => onPart?.(key ? { id: item.id, key } : null)}
              onClose={() => onPart?.(null)} />
            {/* A pathway's one remaining control. Drawing the route is how a path is laid out, so the
                button that starts it belongs with the rest of the thing's controls - the park is
                where you use it, the way the park is where you drag a habitat into place. */}
            {item.category === 'path' && onDrawing && (
              <div className="mt-2 space-y-1.5">
                <button type="button" onClick={() => onDrawing(!drawing)} aria-pressed={!!drawing}
                  className={cn(FOCUS, 'flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors',
                    drawing ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted')}>
                  <Spline className="h-3.5 w-3.5" /> {drawing ? 'Drawing on the park - click Done there' : 'Draw its route'}
                </button>
                <Runs state={state} item={item} onRemove={onRemoveRun} />
              </div>
            )}
            <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
              Touch a part of it on the park to open that part&rsquo;s controls here. Where it stands is
              settled out there, by dragging it.
            </p>
          </div>
          {/* The plan and the criteria, open. On the card they are a row of pips you expand; here,
              where you are actually doing the work, they are the work. */}
          <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/[0.05] p-2">
            <div className={cn(EYEBROW, 'mb-1.5 text-emerald-700 dark:text-emerald-300')}>What Done looks like</div>
            <CardDetail item={item} state={state} interactive showAcceptance bare
              onToggleTask={(id, taskId) => onToggleTask(id, taskId)}
              onConfirmAc={(id, i, v) => onConfirmAc(id, i, v)} />
          </div>
        </div>
      )}
    </section>
  );
}

const working = (it: BacklogItem) => it.design ?? it.draftDesign ?? presetFor(it);

/** A habitat with no colours chosen yet is drawn in its zone's, so the swatches must show those. */
function zoneColors(state: ZooGameState, item: BacklogItem): Record<string, string> {
  const zones = Array.from(new Set([...state.zones, ...state.backlog.map((i) => i.zone)]));
  const t = themeFor(item.zone, Math.max(0, zones.indexOf(item.zone)));
  return { ground: t.plot, fence: t.plotBorder };
}
