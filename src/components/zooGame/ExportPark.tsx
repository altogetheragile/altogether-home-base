import { useState } from 'react';
import { Download, Check, Loader2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { parkSvg, parkPng, parkPdf, parkFilename, handOver } from './parkExport';
import { cn } from '@/lib/utils';
import { FOCUS } from './ui/tokens';
import type { ZooGameState } from './types';

// "Do we have an export facility on the isometric zoo? Can we have pdf and png formats?"
//
// It exports WHAT YOU ARE LOOKING AT, not the whole park regardless. The zoom and the turn are
// decisions somebody made about what they wanted to see - walking round to the far side of the
// Savanna and then being handed a picture of the whole zoo from the front is the control ignoring
// the two controls next to it.

/** The park drawing that belongs to the toolbar this button is on.
 *
 *  Scoped twice, and both halves earn their place. `closest` finds THIS park, because two can be
 *  mounted at once - the board has one and the Increment tab has another - and "the first svg on
 *  the page" is sometimes the hidden one. Then `park-drawing` finds the drawing inside it rather
 *  than the first svg, which is an icon on the toolbar: the first version of this exported a
 *  14-pixel download arrow, very crisply. */
const findSvg = (near: HTMLElement | null): SVGSVGElement | null => {
  const view = near?.closest('[data-part="park"]') ?? near?.ownerDocument;
  return (view?.querySelector('[data-part="park-drawing"] svg') ?? null) as SVGSVGElement | null;
};

export function ExportPark({ state, caption }: { state: ZooGameState; caption?: string }) {
  const [busy, setBusy] = useState<'png' | 'pdf' | null>(null);
  const [done, setDone] = useState<'png' | 'pdf' | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const take = async (format: 'png' | 'pdf', from: HTMLElement | null) => {
    const svg = findSvg(from);
    if (!svg) { setFailed('There is no drawing to take a picture of yet.'); return; }
    setBusy(format);
    setFailed(null);
    try {
      const box = svg.getBoundingClientRect();
      const size = { w: Math.round(box.width) || 1000, h: Math.round(box.height) || 620 };
      const markup = parkSvg(svg, size);
      // Three times, not two: this is going into a deck and onto a projector, and the one thing
      // worse than no export is a soft one.
      const png = await parkPng(markup, size, { scale: 3 });
      const name = parkFilename(state);
      if (format === 'png') handOver(png, `${name}.png`);
      else handOver(await parkPdf(png, size, caption), `${name}.pdf`);
      setDone(format);
      setTimeout(() => setDone(null), 2200);
    } catch {
      // Said plainly rather than swallowed. An export that silently does nothing is indisputably
      // worse than one that says it could not.
      setFailed('That did not work. The picture may still be drawing - give it a moment and try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" data-part="export-park" title="Take a picture of the zoo away"
          className={cn(FOCUS, 'flex items-center gap-1.5 rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground')}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Download className="h-3.5 w-3.5" />}
          Export
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="zoo-theme w-60 p-2">
        <p className="mb-1.5 px-1 text-[11px] leading-snug text-muted-foreground">
          The zoo as you are looking at it now, at the zoom and the angle you have set.
        </p>
        <div className="space-y-1">
          {([['png', 'PNG image', 'For a slide or a post. Three times screen size.'],
            ['pdf', 'PDF page', 'One page, sized to the picture. For printing or sending on.']] as const).map(([f, label, why]) => (
            <button key={f} type="button" data-part={`export-${f}`} disabled={!!busy}
              onClick={(e) => take(f, e.currentTarget)}
              className={cn(FOCUS, 'flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/60 disabled:opacity-50')}>
              <span className="text-xs font-semibold text-foreground">{label}</span>
              <span className="text-[11px] leading-snug text-muted-foreground">{why}</span>
            </button>
          ))}
        </div>
        {failed && <p data-part="export-failed" className="mt-1.5 px-1 text-[11px] leading-snug text-destructive">{failed}</p>}
      </PopoverContent>
    </Popover>
  );
}
