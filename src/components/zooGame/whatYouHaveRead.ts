// What this browser has already been taught.
//
// `taught` is the list of teaching cards a player has read, and the game shows each card once. Once
// meant once per GAME, which is not what anybody means by once: press Start building and the list
// was thrown away with the rest of the fresh state, and a second zoo began the teaching again from
// the top as though nobody had ever played.
//
// Carrying it through the reducer fixes the first half of that (see `asWritten`), and only the
// first half: a player who comes back tomorrow, or just reloads the page, arrives at a brand new
// state with an empty list. So the list is also kept here, outside the game, and seeded back in
// when a game begins.
//
// Per browser rather than per account, deliberately. Most people meet this game without signing in
// - it is linked from the front page and from a course - and "do not teach me what I already know"
// should not require an account. A signed-in player's saved game carries its own `taught` anyway,
// so the two do not fight: whichever list is larger wins when a save is loaded, because reading a
// card is a thing that happened and neither copy can un-happen it.
//
// Everything here is wrapped, because localStorage is not guaranteed: Safari in private browsing
// has thrown on write for years, a prerender has no window at all, and a game that fails to start
// because it could not remember which cards you had read would be a poor trade.

const KEY = 'aa.zoo.taught';

/** What this browser has read, or nothing if it cannot say. */
export function readTaught(): string[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as unknown;
    // Whatever is in there came from an older version of this game or from somebody with the
    // console open. A card id is a string; anything else is not one.
    return Array.isArray(list) ? list.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** ...and remember it, for the next game and the next visit. */
export function writeTaught(taught: string[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify(taught));
  } catch {
    // A browser that will not store it still plays the game; it just asks the same questions again.
  }
}

/** Both lists, without duplicates and in the order they were first read.
 *
 *  Used when a saved game arrives: the save knows what was read while it was being played and this
 *  browser knows what has been read since, and reading a card is a thing that HAPPENED - neither
 *  copy is entitled to un-happen the other's. */
export function bothLists(a: string[] | undefined, b: string[] | undefined): string[] {
  return [...new Set([...(a ?? []), ...(b ?? [])])];
}
