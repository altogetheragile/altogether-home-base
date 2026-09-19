// Taking a picture of the zoo away with you.
//
// Asked for after the orientation screen went in: "do we have an export facility on the isometric
// zoo? Can we have pdf and png formats?"
//
// It does NOT go through html2canvas, which is what every other export on this site uses. The park
// is not a page with a drawing in it - it IS a drawing: eighty-odd vector primitives, no images, no
// external URLs, no web fonts, every fill a literal colour. html2canvas would photograph the
// browser's rendering of that and hand back a soft bitmap of a crisp thing. Serialising the SVG and
// drawing it into a canvas at whatever scale is asked for keeps the lines as lines, and a park
// exported at three times size is genuinely three times the detail rather than three times the
// pixels.
//
// It also sidesteps the fault that bit the coached tools, where html2canvas dropped the text out of
// every input and textarea and produced an export with empty boxes in it. There is nothing to drop
// here: the park has no form fields.

/** The park, as standalone SVG markup.
 *
 *  Cloned, because everything done here is done to the copy: the drawing on the screen is live and
 *  the one being exported has to hold still. */
export function parkSvg(svg: SVGSVGElement, size: { w: number; h: number }): string {
  const copy = svg.cloneNode(true) as SVGSVGElement;

  // The animals pace and the visitors walk, in SMIL. A still of a moving thing has to decide where
  // the moving things are, and the honest answer is where they were put: taking the animation out
  // leaves each one on its own mark rather than frozen mid-stride with one foot through a fence.
  copy.querySelectorAll('animate, animateMotion, animateTransform, set').forEach((a) => a.remove());

  // Nothing in the park needs the page's stylesheet, but it does need to say what kind of document
  // it is, and it needs a size: a viewBox alone tells a rasteriser the shape and not the scale.
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copy.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  copy.setAttribute('width', String(size.w));
  copy.setAttribute('height', String(size.h));

  return new XMLSerializer().serializeToString(copy);
}

/** ...rasterised, at whatever size is worth having.
 *
 *  On a white ground by default. The park is drawn on transparency outside the land, and a zoo
 *  pasted into a deck as a transparent PNG picks up whatever is behind it - which on a dark slide
 *  is a zoo with black grass. */
export async function parkPng(markup: string, size: { w: number; h: number },
  opts: { scale?: number; background?: string } = {}): Promise<string> {
  const scale = opts.scale ?? 2;
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = await new Promise<HTMLImageElement>((ok, fail) => {
      const el = new Image();
      el.onload = () => ok(el);
      el.onerror = () => fail(new Error('the drawing could not be read back'));
      el.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(size.w * scale);
    canvas.height = Math.round(size.h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas to draw on');
    ctx.fillStyle = opts.background ?? '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** ...and as a PDF, one page, the shape of the picture.
 *
 *  A park is wider than it is tall, so the page turns to suit rather than leaving a letterboxed
 *  drawing in the middle of a portrait sheet. The line along the top is what makes it a handout
 *  rather than an image in a wrapper: which zoo this is, and when it was. */
export async function parkPdf(png: string, size: { w: number; h: number },
  caption?: string): Promise<Blob> {
  const { default: JsPDF } = await import('jspdf');
  const landscape = size.w >= size.h;
  const doc = new JsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });

  const page = { w: doc.internal.pageSize.getWidth(), h: doc.internal.pageSize.getHeight() };
  const margin = 12;
  const top = caption ? margin + 8 : margin;
  const room = { w: page.w - margin * 2, h: page.h - top - margin };
  // Fitted, never stretched: the park's own proportions are the one thing about this picture that
  // is not a matter of taste.
  const fit = Math.min(room.w / size.w, room.h / size.h);
  const w = size.w * fit;
  const h = size.h * fit;

  if (caption) {
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(caption, margin, margin + 2, { maxWidth: room.w });
  }
  doc.addImage(png, 'PNG', margin + (room.w - w) / 2, top + (room.h - h) / 2, w, h);
  return doc.output('blob');
}

/** What the file is called. A trainer taking one of these at every Review ends up with a folder,
 *  and a folder of `zoo-export (3).png` is a folder nobody can read. */
export function parkFilename(state: { sprintNumber?: number; dayNumber?: number; phase?: string }): string {
  const bits = ['zoo'];
  if (state.sprintNumber) bits.push(`sprint-${state.sprintNumber}`);
  if (state.dayNumber && state.phase === 'sprint') bits.push(`day-${state.dayNumber}`);
  else if (state.phase && state.phase !== 'sprint') bits.push(state.phase);
  return bits.join('-');
}

/** Hand it over. A blob URL rather than a data URL for the PDF: a megabyte of base64 in an href is
 *  a string long enough to upset a browser, and this one has a whole park in it. */
export function handOver(data: string | Blob, filename: string) {
  const url = typeof data === 'string' ? data : URL.createObjectURL(data);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (typeof data !== 'string') setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The line along the top of an exported PDF: which zoo this is, and when it was.
 *
 *  It is what makes the file a handout rather than an image in a wrapper. A trainer takes one of
 *  these at every Review, and three months later "zoo.pdf" says nothing while "Sprint 2, day 3"
 *  beside the Product Goal says all of it.
 *
 *  Here rather than in ParkView, where it started: a function exported from a .tsx file stops fast
 *  refresh working for the whole module, and the lint gate counts that. */
export function exportCaption(state: {
  phase?: string; sprintNumber?: number | null; dayNumber?: number; productGoal?: string;
}): string {
  const when = state.phase === 'sprint' && state.sprintNumber
    ? `Sprint ${state.sprintNumber}, day ${state.dayNumber}`
    : state.sprintNumber ? `Sprint ${state.sprintNumber}, ${state.phase}` : 'Before the first Sprint';
  const goal = (state.productGoal ?? '').trim();
  return goal ? `${when} - ${goal}` : when;
}
