import type { CopyField } from './store';

// ============= Somewhere to look =============
//
// The drawer listed every field of a page in one flat column. About has 38, This Site 34, Home 33,
// and 204 across the site. A column of 38 boxes has no landmarks: you cannot tell where the hero
// ends and the founder begins, you scroll past the thing you came for, and a switch fourteen
// fields down is, for practical purposes, not there. That is not a theory. Somebody looking for a
// way to hide one page found the only switch on screen, flipped it, and took a whole menu with it.
//
// The keys already say where a field belongs. `home.hero.heading` is the hero, `home.founder.years`
// is the founder. So the grouping is read from the key rather than declared per field, which means
// there is nothing to keep in step and it cannot drift from the registry. Where that reading is
// wrong, a field says its own group and the reading is skipped.

export type FieldGroup = { name: string; fields: CopyField[] };

/** Fields whose key has no middle part belong to the page rather than to a part of it. */
export const UNGROUPED = 'This page';

/** Segments whose plain sentence-case is not what a person would call that part of a page. */
const NICER: Record<string, string> = {
  meta: 'Search and sharing',
  cta: 'Call to action',
  kb: 'Knowledge base',
  faq: 'Questions people ask',
  why: 'Why it works',
  seo: 'Search and sharing',
};

const humanise = (segment: string) =>
  NICER[segment] ?? segment.replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** Which group a field belongs to: what it says, or the middle of its key. */
export function groupOf(field: Pick<CopyField, 'key' | 'group'>): string {
  if (field.group?.trim()) return field.group.trim();
  const parts = field.key.split('.');
  return parts.length >= 3 ? humanise(parts[1]) : UNGROUPED;
}

/** The fields of a page, in groups, in the order the registry put them.
 *
 *  Registry order rather than alphabetical: the registry is already written in the order the
 *  things appear on the page, which is the order somebody reading the page expects to find them. */
export function groupFields(fields: CopyField[]): FieldGroup[] {
  const out: FieldGroup[] = [];
  const at = new Map<string, FieldGroup>();
  for (const field of fields) {
    const name = groupOf(field);
    let group = at.get(name);
    if (!group) {
      group = { name, fields: [] };
      at.set(name, group);
      out.push(group);
    }
    group.fields.push(field);
  }
  // A lone group is not a grouping, it is a heading over the whole list saying nothing.
  return out.length > 1 ? out : [];
}

/** Does this field answer what somebody typed?
 *
 *  Label and hint, because that is the language on screen, and the key, because somebody who
 *  knows it is looking for exactly one thing. Not the value: searching your own words and landing
 *  on the box you are already reading is not finding anything. */
export function matches(field: Pick<CopyField, 'key' | 'label' | 'hint'>, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [field.label, field.hint, field.key].some((s) => s?.toLowerCase().includes(q));
}

/** The groups, keeping only what answers the query, and dropping any left empty. */
export function filterGroups(groups: FieldGroup[], query: string): FieldGroup[] {
  if (!query.trim()) return groups;
  return groups
    .map((g) => ({ name: g.name, fields: g.fields.filter((f) => matches(f, query)) }))
    .filter((g) => g.fields.length > 0);
}
