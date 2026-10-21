import type { EditorHost } from '@altogether/ui/editor/EditDrawer';
import type { LegalPage } from '@/components/legal/legalText';

// ============= A legal page's own tab =============
//
// The words on /privacy, /terms and /cookies are a box each on This Site, because that is where
// they are stored. Opening the editor on the Privacy page and finding nothing under This Page,
// with the box two tabs and a fold away, was reported straight away: "Should /privacy have a
// this page section in the curtain?"
//
// So on those three pages the drawer also offers This Page, holding that page's one box. It is a
// view of the same saved value, not a second copy: every read and write goes to 'site', and the
// box on This Site still works. Nothing moves in the database.

const LEGAL_PATHS: Record<string, LegalPage> = {
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/cookies': 'cookies',
};

const PREFIX = 'legal:';

/** The tab for the legal page at this address, or null on every other page. */
export function legalTabFor(pathname: string): string | null {
  const page = LEGAL_PATHS[pathname.replace(/\/+$/, '') || '/'];
  return page ? `${PREFIX}${page}` : null;
}

/** The one key a legal tab edits, or null for an ordinary tab. */
function keyOf(tab: string): string | null {
  // The page names are the last part of the keys on This Site: site.legal.privacy and so on.
  return tab.startsWith(PREFIX) ? `site.legal.${tab.slice(PREFIX.length)}` : null;
}

/** Where a tab's values are kept. */
const storedOn = (tab: string) => (keyOf(tab) ? 'site' : tab);

type Store = Pick<EditorHost, 'load' | 'save' | 'reset' | 'undo' | 'saveDraft' | 'publishDrafts' | 'discardDrafts'>;

/** Teaches a host's store about the legal tabs, leaving every other tab exactly as it was.
 *
 *  Publishing and discarding are the two that need care. On This Site they act on everything
 *  waiting on 'site', which is right there and wrong here: "Publish them" under a Privacy tab that
 *  also put the brand and the founder's drafts live would be publishing what nobody was looking
 *  at. So a legal tab only ever publishes or throws away its own box. */
export function withLegalTabs(store: Store): Store {
  return {
    load: async (tab) => {
      const key = keyOf(tab);
      const fields = await store.load(storedOn(tab));
      return key ? fields.filter((f) => f.key === key) : fields;
    },
    save: (tab, changes) => store.save(storedOn(tab), changes),
    reset: (tab, key) => store.reset(storedOn(tab), key),
    undo: (tab, key) => store.undo(storedOn(tab), key),
    saveDraft: store.saveDraft && ((tab, changes) => store.saveDraft!(storedOn(tab), changes)),
    publishDrafts: store.publishDrafts && (async (tab) => {
      const key = keyOf(tab);
      if (!key) return store.publishDrafts!(tab);
      const draft = (await store.load('site')).find((f) => f.key === key)?.draft;
      if (!draft) return { ok: false, error: 'There is nothing waiting to be published here.' };
      const result = await store.save('site', { [key]: draft.value });
      // Cleared only once it is live, for the same reason as publishDrafts: the other order can
      // lose the words with the site still showing the old ones.
      if (!result.ok || !store.discardDrafts) return result;
      return store.discardDrafts('site', key);
    }),
    discardDrafts: store.discardDrafts && ((tab, key) =>
      store.discardDrafts!(storedOn(tab), key ?? keyOf(tab) ?? undefined)),
  };
}
