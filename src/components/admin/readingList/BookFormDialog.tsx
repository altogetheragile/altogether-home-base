import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { amazonLink, amazonLinkKind, extractAsin, AMAZON_LINK_ATTRS } from '@altogether/ui/amazon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ImagePicker } from '@/components/ui/image-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AdminBook, AdminCategory, BookInput } from '@/hooks/useReadingList';

const EMPTY: BookInput = {
  title: '', author: '', category_id: '', asin: null, amazon_url: null, blurb: null,
  is_visible: true, is_featured: false, sort_order: 0, owned_format: null, source_note: null,
  cover_url: null, cover_source: null,
};

const LINK_WORDS = {
  override: 'Uses the Amazon URL below',
  asin: 'Uses the ASIN',
  search: 'Uses an Amazon search for the title and author, until an ASIN is added',
} as const;

export function BookFormDialog({
  open, onOpenChange, book, categories, tag, saving, onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null to add a book. */
  book: AdminBook | null;
  categories: AdminCategory[];
  tag: string;
  saving: boolean;
  onSave: (book: BookInput) => void;
}) {
  // Starts from the book each time the dialog opens: the parent gives it a new key per opening,
  // so this is a fresh form rather than one synchronised from props after the fact.
  const [form, setForm] = useState<BookInput>(() => (book ? { ...book } : { ...EMPTY, category_id: categories[0]?.id ?? '' }));
  const [asinText, setAsinText] = useState(book?.asin ?? '');
  const [asinProblem, setAsinProblem] = useState<string | null>(null);

  const set = <K extends keyof BookInput>(k: K, v: BookInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const text = (v: string) => (v.trim() ? v : null);

  /** Takes an ASIN or a whole Amazon URL, and keeps the ASIN out of it. */
  const readAsin = (raw: string) => {
    setAsinText(raw);
    if (!raw.trim()) { set('asin', null); setAsinProblem(null); return; }
    const asin = extractAsin(raw);
    if (asin) {
      set('asin', asin);
      setAsinProblem(null);
      if (asin !== raw.trim()) setAsinText(asin);
    } else {
      set('asin', null);
      setAsinProblem('That is not an ASIN, and no ASIN could be found in it. An ASIN is 10 letters and numbers, such as B07YJ6ZLW9.');
    }
  };

  const href = amazonLink(form, tag);
  const kind = amazonLinkKind(form);
  const valid = form.title.trim() !== '' && form.category_id !== '' && !asinProblem;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{book ? 'Edit Book' : 'Add Book'}</DialogTitle>
          <DialogDescription>Everything except the internal notes can appear on the public page.</DialogDescription>
        </DialogHeader>

        <form
          className="min-w-0 space-y-4"
          onSubmit={(e) => { e.preventDefault(); if (valid) onSave({ ...form, title: form.title.trim(), author: form.author.trim() }); }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rb-title">Title</Label>
              <Input id="rb-title" required value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rb-author">Author</Label>
              <Input id="rb-author" value={form.author} onChange={(e) => set('author', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rb-category">Category</Label>
              <Select value={form.category_id} onValueChange={(v) => set('category_id', v)}>
                <SelectTrigger id="rb-category"><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}{c.is_visible ? '' : ' (hidden)'}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <fieldset className="space-y-3 rounded-md border p-3">
            <legend className="px-1 text-sm font-medium">Amazon Link</legend>
            <div className="space-y-1.5">
              <Label htmlFor="rb-asin">ASIN</Label>
              <Input
                id="rb-asin"
                value={asinText}
                onChange={(e) => readAsin(e.target.value)}
                placeholder="B07YJ6ZLW9, or paste the whole Amazon URL"
                aria-invalid={!!asinProblem}
                aria-describedby="rb-asin-help"
              />
              <p id="rb-asin-help" className={`text-xs ${asinProblem ? 'text-destructive' : 'text-muted-foreground'}`}>
                {asinProblem ?? 'Paste a product URL and the ASIN is taken out of it.'}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rb-url">Amazon URL override</Label>
              <Input
                id="rb-url"
                type="url"
                value={form.amazon_url ?? ''}
                onChange={(e) => set('amazon_url', text(e.target.value))}
                placeholder="Only when the ASIN link is not the right one"
              />
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={href} {...AMAZON_LINK_ATTRS}>
                  Test link <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden />
                </a>
              </Button>
              <span className="min-w-0 text-xs text-muted-foreground">{LINK_WORDS[kind]}{tag ? '' : '. No Associates tag is set'}.</span>
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <ImagePicker
              value={form.cover_url ?? ''}
              onChange={(url) => setForm((f) => ({ ...f, cover_url: url || null, cover_source: url ? 'upload' : null }))}
              bucket="assets"
              path="reading-covers/"
              aspect={2 / 3}
              label="Cover"
            />
            <p className="text-xs text-muted-foreground">
              {form.cover_source === 'openlibrary'
                ? 'From Open Library. Choose another to replace it; the cover script never overwrites one chosen here.'
                : 'Shown beside the title on the page. Empty, and the tile is text only.'}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rb-blurb">Blurb</Label>
            <Textarea id="rb-blurb" rows={2} value={form.blurb ?? ''} onChange={(e) => set('blurb', text(e.target.value))} placeholder="One line on why it is worth reading" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <Switch id="rb-visible" checked={form.is_visible} onCheckedChange={(v) => set('is_visible', v)} />
              <Label htmlFor="rb-visible">Shown</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="rb-featured" checked={form.is_featured} onCheckedChange={(v) => set('is_featured', v)} />
              <Label htmlFor="rb-featured">Favourite (top of the page)</Label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rb-order">Sort order</Label>
              <Input id="rb-order" type="number" value={form.sort_order} onChange={(e) => set('sort_order', Number(e.target.value) || 0)} />
            </div>
          </div>

          <fieldset className="space-y-3 rounded-md border border-dashed p-3">
            <legend className="px-1 text-sm font-medium">Internal Notes (never shown on the site)</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="rb-owned">Owned</Label>
                <Input id="rb-owned" value={form.owned_format ?? ''} onChange={(e) => set('owned_format', text(e.target.value))} placeholder="Kindle, Audible" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rb-source">Agile Centre list</Label>
                <Input id="rb-source" value={form.source_note ?? ''} onChange={(e) => set('source_note', text(e.target.value))} />
              </div>
            </div>
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!valid || saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
