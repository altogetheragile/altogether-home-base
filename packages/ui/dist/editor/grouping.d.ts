import { CopyField } from './store.js';
import './fields.js';
import '../brand.js';
import '../tokens.js';

type FieldGroup = {
    name: string;
    fields: CopyField[];
};
/** Fields whose key has no middle part belong to the page rather than to a part of it. */
declare const UNGROUPED = "This page";
/** Which group a field belongs to: what it says, or the middle of its key. */
declare function groupOf(field: Pick<CopyField, 'key' | 'group'>): string;
/** The fields of a page, in groups, in the order the registry put them.
 *
 *  Registry order rather than alphabetical: the registry is already written in the order the
 *  things appear on the page, which is the order somebody reading the page expects to find them. */
declare function groupFields(fields: CopyField[]): FieldGroup[];
/** Does this field answer what somebody typed?
 *
 *  Label and hint, because that is the language on screen, and the key, because somebody who
 *  knows it is looking for exactly one thing. Not the value: searching your own words and landing
 *  on the box you are already reading is not finding anything. */
declare function matches(field: Pick<CopyField, 'key' | 'label' | 'hint'>, query: string): boolean;
/** The groups, keeping only what answers the query, and dropping any left empty. */
declare function filterGroups(groups: FieldGroup[], query: string): FieldGroup[];

export { type FieldGroup, UNGROUPED, filterGroups, groupFields, groupOf, matches };
