import * as react_jsx_runtime from 'react/jsx-runtime';
import { CopyField, SaveResult } from './store.js';
import './fields.js';

/** Everything the drawer cannot know for itself.
 *
 *  Which app is rendering it, where the router thinks we are, how to reach the database, and how
 *  to make the page show what was just saved. The Site answers with server actions and Next's
 *  router; the App answers with the Supabase client and its own. Neither has to know about the
 *  other, and both get the same editor. */
type EditorHost = {
    pathname: string;
    /** Make the page behind the drawer show the change. */
    refresh: () => void;
    /** Which registry this URL edits, or null where there is nothing page-specific to edit. */
    pageForPath: (pathname: string) => string | null;
    /** The tabs offered everywhere, in order. */
    alwaysOffered: {
        page: string;
        label: string;
    }[];
    load: (page: string) => Promise<CopyField[]>;
    save: (page: string, changes: Record<string, string>) => Promise<SaveResult>;
    reset: (page: string, key: string) => Promise<SaveResult>;
    undo: (page: string, key: string) => Promise<SaveResult>;
    upload: (file: File) => Promise<string>;
};
declare function EditDrawer({ host }: {
    host: EditorHost;
}): react_jsx_runtime.JSX.Element;

export { EditDrawer, type EditorHost };
