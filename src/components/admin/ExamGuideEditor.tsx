import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { PencilLine, X, Check, Loader2, ChevronsLeft, ChevronsRight, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUpdateExam } from '@/hooks/useExamMutations';
import type { Exam } from '@/hooks/useExams';

// ============= Editing an exam's guide =============
//
// Modelled on the zoo game's copy editor: a side panel, a real writing surface, and edits that go
// live for everyone. It sits in Admin rather than on the exam page itself, which the zoo editor
// manages, because the exam pages are served by the Next app and that app deliberately cannot see
// your session - see src/utils/authPresence.ts. The cookie it publishes says "somebody is signed
// in" and nothing more, so an exam page cannot tell an admin from a visitor and has no business
// offering an edit box.
//
// The preview matters more here than in the zoo. Zoo copy is a sentence at a time; a guide is a
// thousand words of markdown, and writing that blind into a textarea is how you find out on the
// live site that a heading was never a heading.

/** Mirrors the .aa-exam-guide rules in apps/web ExamPlayer.tsx, which are what the page really
 *  uses. examGuidePreviewMatchesPage.test.ts fails if one grows an element the other lacks.
 *  react-markdown here, marked there: close enough for prose, but a GFM table renders on the page
 *  and not in this preview. No guide uses one yet. */
const PREVIEW = {
  h2: 'text-[22px] font-extrabold leading-tight mt-8 mb-2.5 first:mt-0 text-[color:var(--aa-deep-teal)]',
  h3: 'text-[17px] font-bold mt-6 mb-2 first:mt-0 text-[color:var(--aa-deep-teal)]',
  p: 'mb-4',
  ul: 'mb-4 pl-6 list-disc',
  ol: 'mb-4 pl-6 list-decimal',
  li: 'mb-2',
  a: 'text-[color:var(--aa-mid-teal)] underline',
  strong: 'font-bold text-[color:var(--aa-deep-teal)]',
  blockquote: 'mb-4 py-3 px-[18px] border-l-4 border-[color:var(--aa-light-teal)] bg-[color:var(--aa-sky-teal)] rounded-r-lg [&>p:last-child]:mb-0',
};

function Preview({ markdown }: { markdown: string }) {
  if (!markdown.trim()) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Nothing yet. What you type appears here as the page will show it.</p>;
  }
  return (
    <div className="text-[16px] leading-[1.75] text-[color:var(--aa-body)]">
      <ReactMarkdown
        components={{
          h2: ({ children }) => <h2 className={PREVIEW.h2}>{children}</h2>,
          h3: ({ children }) => <h3 className={PREVIEW.h3}>{children}</h3>,
          p: ({ children }) => <p className={PREVIEW.p}>{children}</p>,
          ul: ({ children }) => <ul className={PREVIEW.ul}>{children}</ul>,
          ol: ({ children }) => <ol className={PREVIEW.ol}>{children}</ol>,
          li: ({ children }) => <li className={PREVIEW.li}>{children}</li>,
          a: ({ href, children }) => <a href={href} className={PREVIEW.a}>{children}</a>,
          strong: ({ children }) => <strong className={PREVIEW.strong}>{children}</strong>,
          blockquote: ({ children }) => <blockquote className={PREVIEW.blockquote}>{children}</blockquote>,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

export function ExamGuideEditor({ exam, onClose }: { exam: Exam; onClose: () => void }) {
  const shipped = exam.guide ?? '';
  const [draft, setDraft] = useState(shipped);
  const [wide, setWide] = useState(true);
  const [pane, setPane] = useState<'write' | 'preview'>('write');
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateExam();

  const words = useMemo(() => draft.trim().split(/\s+/).filter(Boolean).length, [draft]);
  const dirty = draft !== shipped;

  const save = () => {
    setError(null);
    update.mutate(
      { id: exam.id, data: { guide: draft.trim() || undefined } },
      { onSuccess: () => onClose(), onError: (e: unknown) => setError(e instanceof Error ? e.message : 'Save failed') },
    );
  };

  return (
    <div className={cn('fixed right-0 top-0 z-50 flex h-full flex-col border-l border-border bg-background shadow-2xl',
      wide ? 'w-[min(1200px,96vw)]' : 'w-[min(680px,94vw)]')}>
      <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold"><PencilLine className="h-4 w-4 text-primary" /> Guide</h2>
          <p className="truncate text-[11px] text-muted-foreground">{exam.title}. Edits go live for everyone.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => setWide((w) => !w)} aria-label={wide ? 'Narrower' : 'Wider'}
            className="rounded border border-border p-1 text-muted-foreground hover:text-foreground">
            {wide ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
          </button>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
      </div>

      {/* The count is here because thinness is the whole reason this field exists: these pages
          rendered about 140 words, nearly all of it navigation and footer, and Google declined to
          index the ones it had looked at. */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <p className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">{words}</span> words. Markdown: <code>##</code> for a heading, <code>-</code> for a list, <code>**bold**</code>.
        </p>
        <div className={cn('flex shrink-0 gap-1', wide && 'md:hidden')}>
          {(['write', 'preview'] as const).map((p) => (
            <button key={p} type="button" onClick={() => setPane(p)}
              className={cn('rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize',
                pane === p ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
              {p === 'preview' && <Eye className="mr-1 inline h-3 w-3" />}{p}
            </button>
          ))}
        </div>
      </div>

      {/* Two columns only where two columns fit. The toggle asks for a split; the viewport
          decides whether it can have one, or 400px of phone becomes two 170px columns. */}
      <div className={cn('min-h-0 flex-1 overflow-hidden', wide && 'md:grid md:grid-cols-2 md:divide-x md:divide-border')}>
        <div className={cn('h-full min-h-0 p-3', pane !== 'write' && 'hidden', wide && 'md:block')}>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Guide markdown"
            placeholder="What this paper is, how the format works, how to prepare, what people get wrong, one worked question."
            className="h-full w-full resize-none rounded border border-border bg-background p-3 font-mono text-[13px] leading-relaxed outline-none focus:border-primary" />
        </div>
        <div className={cn('h-full min-h-0 overflow-y-auto bg-muted/30 px-6 py-4', pane !== 'preview' && 'hidden', wide && 'md:block')}>
          <Preview markdown={draft} />
        </div>
      </div>

      {error && <p className="border-t border-border px-4 py-2 text-[11px] text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
        {shipped ? (
          <button type="button" onClick={() => setDraft('')}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3 w-3" /> Clear
          </button>
        ) : <span />}
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          <Button size="sm" disabled={!dirty || update.isPending} onClick={save}>
            {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="mr-1 h-3.5 w-3.5" /> Save</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
