'use client';

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { EditDrawer, type EditorHost } from '@altogether/ui/editor/EditDrawer';
import { createClient } from '@/lib/supabase/client';
import { copyPageFor, CHROME_PAGE, SITE_PAGE } from '@/lib/copy/routes';
import { loadPageCopy, savePageCopy, resetCopy, undoCopy } from '@/app/actions/copy';

// ============= The Site's half of the editor =============
//
// The drawer itself lives in the design system, because the App mounts it too and neither app can
// import the other's source. What is left here is the half only this app can answer: where the
// router thinks we are, how to reach the database (server actions, so the write happens on the
// server under the caller's own session), and how to make a server-rendered page show the change.

export function EditThisPage() {
  const pathname = usePathname();
  const router = useRouter();

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
    upload: async (file: File) => {
      const supabase = createClient();
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const path = `site/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: false, cacheControl: '31536000' });
      if (error) throw error;
      const { data } = supabase.storage.from('assets').getPublicUrl(path);
      if (!data?.publicUrl) throw new Error('Uploaded, but no address came back for it.');
      return data.publicUrl;
    },
  }), [pathname, router]);

  return <EditDrawer host={host} />;
}
