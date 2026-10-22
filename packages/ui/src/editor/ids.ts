// ============= What each thing is called =============
//
// Every box already had a fixed ID, its key: `home.hero.heading`, `nav.events`, `site.images.logo`.
// The spreadsheet carried it and the drawer's search found it, but nothing showed it, so there was
// no way to point at one box in an email or a spreadsheet and be sure which it was.
//
// The things inside a list had no ID at all: a service's title or its picture is one value inside
// the list's JSON. They are named by position, counting from 1 as the drawer does: the third
// service's picture is `coaching.services.3.picture`. Position is the only name they have, so an
// ID like that moves if the list is reordered. The spreadsheet checks for that before it writes.

export type ListRow = Record<string, string>;

/** The ID of one value inside a list. `n` counts from 1. */
export const itemId = (list: string, n: number, sub: string): string => `${list}.${n}.${sub}`;

/** A list's value as rows. Unparseable JSON is no rows rather than an error: the page does the
 *  same, and the raw value is still there to be repaired. */
export function parseItems(value: string): ListRow[] {
  if (!value.trim()) return [];
  try {
    const out = JSON.parse(value);
    return Array.isArray(out) ? out.filter((r) => r && typeof r === 'object' && !Array.isArray(r)) : [];
  } catch {
    return [];
  }
}

/** A list written back the way the drawer writes it. Pretty-printed, because this lands in a
 *  database column somebody will read one day. */
export const writeItems = (rows: ListRow[]): string => (rows.length ? JSON.stringify(rows, null, 2) : '');
