import { drawBoard } from '@/lib/scrumBoard/boardDrawing.generated.js';
import type { BoardContent } from '@/lib/scrumBoard/content';

// The board, server-rendered.
//
// The same drawing the game uses, from the same design file, through the same generated module -
// so the picture a learner meets in the course is the picture a stranger finds on the web.
//
// Two differences, both because this is a page rather than a screen. Its links are real URLs, so
// all 28 reference pages can be found and shared; and it does not move, because there is nothing
// here to open - pointing at a shape is what the game is for.

export function Board({ content, base }: { content: BoardContent; base: string }) {
  const { svg, height } = drawBoard({
    INPUTS: content.inputs, OUTPUTS: content.outputs, DESC: content.desc,
  });
  // The drawing writes `href="#id"` because the design file routes on the hash. Here each one is a
  // page of its own. Only the hashes the board issues, and only where they name a page we have.
  const ids = new Set(content.pages.map((p) => p.id));
  const linked = svg.replace(/href="#([a-z0-9-]+)"/g, (whole, id: string) =>
    (ids.has(id) ? `href="${base}/${id}"` : whole));

  return (
    <div className="scrum-board" style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 1200 ${height}`} role="img"
        aria-label="Scrum on one page: the Sprint, its events, artifacts and accountabilities"
        style={{ width: '100%', minWidth: '40rem', height: 'auto' }}
        dangerouslySetInnerHTML={{ __html: linked }} />
    </div>
  );
}
