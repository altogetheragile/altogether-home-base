import { useMemo, useState } from 'react';
import { PencilLine, RotateCcw, Check, Loader2, Search, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useSiteCopy, useUpdateCopy, type CopyRow } from '@/hooks/useSiteCopy';

// ============= Editing the words on the public pages =============
//
// The zoo game's copy editor lives inside the game, because the person polishing a sentence is
// looking at it. That cannot work here: the public pages are served by the Next app, which
// deliberately has no access to your session (see src/utils/authPresence.ts), so a page cannot
// tell an admin from a visitor. This is the same idea with the preview brought to the editor
// instead of the editor taken to the page.
//
// One row per string, in the order it appears down the page, captioned with where it lives.

/** Long enough to want a box rather than a line. */
const isLong = (row: CopyRow) => row.value.length > 90 || row.value.includes('\n');

function Row({ row }: { row: CopyRow }) {
  const [draft, setDraft] = useState(row.value);
  const update = useUpdateCopy();
  const dirty = draft !== row.value;

  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-semibold text-foreground">{row.label}</span>
        <code className="shrink-0 text-[10px] text-muted-foreground">{row.key}</code>
      </div>
      <p className="mb-1.5 text-[11px] text-muted-foreground">{row.hint}</p>
      {isLong(row) ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label={row.label}
          rows={Math.min(10, Math.max(2, Math.ceil(draft.length / 70) + draft.split('\n').length))}
          className="w-full resize-y rounded border border-border bg-background px-2 py-1.5 text-sm leading-relaxed outline-none focus:border-primary"
        />
      ) : (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label={row.label}
          className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
        />
      )}
      {row.value.includes('\n') && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          Each line becomes its own line on the page. Leave it as one line for no break.
        </p>
      )}
      {dirty && (
        <div className="mt-1.5 flex items-center justify-end gap-2">
          <button type="button" onClick={() => setDraft(row.value)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-3 w-3" /> Undo
          </button>
          <Button size="sm" className="h-7 px-2 text-[11px]" disabled={update.isPending}
            onClick={() => update.mutate({ key: row.key, value: draft })}>
            {update.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="mr-1 h-3 w-3" /> Save</>}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AdminCopy() {
  const { data: rows, isLoading, error } = useSiteCopy();
  const [q, setQ] = useState('');

  const pages = useMemo(() => {
    const matches = (r: CopyRow) => !q.trim()
      || (r.label + ' ' + r.value + ' ' + r.hint + ' ' + r.key).toLowerCase().includes(q.trim().toLowerCase());
    const shown = (rows ?? []).filter(matches);
    return [...new Set(shown.map((r) => r.page))].map((page) => ({
      page, rows: shown.filter((r) => r.page === page).sort((a, b) => a.sort - b.sort),
    }));
  }, [rows, q]);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader><CardTitle>Site Copy</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-destructive">Could not read the copy: {error.message}</p>
            <p className="text-muted-foreground">
              If the table does not exist yet, the SQL and the seed command are in
              <code className="mx-1">docs/SITE_COPY.md</code>. The site keeps rendering its shipped
              wording until then.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <PencilLine className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Site Copy</h1>
          <p className="text-muted-foreground">
            The words on the public pages. Saved edits appear on the next page load.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the wording..."
          className="w-full rounded border border-border bg-background py-2 pl-8 pr-3 text-sm outline-none focus:border-primary" />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!isLoading && pages.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {q.trim() ? 'Nothing matching.' : 'No copy yet. Run node scripts/seed-site-copy.mjs to fill it.'}
        </p>
      )}

      {pages.map(({ page, rows: pageRows }) => (
        <Card key={page}>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="capitalize">{page}</CardTitle>
                <CardDescription>{pageRows.length} {pageRows.length === 1 ? 'entry' : 'entries'}, in the order they appear down the page</CardDescription>
              </div>
              <Link to={page === 'home' ? '/' : `/${page}`} target="_blank"
                className={cn('flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground')}>
                View page <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {pageRows.map((r) => <Row key={r.key} row={r} />)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
