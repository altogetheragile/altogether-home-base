import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { EditDrawer, type EditorHost } from '@altogether/ui/editor/EditDrawer';
import { navigationRegistry, siteRegistry } from '@altogether/ui/editor/registries';
import {
  loadPage, savePage, resetField, undoField,
  saveDraft, publishDrafts, discardDrafts,
} from '@altogether/ui/editor/store';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

// ============= The App's half of the editor =============
//
// The same drawer the Site mounts. It was only on Site pages, so opening a knowledge item or the
// flow game lost the editor entirely, with nothing to say why.
//
// Only the two site-wide tabs are offered here. These pages have no copy of their own: a
// knowledge item is domain data, edited in Admin, and inventing a registry for it would be a
// second way to edit the same thing. What is genuinely site-wide - the menu, the footer, the
// brand, the founder, how to reach you - belongs on every page, and now is.
//
// There are no server actions in this app, so the writes go straight to Supabase on the person's
// own session. That is not a weaker check: the "admins write site copy" policy decides either
// way, and the logic itself is the same module the Site's actions call.

const REGISTRIES = [navigationRegistry, siteRegistry];

export function EditThisSite() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { data: role } = useUserRole();
  const queryClient = useQueryClient();

  // Stable, so the drawer can depend on it without reloading itself on every render.
  const host: EditorHost = useMemo(() => ({
    pathname,
    // No server render to revalidate here; the pages read through react-query, so clearing it is
    // the equivalent of Next's refresh.
    refresh: () => { void queryClient.invalidateQueries(); },
    // No page-specific registry in this app, so only the site-wide tabs.
    pageForPath: () => null,
    alwaysOffered: [
      { page: 'navigation', label: 'Menu and Footer' },
      { page: 'site', label: 'This Site' },
    ],
    load: (page) => loadPage(supabase, REGISTRIES, page),
    save: (page, changes) => savePage(supabase, REGISTRIES, page, changes, user?.id ?? null),
    reset: (page, key) => resetField(supabase, page, key, user?.id ?? null),
    undo: (page, key) => undoField(supabase, REGISTRIES, page, key, user?.id ?? null),
    saveDraft: (page, changes) => saveDraft(supabase, REGISTRIES, page, changes, user?.id ?? null),
    publishDrafts: (page) => publishDrafts(supabase, REGISTRIES, page, user?.id ?? null),
    discardDrafts: (page, key) => discardDrafts(supabase, page, key),
    // No preview offered here, deliberately. This app edits the menu, the footer and the brand
    // but does not render any of them: the Site does. A preview button here would put the page
    // into a state where nothing visible changed, which reads as a broken button.
    upload: async (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const path = `site/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: false, cacheControl: '31536000' });
      if (error) throw error;
      const { data } = supabase.storage.from('assets').getPublicUrl(path);
      if (!data?.publicUrl) throw new Error('Uploaded, but no address came back for it.');
      return data.publicUrl;
    },
  }), [pathname, user?.id, queryClient]);

  // Not mounted for anybody else, so nobody else downloads it. The policies check again anyway.
  // After the hooks, because a hook cannot be called conditionally.
  if (role !== 'admin') return null;

  return <EditDrawer host={host} />;
}
