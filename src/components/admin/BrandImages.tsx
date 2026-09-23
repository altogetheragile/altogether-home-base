import { useState } from 'react';
import { defaultImages, resolveImages, type ImageName } from '@altogether/ui/brand';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RotateCcw, Upload, Loader2 } from 'lucide-react';

// ============= The logo, the tab icon, and the shared-link picture =============
//
// Three files carry a brand as much as its colours do. They ship in public/ as this repository's
// defaults, which is right here and wrong on anybody else's site: without these, a second site
// renders Altogether Agile's lockup and advertises its share image to every crawler.
//
// Uploads go to the existing public `assets` bucket rather than a new one. Only absolute URLs are
// stored: a relative path would resolve against whichever site is rendering, and for an Open
// Graph image that means a crawler fetching something that does not exist.

const WHAT: Record<ImageName, { label: string; hint: string; accept: string }> = {
  logo: { label: 'Logo', hint: 'The lockup in the header and footer, on both the site and this app', accept: 'image/svg+xml,image/png,image/webp' },
  favicon: { label: 'Favicon', hint: 'The icon in the browser tab, and in search results', accept: 'image/svg+xml,image/png,image/x-icon' },
  ogImage: { label: 'Share image', hint: 'What appears when somebody shares a link. Also the logo in structured data', accept: 'image/png,image/jpeg,image/webp' },
};

type Brand = { colors?: Record<string, unknown> | null; images?: Record<string, unknown> | null } | null;

export function BrandImages({ value, onChange }: { value: Brand; onChange: (next: Brand) => void }) {
  const images = (value?.images ?? {}) as Record<string, string>;
  const resolved = resolveImages({ images });
  const [busy, setBusy] = useState<ImageName | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (name: ImageName, url: string) => {
    const next = { ...images };
    if (!url.trim()) delete next[name];
    else next[name] = url.trim();
    onChange({ ...(value ?? {}), images: next });
  };

  const upload = async (name: ImageName, file: File) => {
    setBusy(name);
    setError(null);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const path = `brand/${name}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('assets').upload(path, file, { upsert: true, cacheControl: '3600' });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('assets').getPublicUrl(path);
      if (!data?.publicUrl) throw new Error('Uploaded, but no public URL came back.');
      set(name, data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Images</CardTitle>
        <CardDescription>
          Leave empty to use the files this site ships with. Uploads go to the public assets bucket.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(Object.keys(WHAT) as ImageName[]).map((name) => (
          <div key={name} className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border bg-muted/40 p-1.5">
              <img src={resolved[name]} alt="" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor={`img-${name}`} className="text-sm font-medium">{WHAT[name].label}</Label>
              <p className="text-xs text-muted-foreground">{WHAT[name].hint}</p>
              <Input
                id={`img-${name}`}
                value={images[name] ?? ''}
                placeholder={defaultImages[name]}
                onChange={(e) => set(name, e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <Button variant="outline" size="sm" asChild disabled={busy === name}>
                <label className="cursor-pointer">
                  {busy === name ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="ml-1.5">Upload</span>
                  <input
                    type="file"
                    accept={WHAT[name].accept}
                    className="sr-only"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(name, f); e.target.value = ''; }}
                  />
                </label>
              </Button>
              {images[name] && (
                <Button variant="ghost" size="sm" onClick={() => set(name, '')} title="Use the default">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
