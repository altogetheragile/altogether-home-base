import { useRef, useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

import { picture } from './fields';

// ============= A picture, and the words that stand in for it =============
//
// Both in one box, on purpose. Alt text kept somewhere else is alt text that goes stale the first
// time somebody swaps the picture and not the sentence, and nobody notices, because the only
// people who read it cannot see the picture.
//
// The upload goes straight from the browser to storage on the person's own session, so the same
// policies that guard everything else guard this. The value stored is the public URL.
//
// It can also pick something already uploaded. Without that, this box could only ever add: the
// site had a whole asset library in Admin and no way to reach it from the page, so the only way
// to reuse last week's picture was to find the file again and upload it a second time.

/** A picture the site already has. Title and description are the library's own words for it. */
export type StoredPicture = { url: string; title?: string | null; description?: string | null };

const MAX_BYTES = 4 * 1024 * 1024;

export function PictureBox({
  value,
  onChange,
  upload: putFile,
  pictures,
}: {
  value: string;
  onChange: (next: string) => void;
  /** Stores the file and answers with the address to render it from. */
  upload: (file: File) => Promise<string>;
  /** What this site has already uploaded. Absent in a host that cannot list them, and then the
   *  box simply does not offer to choose, rather than offering a button that finds nothing. */
  pictures?: () => Promise<StoredPicture[]>;
}) {
  const current = picture(value);
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [library, setLibrary] = useState<StoredPicture[] | null>(null);
  const [browsing, setBrowsing] = useState(false);

  const browse = async () => {
    if (browsing) return setBrowsing(false);
    setBrowsing(true);
    setError(null);
    // Fetched when it is first asked for rather than on mount: most fields are words, and every
    // drawer opening would otherwise list the whole library to draw nothing.
    if (library === null && pictures) {
      try {
        setLibrary(await pictures());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not read what this site has already.');
        setBrowsing(false);
      }
    }
  };

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
      write(await putFile(f), current?.alt ?? '');
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
            {pictures && (
              <button
                onClick={browse}
                aria-expanded={browsing}
                className="flex items-center gap-1.5 rounded border border-border px-2 py-1 text-xs hover:bg-muted"
              >
                <ImageIcon size={12} />
                Choose
              </button>
            )}
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
      {browsing && (
        <div className="rounded border border-border p-2">
          {library === null ? (
            <p className="text-xs text-muted-foreground">Looking...</p>
          ) : library.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nothing uploaded yet. Anything you upload here appears in this list afterwards.
            </p>
          ) : (
            <div className="grid max-h-56 grid-cols-4 gap-1.5 overflow-y-auto">
              {library.map((a) => (
                <button
                  key={a.url}
                  title={a.title || a.description || a.url}
                  onClick={() => {
                    // The description the library holds becomes the alt text, but only when this
                    // field has none: what has been written here about this picture in this place
                    // is more particular than a line typed once in Admin.
                    write(a.url, current?.alt || a.description || '');
                    setBrowsing(false);
                  }}
                  className="group relative aspect-square overflow-hidden rounded border border-border hover:border-primary"
                >
                  <img src={a.url} alt={a.title ?? ''} loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
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
