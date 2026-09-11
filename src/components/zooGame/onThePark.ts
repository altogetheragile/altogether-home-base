import type { BacklogItem } from './types';

/** Whether this item is something standing on the park.
 *
 *  Its own module because both sides need it and neither should have to import the other: the engine
 *  asks the park what visitors can reach, and the park asks this what is standing on it. Kept here,
 *  that is a straight line instead of a ring - and it is one rule either way, which is the point.
 *
 *  An improvement is not shown separately: it re-delivers the thing it improves.
 */
export const standsOnPark = (item: BacklogItem): boolean =>
  (item.status === 'open' || item.status === 'done') && !item.enhancesId;
