import type { ZooGameState } from './types';

/** The Product Backlog without its starter "Somewhere to eat". Visitors asking for food while that
 *  need is waiting are asking for it, not for a new one, so tests about a food need ARRIVING from a
 *  Review start from a Backlog that does not already have one. */
export function noStarterFood<S extends ZooGameState>(state: S): S {
  return { ...state, backlog: state.backlog.filter((it) => it.id !== 'somewhere-to-eat') };
}
