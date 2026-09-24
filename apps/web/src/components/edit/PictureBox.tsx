'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { picture } from '@/lib/copy/fields';

// ============= A picture, and the words that stand in for it =============
//
// Both in one box, on purpose. Alt text kept somewhere else is alt text that goes stale the first
// time somebody swaps the picture and not the sentence, and nobody notices, because the only
// people who read it cannot see the picture.
//
// The upload goes straight from the browser to storage on the person's own session, so the same
// policies that guard everything else guard this. The value stored is the public URL.

const MAX_BYTES = 4 * 1024 * 1024;

export function PictureBox({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const current = picture(value);
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const write = (src: string, alt: string) => onChange(src ? JSON.stringify({ src, alt }) : '');

  const upload = async (f: File) => {
    setError(null);
    // A phone photograph is happily eight megabytes, and a hero background that size makes the
    // page feel broken on a train. Better to say so than to let it through and wonder later.
    if (f.size > MAX_BYTES) {
      setError(`That is ${(f.size / 1024 / 1024).toFixed(1)}MB. Images need to be under 4MB, or the page will crawl.`);
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const ext = f.name.split('.').pop()?.toLowerCase() || 'bin';
      const path = `site/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('assets').upload(path, f, { upsert: false, cacheControl: '31536000' });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('assets').getPublicUrl(path);
      if (!data?.publicUrl) throw new Error('Uploaded, but no address came back for it.');
      write(data.publicUrl, current?.alt ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That upload did not work.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-muted/40">
          {current ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={current.src} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-muted-foreground">No picture</span>
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex gap-1.5">
            <button
              onClick={() => file.current?.click()}
              disabled={busy}
              className="flex items-center gap-1.5 rounded border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              {current ? 'Replace' : 'Upload'}
            </button>
            {current && (
              <button
                onClick={() => write('', '')}
                className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
              >
                <X size={12} /> Remove
              </button>
            )}
          </div>
          <input
            value={current?.src ?? ''}
            placeholder="or paste a web address"
            onChange={(e) => write(e.target.value.trim(), current?.alt ?? '')}
            className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none"
          />
        </div>
      </div>
      {current && (
        <label className="block">
          <span className="mb-0.5 block text-xs text-muted-foreground">
            Describe the picture, for people who cannot see it
          </span>
          <input
            value={current.alt}
            placeholder="Two people talking across a table"
            onChange={(e) => write(current.src, e.target.value)}
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={file}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }}
      />
    </div>
  );
}
