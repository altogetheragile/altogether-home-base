import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ExternalLink, Pencil } from 'lucide-react';
import { useSeoContent, useUpdateSeo, metaDescriptionStatus, type SeoItem, type SeoTable } from '@/hooks/useSeoContent';

const KIND_LABEL: Record<SeoItem['kind'], string> = { exam: 'Exam', course: 'Course', blog: 'Blog' };

const toneClass: Record<'good' | 'warn' | 'bad', string> = {
  good: 'bg-green-100 text-green-800 hover:bg-green-100',
  warn: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  bad: 'bg-red-100 text-red-800 hover:bg-red-100',
};

const AdminSEO = () => {
  const { data: items = [], isLoading, error } = useSeoContent();
  const updateSeo = useUpdateSeo();
  const [editing, setEditing] = useState<SeoItem | null>(null);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Duplicate effective titles (a common SEO issue)
  const duplicateTitles = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of items) {
      const t = (it.seoTitle || it.label).trim().toLowerCase();
      counts.set(t, (counts.get(t) || 0) + 1);
    }
    return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([t]) => t));
  }, [items]);

  const summary = useMemo(() => {
    const s = { good: 0, warn: 0, bad: 0 };
    for (const it of items) s[metaDescriptionStatus(it).tone]++;
    return s;
  }, [items]);

  const openEditor = (item: SeoItem) => {
    setEditing(item);
    setSeoTitle(item.seoTitle || '');
    setSeoDescription(item.seoDescription || '');
  };

  const save = () => {
    if (!editing) return;
    updateSeo.mutate(
      { table: editing.table as SeoTable, id: editing.id, seoTitle, seoDescription },
      { onSuccess: () => setEditing(null) },
    );
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }
  if (error) {
    return <div className="rounded-md bg-red-50 text-red-700 p-4">Failed to load SEO content: {error instanceof Error ? error.message : String(error)}</div>;
  }

  const editable = items.filter((i) => i.editableHere);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">SEO</h1>
        <p className="text-gray-500 mt-1">Review and tune the search/social metadata for your content pages.</p>
      </div>

      <Tabs defaultValue="health" className="w-full">
        <TabsList>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="meta">Meta editor</TabsTrigger>
        </TabsList>

        {/* ── Health ── */}
        <TabsContent value="health" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Badge className={toneClass.good}>{summary.good} good</Badge>
            <Badge className={toneClass.warn}>{summary.warn} need work</Badge>
            <Badge className={toneClass.bad}>{summary.bad} missing</Badge>
            {duplicateTitles.size > 0 && (
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{duplicateTitles.size} duplicate title(s)</Badge>
            )}
          </div>
          <Card>
            <CardHeader><CardTitle>Meta description health</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Type</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead className="w-24 text-right">Chars</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-28">Override?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => {
                    const st = metaDescriptionStatus(it);
                    const dup = duplicateTitles.has((it.seoTitle || it.label).trim().toLowerCase());
                    return (
                      <TableRow key={`${it.table}-${it.id}`}>
                        <TableCell><Badge variant="outline">{KIND_LABEL[it.kind]}</Badge></TableCell>
                        <TableCell>
                          <a href={it.url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            {it.label} <ExternalLink className="h-3 w-3" />
                          </a>
                          {!it.published && <span className="ml-2 text-xs text-gray-400">(draft)</span>}
                          {dup && <span className="ml-2 text-xs text-amber-600">duplicate title</span>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm text-gray-600">{st.length}</TableCell>
                        <TableCell><Badge className={toneClass[st.tone]}>{st.label}</Badge></TableCell>
                        <TableCell>
                          {it.seoTitle || it.seoDescription
                            ? <span className="text-xs text-green-700">custom</span>
                            : <span className="text-xs text-gray-400">default</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Meta editor ── */}
        <TabsContent value="meta" className="space-y-4">
          <p className="text-sm text-gray-500">
            Override the search title and meta description per page. Leave blank to use the default (the page title and description).
            Blog posts are edited in the Blog section.
          </p>
          <Card>
            <CardHeader><CardTitle>Exams &amp; Courses</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Type</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead className="w-28">SEO title</TableHead>
                    <TableHead className="w-32">SEO description</TableHead>
                    <TableHead className="w-20 text-right">Edit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editable.map((it) => (
                    <TableRow key={`${it.table}-${it.id}`}>
                      <TableCell><Badge variant="outline">{KIND_LABEL[it.kind]}</Badge></TableCell>
                      <TableCell>{it.label}</TableCell>
                      <TableCell className="text-xs">{it.seoTitle ? '✓ set' : <span className="text-gray-400">default</span>}</TableCell>
                      <TableCell className="text-xs">{it.seoDescription ? '✓ set' : <span className="text-gray-400">default</span>}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openEditor(it)}><Pencil className="h-3.5 w-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">SEO title</Label>
              <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder={editing?.label} className="mt-1" />
              <p className="text-[10px] text-muted-foreground text-right mt-0.5">{seoTitle.length} / 60</p>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">SEO description</Label>
              <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={3} placeholder={editing?.description || ''} className="mt-1" />
              <p className="text-[10px] text-muted-foreground text-right mt-0.5">{seoDescription.length} / 155</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save} disabled={updateSeo.isPending}>{updateSeo.isPending ? 'Saving…' : 'Save'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSEO;
