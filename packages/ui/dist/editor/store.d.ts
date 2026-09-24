import { CopyEntry, CopyRegistry } from './fields.js';

/** The slice of a Supabase client this needs. Typed structurally so both apps' clients fit
 *  without either of them having to agree on a version. */
type DataClient = {
    from: (table: string) => any;
};
type CopyField = {
    key: string;
    label: string;
    hint: string;
    value: string;
    shipped: string;
    type?: CopyEntry['type'];
    fields?: CopyEntry['fields'];
    undo?: {
        value: string;
        at: string;
    };
};
type SaveResult = {
    ok: true;
} | {
    ok: false;
    error: string;
};
/** The current value of a field that lives on site_settings rather than in a copy row. */
declare function readField(entry: CopyEntry, settings: Record<string, unknown>): string;
/** The patch for a set of settings changes.
 *
 *  Brand is one jsonb column, so every brand change in a save folds into a single new object.
 *  Writing them one at a time would have the last win and the rest vanish, with no error. */
declare function buildPatch(changes: {
    entry: CopyEntry;
    value: string;
}[], currentBrand: unknown): Record<string, unknown>;
/** Everything the drawer shows for one page. */
declare function loadPage(db: DataClient, registries: CopyRegistry[], page: string): Promise<CopyField[]>;
/** Writes the changed fields, in whichever store each of them lives in. */
declare function savePage(db: DataClient, registries: CopyRegistry[], page: string, changes: Record<string, string>, userId: string | null): Promise<SaveResult>;
/** Back to the wording the site shipped with. Recorded, because it still throws something away. */
declare function resetField(db: DataClient, page: string, key: string, userId: string | null): Promise<SaveResult>;
/** One step back: restore the newest previous value and forget it, so undoing again goes further.
 *  A pop, not another edit; recording it would make undo and redo the same button. */
declare function undoField(db: DataClient, registries: CopyRegistry[], page: string, key: string, userId: string | null): Promise<SaveResult>;

export { type CopyField, type DataClient, type SaveResult, buildPatch, loadPage, readField, resetField, savePage, undoField };
