import type { ZooGameState, BacklogItem } from './types';
import type { EditApi } from './ParkView';
import { themeFor } from './zoneTheme';
import { ItemToolbar } from './ItemToolbar';
import { CardDetail, CategoryIcon } from './Board';
import { presetFor } from './design';
import { Chip } from './ui/Chip';
import { ExplainButton } from './Explain';
import { cn } from '@/lib/utils';
import { EYEBROW } from './ui/tokens';
import { Hammer } from 'lucide-react';

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

/** Nothing selected: say what the space is for rather than leaving a hole in the screen. */
function Empty({ next }: { next?: BacklogItem }) {
  return (
    <div className="flex h-full min-h-[8rem] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-6 text-center">
      <Hammer className="h-5 w-5 text-muted-foreground/50" aria-hidden />
      <p className="text-[12px] font-medium text-muted-foreground">Nothing on the bench</p>
      <p className="max-w-[22rem] text-[11px] leading-snug text-muted-foreground/80">
        {next
          ? <>Start <span className="font-medium text-foreground">{next.name}</span> and its design lands here. You build it here and place it on the park.</>
          : <>Pick something up from To Do, or select what you are building on the park.</>}
      </p>
    </div>
  );
}

/** The design bench: the controls for whatever is being built, plus its plan and the Product
 *  Owner's criteria - everything you need to finish one item, in one place under the board. */
export function DesignBench({ state, itemId, edit, part, onPart, onToggleTask, onConfirmAc, nextUp }: {
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
}) {
  const item = itemId ? state.backlog.find((i) => i.id === itemId) : undefined;

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

      {!item ? <Empty next={nextUp} /> : (
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
              onDesign={(d) => edit.onDesign(item.id, d)}
              onSetEnclosure={item.category === 'enclosure' ? (size) => edit.onSetEnclosure(item.id, size) : undefined}
              onToggleTask={(taskId) => onToggleTask(item.id, taskId)}
              onConfirmAc={(i, v) => onConfirmAc(item.id, i, v)}
              focus={part?.id === item.id ? part.key : null}
              onFocus={(key) => onPart?.(key ? { id: item.id, key } : null)}
              onClose={() => onPart?.(null)} />
            <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
              Touch a part of it on the park to open that part&rsquo;s controls here. Where it stands is
              settled out there, by dragging it.
            </p>
          </div>
          {/* The plan and the criteria, open. On the card they are a row of pips you expand; here,
              where you are actually doing the work, they are the work. */}
          <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/[0.05] p-2">
            <div className={cn(EYEBROW, 'mb-1.5 text-emerald-700 dark:text-emerald-300')}>What Done looks like</div>
            <CardDetail item={item} interactive showAcceptance bare
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
