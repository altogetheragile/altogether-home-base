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
    says?: CopyEntry['says'];
    undo?: {
        value: string;
        at: string;
    };
    /** A value saved but not published. `value` above is still what the site shows. */
    draft?: {
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
/** What is waiting to be published on one page, as key to value and when it was written.
 *
 *  Answers {} rather than throwing if the table is not there. A deployment whose migration has
 *  not run yet should lose drafting and nothing else. */
declare function loadDrafts(db: DataClient, page: string): Promise<Record<string, {
    value: string;
    at: string;
}>>;
/** Holds changes back instead of publishing them. Same validation as a save, because a draft that
 *  cannot be published is worse than a refused save: you find out later, having written more. */
declare function saveDraft(db: DataClient, registries: CopyRegistry[], page: string, changes: Record<string, string>, userId: string | null): Promise<SaveResult>;
/** Publishes everything waiting on one page, then forgets the drafts.
 *
 *  Through savePage, so publishing a draft and saving directly are the same write: the same
 *  validation, the same revision recorded, the same undo afterwards. A draft is never a second
 *  way to change the site, only a delay before the one way. */
declare function publishDrafts(db: DataClient, registries: CopyRegistry[], page: string, userId: string | null): Promise<SaveResult>;
/** Throws away what is waiting, changing nothing on the site. One key, or the whole page. */
declare function discardDrafts(db: DataClient, page: string, key?: string): Promise<SaveResult>;

export { type CopyField, type DataClient, type SaveResult, buildPatch, discardDrafts, loadDrafts, loadPage, publishDrafts, readField, resetField, saveDraft, savePage, undoField };
