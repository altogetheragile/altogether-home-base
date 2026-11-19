import { useState } from 'react';

/** The pen, for laying a path, and the work it is out for.
 *
 *  It is put away when the work in hand changes, however it changed. Only choosing on the park
 *  used to do that, so a card started from the board or its dialog took over a pen still out for
 *  the last one: the fourteenth scrum-master playtest drew a path for the Lion Enclosure, moved on
 *  to the Lion, and spent its last twelve steps under a pen an animal has no use for, with the
 *  acceptance criteria shut beneath it.
 *
 *  Adjusted during render rather than in an effect, so the frame with the stale pen never draws. */
export function usePen(inHandId: string | null): [boolean, (on: boolean) => void] {
  const [drawing, setDrawing] = useState(false);
  const [penFor, setPenFor] = useState<string | null>(inHandId);
  if (penFor !== inHandId) {
    setPenFor(inHandId);
    if (drawing) setDrawing(false);
  }
  return [drawing, setDrawing];
}
