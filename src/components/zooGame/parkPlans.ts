import type { ZooGameState, BacklogItem } from './types';
import { isReady } from './engine';
import { groundSize } from './parkModel';
import { freeSlots } from './parkOutline';
import { zonePlots, type Plot } from './parkZones';

// What is planned for the park, drawn on it before it is built (docs/ZOO_GAME_FLOW.md, "Every step
// shows on the park").
//
// The park is the reason to care, and before the first Sprint it was empty grass with faint plots
// and no names. So, as a layer of its own: each plot says what its area is waiting for, each Ready
// item is an outline where it will stand, and the forecast lights the outlines being built this
// Sprint.
//
// A layer, never the Increment. The Increment is what is Done, and an outline of something nobody
// has built drawn into it would be the game teaching the opposite of Scrum. The view says which it
// is showing, and the Review turns plans off.

export interface PlannedOutline {
  id: string;
  name: string;
  zone: string;
  /** Its centre and the ground it will take, in park coordinates. */
  x: number; y: number; w: number; h: number;
  /** In this Sprint's forecast, rather than only Ready. */
  forecast: boolean;
}

export interface PlotPlan { zone: string; plot: Plot; label: string }

/** Things that take ground of their own. An animal lives inside its habitat, and paths and
 *  planting are drawn across the park rather than standing in a place. */
const takesGround = (it: BacklogItem) => it.category !== 'epic' && it.category !== 'need'
  && it.category !== 'exhibit' && it.category !== 'path' && it.category !== 'flora';

/** Planned but not built: Ready in the Product Backlog, or forecast and not yet started. */
const planned = (it: BacklogItem, state: ZooGameState) => !it.enhancesId
  && ((it.status === 'backlog' && !it.unsized && isReady(it, state))
    || (it.status === 'committed' && !it.started));

/** `taken`: where the things already on the park actually stand, so an outline never sits on one. */
export function parkPlans(state: ZooGameState, taken: { x: number; y: number }[] = []): { plots: PlotPlan[]; outlines: PlannedOutline[] } {
  const plots = zonePlots(state);
  const slots = freeSlots(state, undefined, taken);
  const used = new Set<string>();
  const outlines: PlannedOutline[] = [];
  for (const it of state.backlog) {
    if (!planned(it, state) || !takesGround(it) || !plots.has(it.zone)) continue;
    const size = groundSize(it);
    const slot = it.pos ? null : slots.find((s) => s.zone === it.zone && !used.has(s.id) && s.size.w >= size.w && s.size.h >= size.h);
    const at = it.pos ?? slot?.at;
    if (!at) continue;   // nowhere for it yet: the plot's label still counts it
    if (slot) used.add(slot.id);
    outlines.push({ id: it.id, name: it.name, zone: it.zone, x: at.x, y: at.y, w: size.w, h: size.h, forecast: it.status === 'committed' });
  }
  const plotPlans = [...plots.values()].map((plot): PlotPlan => {
    const mine = state.backlog.filter((it) => it.zone === plot.zone);
    const epic = mine.some((it) => it.status === 'backlog' && it.category === 'epic');
    const forecast = mine.filter((it) => it.status === 'committed' && !it.started).length;
    const ready = mine.filter((it) => it.status === 'backlog' && planned(it, state)).length;
    const parts = [
      forecast ? `${forecast} this Sprint` : '',
      ready ? `${ready} Ready` : '',
      epic ? (forecast || ready ? 'more to split' : 'an epic to split') : '',
    ].filter(Boolean);
    return { zone: plot.zone, plot, label: `${plot.zone}: ${parts.length ? parts.join(' · ') : 'nothing planned yet'}` };
  });
  return { plots: plotPlans, outlines };
}
