'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { EditDrawer, type EditorHost } from '@altogether/ui/editor/EditDrawer';
import { createClient } from '@/lib/supabase/client';
import { copyPageFor, CHROME_PAGE, SITE_PAGE } from '@/lib/copy/routes';
import {
  loadPageCopy, savePageCopy, resetCopy, undoCopy,
  saveDraftCopy, publishPageDrafts, discardPageDrafts,
} from '@/app/actions/copy';

// ============= The Site's half of the editor =============
//
// The drawer itself lives in the design system, because the App mounts it too and neither app can
// import the other's source. What is left here is the half only this app can answer: where the
// router thinks we are, how to reach the database (server actions, so the write happens on the
// server under the caller's own session), and how to make a server-rendered page show the change.

export function EditThisPage({ previewing = false }: { previewing?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  // `?edit=site` opens the drawer on the This Site tab. The setup checklist links this way, so
  // "go and set your business name" lands on the box rather than on the page it is somewhere on.
  const openAt = useSearchParams().get('edit');

  // Stable, so the drawer can depend on it without reloading itself on every render.
  const host: EditorHost = useMemo(() => ({
    pathname,
    refresh: () => router.refresh(),
    pageForPath: copyPageFor,
    alwaysOffered: [
      { page: CHROME_PAGE, label: 'Menu and Footer' },
      { page: SITE_PAGE, label: 'This Site' },
    ],
    load: loadPageCopy,
    save: savePageCopy,
    reset: resetCopy,
    undo: undoCopy,
    saveDraft: saveDraftCopy,
    publishDrafts: publishPageDrafts,
    discardDrafts: discardPageDrafts,
    openAt,
    setupHref: '/setup',
    preview: {
      on: previewing,
      // A whole navigation rather than a fetch: draft mode is a cookie, and the page behind the
      // drawer has to be rendered again by the server for it to mean anything.
      set: (on: boolean) => {
        window.location.href = `/api/preview?on=${on ? '1' : '0'}&back=${encodeURIComponent(pathname)}`;
      },
    },
    upload: async (file: File) => {
      const supabase = createClient();
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const path = `site/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: false, cacheControl: '31536000' });
      if (error) throw error;
      const { data } = supabase.storage.from('assets').getPublicUrl(path);
      if (!data?.publicUrl) throw new Error('Uploaded, but no address came back for it.');
      // Recorded in the library as well as put in the bucket. Uploading from this drawer used to
      // leave nothing behind but a URL in one field, so a picture added here never appeared in
      // Admin and could never be found again.
      //
      // Deliberately not fatal: the picture is uploaded and the field is about to hold it, and
      // failing the upload because the catalogue entry did not write would throw away a file that
      // is already there.
      const { data: who } = await supabase.auth.getUser();
      await supabase.from('media_assets').insert({
        url: data.publicUrl,
        title: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        file_type: file.type || null,
        file_size: file.size,
        original_filename: file.name,
        is_public: true,
        created_by: who?.user?.id ?? null,
      });
      return data.publicUrl;
    },

    // What this site has already uploaded, newest first. Images only: every field that offers
    // this is a picture field, and listing a PDF in a grid of thumbnails is offering something
    // that cannot be chosen.
    pictures: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('media_assets')
        .select('url, title, description')
        .eq('type', 'image')
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as { url: string; title: string | null; description: string | null }[];
    },
  }), [pathname, router, previewing, openAt]);

  return <EditDrawer host={host} />;
}
