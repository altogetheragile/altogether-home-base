import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ExternalLink, Search } from 'lucide-react';
import { toast } from 'sonner';
import { amazonLink, amazonLinkKind, AMAZON_LINK_ATTRS } from '@altogether/ui/amazon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useSaveBook, useUpdateBooks, useDeleteBook, type AdminBook, type AdminCategory, type BookInput,
} from '@/hooks/useReadingList';
import { BookFormDialog } from './BookFormDialog';

type Shown = 'all' | 'visible' | 'hidden';

export function ReadingBooksTab({ books, categories, tag }: { books: AdminBook[]; categories: AdminCategory[]; tag: string }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [shown, setShown] = useState<Shown>('all');
  const [searchOnly, setSearchOnly] = useState(false);
  const [noCover, setNoCover] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [moveTo, setMoveTo] = useState('');
  const [editing, setEditing] = useState<AdminBook | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<AdminBook | null>(null);

  const save = useSaveBook();
  const update = useUpdateBooks();
  const remove = useDeleteBook();

  const catName = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const order = useMemo(() => new Map(categories.map((c, i) => [c.id, i])), [categories]);
  const needingAsin = books.filter((b) => amazonLinkKind(b) === 'search').length;
  const withoutCover = books.filter((b) => !b.cover_url).length;

  const rows = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return books
      .filter((b) => category === 'all' || b.category_id === category)
      .filter((b) => shown === 'all' || (shown === 'visible') === b.is_visible)
      .filter((b) => !searchOnly || amazonLinkKind(b) === 'search')
      .filter((b) => !noCover || !b.cover_url)
      .filter((b) => words.every((w) => `${b.title} ${b.author}`.toLowerCase().includes(w)))
      .sort((a, b) => (order.get(a.category_id) ?? 0) - (order.get(b.category_id) ?? 0)
        || Number(b.is_featured) - Number(a.is_featured) || a.sort_order - b.sort_order || a.title.localeCompare(b.title));
  }, [books, query, category, shown, searchOnly, noCover, order]);

  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allOnPage ? new Set() : new Set(rows.map((r) => r.id)));
  const toggle = (id: string) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const ids = [...selected];

  const bulk = (patch: Parameters<typeof update.mutate>[0]['patch'], said: string) =>
    update.mutate({ ids, patch }, {
      onSuccess: () => { toast.success(`${ids.length} ${ids.length === 1 ? 'book' : 'books'} ${said}.`); setSelected(new Set()); },
      onError: (e) => toast.error(e.message),
    });

  const onSave = (book: BookInput) =>
    save.mutate({ id: editing?.id, book }, {
      onSuccess: () => { toast.success(editing ? 'Book saved.' : 'Book added.'); setFormOpen(false); },
      onError: (e) => toast.error(/duplicate|unique/i.test(e.message) ? 'There is already a book with that title and author.' : e.message),
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1 space-y-1.5">
          <Label htmlFor="rb-search">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="rb-search" type="search" className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Title or author" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rb-filter-category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="rb-filter-category" className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rb-filter-shown">Shown</Label>
          <Select value={shown} onValueChange={(v) => setShown(v as Shown)}>
            <SelectTrigger id="rb-filter-shown" className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="visible">Shown</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Checkbox id="rb-search-only" checked={searchOnly} onCheckedChange={(v) => setSearchOnly(v === true)} />
          <Label htmlFor="rb-search-only">Needs an ASIN ({needingAsin})</Label>
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Checkbox id="rb-no-cover" checked={noCover} onCheckedChange={(v) => setNoCover(v === true)} />
          <Label htmlFor="rb-no-cover">No cover ({withoutCover})</Label>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} disabled={!categories.length}>
          <Plus className="mr-1 h-4 w-4" aria-hidden /> Add Book
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/50 p-2 text-sm" role="region" aria-label="Selected books">
          <span className="font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => bulk({ is_visible: true }, 'shown')}>Show</Button>
          <Button size="sm" variant="outline" onClick={() => bulk({ is_visible: false }, 'hidden')}>Hide</Button>
          <Select value={moveTo} onValueChange={setMoveTo}>
            <SelectTrigger className="h-8 w-[220px]" aria-label="Move to category"><SelectValue placeholder="Move to..." /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button size="sm" variant="outline" disabled={!moveTo} onClick={() => bulk({ category_id: moveTo }, `moved to ${catName.get(moveTo)?.name}`)}>Move</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <p className="text-sm text-muted-foreground" aria-live="polite">{rows.length} of {books.length} books</p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox checked={allOnPage} onCheckedChange={toggleAll} aria-label="Select every book listed" /></TableHead>
              <TableHead>Book</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Link</TableHead>
              <TableHead className="w-20">Shown</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((b) => {
              const kind = amazonLinkKind(b);
              const cat = catName.get(b.category_id);
              return (
                <TableRow key={b.id} data-state={selected.has(b.id) ? 'selected' : undefined}>
                  <TableCell><Checkbox checked={selected.has(b.id)} onCheckedChange={() => toggle(b.id)} aria-label={`Select ${b.title}`} /></TableCell>
                  <TableCell className="min-w-0">
                    <div className="flex min-w-0 items-center gap-3">
                      {b.cover_url
                        ? <img src={b.cover_url} alt="" width={28} height={42} loading="lazy" className="h-[42px] w-7 shrink-0 rounded-sm border object-cover" />
                        : <div className="h-[42px] w-7 shrink-0 rounded-sm border border-dashed" aria-hidden />}
                      <div className="min-w-0">
                    <div className="font-medium">{b.title}{b.is_featured && <Badge variant="secondary" className="ml-2">Featured</Badge>}</div>
                    <div className="text-sm text-muted-foreground">{b.author}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{cat?.name}{cat && !cat.is_visible && <span className="text-muted-foreground"> (hidden)</span>}</TableCell>
                  <TableCell>
                    {kind === 'search'
                      ? <Badge variant="outline" className="border-amber-500 text-amber-700">Search link</Badge>
                      : <Badge variant="outline">{kind === 'asin' ? b.asin : 'Custom URL'}</Badge>}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={b.is_visible}
                      aria-label={`Show ${b.title}`}
                      onCheckedChange={(v) => update.mutate({ ids: [b.id], patch: { is_visible: v } }, { onError: (e) => toast.error(e.message) })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <a href={amazonLink(b, tag)} {...AMAZON_LINK_ATTRS} aria-label={`Test the Amazon link for ${b.title}`}><ExternalLink className="h-4 w-4" /></a>
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Edit ${b.title}`} onClick={() => { setEditing(b); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${b.title}`} onClick={() => setDeleting(b)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No books match.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <BookFormDialog
        key={formOpen ? (editing?.id ?? 'new') : 'closed'}
        open={formOpen}
        onOpenChange={setFormOpen}
        book={editing}
        categories={categories}
        tag={tag}
        saving={save.isPending}
        onSave={onSave}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.title}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the book and its internal notes. Hiding it keeps them.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && remove.mutate(deleting.id, {
                onSuccess: () => toast.success('Book deleted.'),
                onError: (e) => toast.error(e.message),
              })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
