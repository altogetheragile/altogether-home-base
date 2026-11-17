import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { readReadingListCsv, planImport, writeReadingListCsv, type ImportPlan, type CsvReadResult } from '@altogether/ui/reading-list-csv';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useApplyImport, useSaveReadingSettings, type AdminBook, type AdminCategory,
} from '@/hooks/useReadingList';

export function ReadingSettingsTab({
  books, categories, settings,
}: {
  books: AdminBook[];
  categories: AdminCategory[];
  settings: { id: string; amazon_associate_tag: string | null; show_reading_list: boolean | null } | null;
}) {
  const [tag, setTag] = useState(settings?.amazon_associate_tag ?? '');
  const [file, setFile] = useState<{ name: string; read: CsvReadResult; plan: ImportPlan } | null>(null);
  const saveSettings = useSaveReadingSettings();
  const apply = useApplyImport();

  const choose = async (f: File | undefined) => {
    if (!f) return;
    const read = readReadingListCsv(await f.text());
    setFile({ name: f.name, read, plan: planImport(read.books, categories, books) });
  };

  const exportCsv = () => {
    const name = new Map(categories.map((c) => [c.id, c.name]));
    const order = new Map(categories.map((c, i) => [c.id, i]));
    const rows = [...books]
      .sort((a, b) => (order.get(a.category_id) ?? 0) - (order.get(b.category_id) ?? 0) || a.sort_order - b.sort_order)
      .map((b) => ({ ...b, category: name.get(b.category_id) ?? '' }));
    const blob = new Blob([`\uFEFF${writeReadingListCsv(rows)}`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `reading-list-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const p = file?.plan;
  const changes = p ? p.newCategories.length + p.inserts.length + p.updates.length : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Both are site settings, shared with the rest of Admin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {settings ? (
            <>
              <div className="flex items-start gap-3">
                <Switch
                  id="rs-module"
                  checked={settings.show_reading_list === true}
                  onCheckedChange={(v) => saveSettings.mutate({ id: settings.id, patch: { show_reading_list: v } }, {
                    onSuccess: () => toast.success(v ? 'The reading list is live.' : 'The reading list is hidden from visitors.'),
                    onError: (e) => toast.error(e.message),
                  })}
                />
                <div>
                  <Label htmlFor="rs-module">Show the reading list to visitors</Label>
                  <p className="text-sm text-muted-foreground">
                    Off, and /resources/reading-list answers Not Found for everybody except admins, and the menu leaves it out.
                    The sitemap picks up a change at the next deploy.
                  </p>
                </div>
              </div>
              <form
                className="space-y-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveSettings.mutate({ id: settings.id, patch: { amazon_associate_tag: tag.trim() || null } }, {
                    onSuccess: () => toast.success('Associates tag saved.'),
                    onError: (er) => toast.error(er.message),
                  });
                }}
              >
                <Label htmlFor="rs-tag">Amazon Associates tag</Label>
                <div className="flex gap-2">
                  <Input id="rs-tag" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="altogethera09-21" />
                  <Button type="submit" variant="outline" disabled={saveSettings.isPending || tag.trim() === (settings.amazon_associate_tag ?? '')}>Save</Button>
                </div>
                <p className="text-sm text-muted-foreground">Put on every Amazon link. Empty, and the links still work but earn nothing.</p>
              </form>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No site settings row yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CSV</CardTitle>
          <CardDescription>
            Import matches books on title and author: a match is updated, never duplicated, and keeps any ASIN, blurb or link the file leaves empty.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={exportCsv} disabled={!books.length}>
            <Download className="mr-1 h-4 w-4" aria-hidden /> Export {books.length} Books
          </Button>

          <div className="space-y-1.5">
            <Label htmlFor="rs-file">Import a CSV</Label>
            <Input id="rs-file" type="file" accept=".csv,text/csv" onChange={(e) => { void choose(e.target.files?.[0]); e.target.value = ''; }} />
            <p className="text-sm text-muted-foreground">Columns: Show, Section, Title, Author, Owned, Agile Centre List, Amazon Link. An exported file also has ASIN, Blurb, Featured and Sort Order.</p>
          </div>

          {file && p && (
            <div className="space-y-3 rounded-md border p-3 text-sm" aria-live="polite">
              <p className="font-medium">{file.name}: {file.read.books.length} books read.</p>
              <ul className="list-disc space-y-0.5 pl-5">
                <li>{p.newCategories.length} new {p.newCategories.length === 1 ? 'category' : 'categories'}{p.newCategories.length ? `: ${p.newCategories.map((c) => c.name).join(', ')}` : ''}</li>
                <li>{p.inserts.length} new books</li>
                <li>{p.updates.length} books updated</li>
                <li>{p.unchanged} unchanged</li>
              </ul>
              {file.read.problems.length > 0 && (
                <div className="text-destructive">
                  <p className="font-medium">Skipped:</p>
                  <ul className="list-disc pl-5">{file.read.problems.map((pr) => <li key={pr.line}>Line {pr.line}: {pr.reason}</li>)}</ul>
                </div>
              )}
              {p.duplicates.length > 0 && <p className="text-amber-700">In the file twice, the later row is used: {p.duplicates.join('; ')}</p>}
              <div className="flex gap-2">
                <Button
                  disabled={changes === 0 || apply.isPending}
                  onClick={() => apply.mutate(p, {
                    onSuccess: () => { toast.success(`Imported: ${p.inserts.length} new, ${p.updates.length} updated.`); setFile(null); },
                    onError: (e) => toast.error(`Import stopped part way: ${e.message}. Running it again carries on where it left off.`),
                  })}
                >
                  <Upload className="mr-1 h-4 w-4" aria-hidden /> {apply.isPending ? 'Importing...' : changes ? 'Import' : 'Nothing to change'}
                </Button>
                <Button variant="ghost" onClick={() => setFile(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
