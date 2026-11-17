import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { slugify } from '@altogether/ui/reading-list-csv';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useSaveCategory, useOrderCategories, useDeleteCategory, type AdminBook, type AdminCategory,
} from '@/hooks/useReadingList';

/** A name box that saves when you leave it or press Enter, and only when it changed. */
function NameBox({ category, onRename }: { category: AdminCategory; onRename: (name: string) => void }) {
  const [name, setName] = useState(category.name);
  const commit = () => {
    const n = name.trim();
    if (!n) { setName(category.name); return; }
    if (n !== category.name) onRename(n);
  };
  return (
    <Input
      value={name}
      aria-label={`Name of ${category.name}`}
      onChange={(e) => setName(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') setName(category.name); }}
    />
  );
}

export function ReadingCategoriesTab({ categories, books }: { categories: AdminCategory[]; books: AdminBook[] }) {
  const [newName, setNewName] = useState('');
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);
  const [moveTo, setMoveTo] = useState('');
  const save = useSaveCategory();
  const reorder = useOrderCategories();
  const remove = useDeleteCategory();

  const count = (id: string) => books.filter((b) => b.category_id === id).length;
  const fail = (e: Error) => toast.error(/duplicate|unique/i.test(e.message) ? 'A category with that address already exists. Choose another name.' : e.message);

  const move = (i: number, by: -1 | 1) => {
    const ids = categories.map((c) => c.id);
    [ids[i], ids[i + by]] = [ids[i + by], ids[i]];
    reorder.mutate(ids, { onError: fail });
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const last = categories.reduce((m, c) => Math.max(m, c.sort_order), 0);
    save.mutate(
      { patch: { name, slug: slugify(name), sort_order: last + 10, is_visible: true } },
      { onSuccess: () => { setNewName(''); toast.success('Category added.'); }, onError: fail },
    );
  };

  const inUse = deleting ? count(deleting.id) : 0;
  const others = categories.filter((c) => c.id !== deleting?.id);

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1 space-y-1.5">
          <Label htmlFor="rc-new">New category</Label>
          <Input id="rc-new" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Facilitation" />
        </div>
        <Button type="submit" disabled={!newName.trim() || save.isPending}><Plus className="mr-1 h-4 w-4" aria-hidden /> Add Category</Button>
      </form>

      <p className="text-sm text-muted-foreground">
        The order here is the order on the page. Renaming keeps the address (/resources/reading-list?category=...) so shared links keep working.
      </p>

      <ol className="divide-y rounded-md border">
        {categories.map((c, i) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 p-3">
            <div className="flex flex-col">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0 || reorder.isPending} onClick={() => move(i, -1)} aria-label={`Move ${c.name} up`}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === categories.length - 1 || reorder.isPending} onClick={() => move(i, 1)} aria-label={`Move ${c.name} down`}>
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-w-[200px] flex-1">
              <NameBox key={c.name} category={c} onRename={(name) => save.mutate({ id: c.id, patch: { name } }, { onSuccess: () => toast.success('Renamed.'), onError: fail })} />
              <p className="mt-1 text-xs text-muted-foreground">?category={c.slug} · {count(c.id)} {count(c.id) === 1 ? 'book' : 'books'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={`rc-visible-${c.id}`}
                checked={c.is_visible}
                onCheckedChange={(v) => save.mutate({ id: c.id, patch: { is_visible: v } }, { onError: fail })}
              />
              <Label htmlFor={`rc-visible-${c.id}`} className="text-sm">{c.is_visible ? 'Shown' : 'Hidden'}</Label>
            </div>
            <Button variant="ghost" size="icon" aria-label={`Delete ${c.name}`} onClick={() => { setMoveTo(''); setDeleting(c); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
        {categories.length === 0 && <li className="p-6 text-center text-muted-foreground">No categories yet. Import the CSV, or add one above.</li>}
      </ol>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {inUse === 0
                ? 'It has no books, so nothing else changes.'
                : `It still has ${inUse} ${inUse === 1 ? 'book' : 'books'}. Choose where they go; the category cannot be deleted with books in it.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {inUse > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="rc-move-to">Move the books to</Label>
              <Select value={moveTo} onValueChange={setMoveTo}>
                <SelectTrigger id="rc-move-to"><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent>{others.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={inUse > 0 && !moveTo}
              onClick={() => deleting && remove.mutate(
                { id: deleting.id, moveTo: inUse > 0 ? moveTo : undefined },
                { onSuccess: () => toast.success(inUse ? `Books moved and ${deleting.name} deleted.` : 'Category deleted.'), onError: fail },
              )}
            >
              {inUse > 0 ? 'Move and Delete' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
