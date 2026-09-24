import type { CopyEntry } from '@/lib/copy/fields';

// ============= Reading and writing the fields that are not words =============
//
// A field says which store it lives in. This turns that into a value on the way out and a change
// on the way in, so the editor, the revisions and the undo all work the same whether somebody is
// changing a heading, the accent colour or the founder's name.
//
// Values are strings everywhere, including switches ('on'/'') and colours ('#1A9090'), because
// the editor, site_copy and the revision log all deal in strings. Converting at the edges keeps
// one shape through the middle.

type Settings = Record<string, unknown>;

const dig = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((at, key) => (at && typeof at === 'object' ? (at as Record<string, unknown>)[key] : undefined), obj);

/** The current value of a field that lives outside site_copy. */
export function readField(entry: CopyEntry, settings: Settings): string {
  if (entry.store === 'brand') {
    const v = dig(settings.brand, entry.path ?? '');
    return typeof v === 'string' ? v : '';
  }
  const v = settings[entry.path ?? ''];
  if (entry.type === 'switch') return v === false ? '' : v === true ? 'on' : '';
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

/** Builds the patch for a set of changes: the columns to set, and the brand object to replace.
 *
 *  Brand is one jsonb column, so every brand change in a save has to be folded into a single new
 *  object. Writing them one at a time would have the last write win and the others vanish. */
export function buildPatch(
  changes: { entry: CopyEntry; value: string }[],
  currentBrand: unknown,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  let brand: Record<string, unknown> | null = null;

  for (const { entry, value } of changes) {
    if (entry.store === 'brand') {
      brand ??= JSON.parse(JSON.stringify(currentBrand ?? {}));
      const parts = (entry.path ?? '').split('.');
      let at = brand as Record<string, unknown>;
      for (const key of parts.slice(0, -1)) {
        if (typeof at[key] !== 'object' || at[key] === null) at[key] = {};
        at = at[key] as Record<string, unknown>;
      }
      const leaf = parts[parts.length - 1];
      // An emptied field is removed rather than stored as "", so the shipped default takes over
      // again instead of the site rendering an empty string where a picture should be.
      if (value.trim()) at[leaf] = value.trim();
      else delete at[leaf];
    } else if (entry.store === 'column') {
      patch[entry.path ?? ''] =
        entry.type === 'switch' ? value === 'on' : value.trim() === '' ? null : value.trim();
    }
  }

  if (brand) patch.brand = brand;
  return patch;
}
