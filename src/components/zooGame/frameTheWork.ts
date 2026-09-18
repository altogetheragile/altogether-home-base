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

/** Which of the drawn things count as "the work".
 *
 *  Everything on the park is drawn with its item's id on it, so the union of all of them is the
 *  union of the whole zoo - and on a park with a Sprint or two behind it, that is the park. Centring
 *  the park is not "zoom in to the current work"; it is what the zoom did before, arrived at by a
 *  longer route. So when the Developers have something in hand, the work is THAT, and everything
 *  else is scenery it happens to stand in.
 *
 *  Nothing in hand - the Increment between Sprints, a park being looked at rather than built on -
 *  and the whole zoo is the thing worth looking at, which is the honest answer to "closer to what?" */
export function theWork<T extends { getAttribute(name: string): string | null }>(
  drawn: T[], inHand?: string | null,
): T[] {
  if (!inHand) return drawn;
  const its = drawn.filter((el) => el.getAttribute('data-item') === inHand);
  // Held but not drawn yet - nothing has been placed on the park - and the zoo is what there is.
  return its.length ? its : drawn;
}

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
