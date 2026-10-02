import { useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { drawBoard } from './boardDrawing.generated.js';
import { BOARD_INPUTS, BOARD_OUTPUTS, BOARD_DESC } from './boardLabels';
import { BOARD_PAGES, pageById, type BoardPage } from './boardPages';
import { asProse } from './prose';
import { cn } from '@/lib/utils';
import { FOCUS } from '../ui/tokens';
import './board.css';

// Scrum on one page: the board, and the page behind every shape on it.
//
// The drawing is lifted whole out of `docs/scrum-board/scrum-big-picture.html` and is byte for byte
// the board that file draws - 60,922 characters of it, held by a test. What this component adds is
// the half the standalone file does with the address bar: opening a page, going back, and lighting
// up every place an artifact appears when you point at one of them.
//
// The hash is deliberately NOT used. In the standalone page it is the router; in here the game owns
// the URL, and a board that rewrote it would fight the screen it is sitting on.

/** Everywhere an artifact appears, lit at once. The board draws the Product Backlog in four columns
 *  and the point of it is that they are the same Product Backlog. */
function Prose({ html }: { html: string }) {
  // Sanitised on every render rather than once at import, because the words are editable and the
  // edit arrives after the page is built.
  return <div className="board-prose text-sm text-muted-foreground"
    dangerouslySetInnerHTML={{ __html: asProse(html) }} />;
}

function Page({ page, onOpen, onBack }: {
  page: BoardPage;
  onOpen: (id: string) => void;
  onBack: () => void;
}) {
  // A cross-link inside the prose opens the page it names rather than leaving for the address bar.
  const follow = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = (e.target as HTMLElement).closest('a[href^="#"]');
    const id = a?.getAttribute('href')?.slice(1);
    if (!id || !pageById(id)) return;
    e.preventDefault();
    onOpen(id);
  };

  return (
    <div className="space-y-3" data-part="board-page" data-page={page.id}>
      <button type="button" onClick={onBack} data-part="board-back"
        className={cn(FOCUS, 'flex items-center gap-1 text-[11px] font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline')}>
        <ArrowLeft className="h-3.5 w-3.5" /> Back to the board
      </button>

      <header className="space-y-1">
        {page.kind && <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-primary">{page.kind}</span>}
        <h3 className="text-lg font-semibold">{page.title}</h3>
        {page.lede && <p className="text-sm leading-snug text-muted-foreground">{page.lede}</p>}
      </header>

      {page.facts.length > 0 && (
        <dl className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-border bg-muted/20 px-3 py-2">
          {page.facts.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{k}</dt>
              <dd className="text-xs font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <div onClick={follow} className="space-y-3">
        {page.secs.map(([heading, body]) => (
          <section key={heading} className="space-y-1">
            <h4 className="text-sm font-semibold">{heading}</h4>
            <Prose html={body} />
          </section>
        ))}
      </div>

      {page.rel.length > 0 && (
        <nav className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Read next</span>
          {page.rel.map((id) => pageById(id) && (
            <button key={id} type="button" onClick={() => onOpen(id)}
              className={cn(FOCUS, 'rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground')}>
              {pageById(id)!.title}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

export function ScrumBoard({ under }: {
  /** Shown beneath the board, and only there. A page opened from the board is a thing somebody went
   *  looking for, and putting the summary of Scrum under it buries the answer they asked for. */
  under?: React.ReactNode;
} = {}) {
  const [open, setOpen] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  // A closure rather than a helper the ref is handed to: it runs from a pointer handler, and the
  // ref must not be read while rendering. Not memoised either - it touches the DOM on every pointer
  // move whatever we do, and a dependency list cannot describe `root.current` honestly.
  const light = (id: string | null) => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll('.hot.lit').forEach((n) => n.classList.remove('lit'));
    if (id) el.querySelectorAll(`a[data-id="${CSS.escape(id)}"] .hot`).forEach((n) => n.classList.add('lit'));
  };

  // Drawn once. The geometry does not depend on anything that changes while the screen is up, and
  // re-running it on every render would rebuild sixty thousand characters to look identical.
  const board = useMemo(
    () => drawBoard({ INPUTS: BOARD_INPUTS, OUTPUTS: BOARD_OUTPUTS, DESC: BOARD_DESC }),
    [],
  );

  const page = open ? pageById(open) : undefined;
  if (page) {
    return <Page page={page} onOpen={setOpen} onBack={() => setOpen(null)} />;
  }

  const pick = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = (e.target as Element).closest?.('a[data-id]');
    const id = a?.getAttribute('data-id');
    if (!id || !pageById(id)) return;
    e.preventDefault();
    setOpen(id);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm leading-snug text-muted-foreground">
        Every shape opens the page behind it. Point at one to see everywhere it appears in the Sprint.
      </p>
      <div ref={root} data-part="scrum-board" className="scrum-board overflow-x-auto rounded-lg border border-border bg-card p-1"
        onClick={pick}
        onMouseOver={(e) => light((e.target as Element).closest?.('a[data-id]')?.getAttribute('data-id') ?? null)}
        onMouseLeave={() => light(null)}
        onFocus={(e) => light((e.target as Element).closest?.('a[data-id]')?.getAttribute('data-id') ?? null)}
        onBlur={() => light(null)}>
        <svg viewBox={`0 0 1200 ${board.height}`} role="img"
          aria-label="Scrum on one page: the Sprint, its events, artifacts and accountabilities"
          // Wide enough to stay readable on a phone, where the box scrolls, and narrow enough to
          // FIT the panel on a laptop, where it must not. At 56rem it overflowed an 862px panel by
          // 42px and clipped the values wheel off the right-hand edge - a scrollbar nobody would
          // think to drag, hiding one of the five things the board is about.
          className="h-auto w-full min-w-[40rem]"
          dangerouslySetInnerHTML={{ __html: board.svg }} />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {BOARD_PAGES.length} pages behind the board. Text from the 2020 Scrum Guide, CC BY-SA 4.0.
      </p>
      {under}
    </div>
  );
}
