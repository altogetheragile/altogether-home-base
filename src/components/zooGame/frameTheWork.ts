/** Where a scrolling box should be scrolled to, to put something in the middle of it.
 *
 *  Zooming the Increment is supposed to take you closer to the ZOO. It took you closer to whatever
 *  happened to be in the middle of the viewport, which on a park that is mostly grass is grass:
 *  "the zoom does not zoom in to the current work". And it wrote the new scroll position before the
 *  drawing had grown, so the browser clamped it to the old extent and the view slid part of the way
 *  and back - "when I click zoom it zooms in and out again partially each time".
 *
 *  Pure arithmetic, so it can be checked without a browser: rectangles in, scroll offsets out.
 */

export interface Rect { left: number; top: number; right: number; bottom: number }

/** The smallest rectangle holding all of them, ignoring anything with no size. */
export function union(rects: Rect[]): Rect | null {
  const real = rects.filter((r) => r.right > r.left && r.bottom > r.top);
  if (!real.length) return null;
  return {
    left: Math.min(...real.map((r) => r.left)),
    top: Math.min(...real.map((r) => r.top)),
    right: Math.max(...real.map((r) => r.right)),
    bottom: Math.max(...real.map((r) => r.bottom)),
  };
}

/** Scroll offsets that centre `target` in a box, clamped to what there is to scroll.
 *
 *  Everything is in client coordinates except the scroll, which is why the box's own position and
 *  current scroll both come in: a rectangle measured on screen says nothing about where it sits in
 *  the content until you add back what is already scrolled past. */
export function centreOn(
  target: Rect,
  box: { rect: Rect; scrollLeft: number; scrollTop: number; clientWidth: number; clientHeight: number;
    scrollWidth: number; scrollHeight: number },
): { left: number; top: number } {
  const cx = (target.left + target.right) / 2 - box.rect.left + box.scrollLeft;
  const cy = (target.top + target.bottom) / 2 - box.rect.top + box.scrollTop;
  const max = (span: number, view: number) => Math.max(0, span - view);
  return {
    left: Math.min(max(box.scrollWidth, box.clientWidth), Math.max(0, cx - box.clientWidth / 2)),
    top: Math.min(max(box.scrollHeight, box.clientHeight), Math.max(0, cy - box.clientHeight / 2)),
  };
}
