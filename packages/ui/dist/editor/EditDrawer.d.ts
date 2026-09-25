import * as react_jsx_runtime from 'react/jsx-runtime';
import { CopyField, SaveResult } from './store.js';
import './fields.js';
import '../brand.js';
import '../tokens.js';

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
    /** Save without publishing. The site carries on showing what it showed. */
    saveDraft?: (page: string, changes: Record<string, string>) => Promise<SaveResult>;
    /** Put everything waiting on this page live, in one go. */
    publishDrafts?: (page: string) => Promise<SaveResult>;
    /** Throw away what is waiting: one field, or the whole page. Changes nothing on the site. */
    discardDrafts?: (page: string, key?: string) => Promise<SaveResult>;
    /** Whether the page behind the drawer is currently showing drafts, and how to change that.
     *
     *  Only the app that renders the words can answer this, which is why it is the host's. The App
     *  edits the menu and the footer but does not render them, so it leaves this out and the drawer
     *  offers no preview there rather than a preview of nothing. */
    preview?: {
        on: boolean;
        set: (on: boolean) => void;
    };
    /** Open on arrival, at this tab. Set from the URL, so something elsewhere can send somebody
     *  straight to the right box rather than to the right page and a hunt. */
    openAt?: string | null;
    /** Where the setup checklist lives, if this app can reach it. A plain address rather than a
     *  callback: it is a page, and both apps should leave to it properly. */
    setupHref?: string;
};
declare function EditDrawer({ host }: {
    host: EditorHost;
}): react_jsx_runtime.JSX.Element;

export { EditDrawer, type EditorHost };
