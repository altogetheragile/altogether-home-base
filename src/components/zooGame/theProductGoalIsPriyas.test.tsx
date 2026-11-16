import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Blue is the move waiting on you (rule 11). The Product Goal panel and the Toolbox button were both
// drawn in it on the Product Backlog during the Sprint, so two things that wait on nobody looked
// like moves. "Orange" for the Product Goal: it is the Product Owner's.

const src = (f: string) => readFileSync(`src/components/zooGame/${f}`, 'utf8');

describe('the Product Goal panel', () => {
  it('is in the Product Owner’s orange, not the move’s blue', () => {
    const panel = src('BacklogBench.tsx').split('commitment of the Product Backlog, on the Product Backlog')[1].slice(0, 900);
    expect(panel, 'the panel is not in her orange').toMatch(/--zoo-po/);
    expect(panel, 'the panel is still in the move colour').not.toMatch(/\b(border|bg|text)-primary\b/);
  });
});

describe('the Toolbox during the Sprint', () => {
  it('is an outline beside New PBI, not a move', () => {
    const line = src('SprintBoard.tsx').split('\n').find((l) => l.includes('setShowToolbox(true)') && l.includes('<Button'))!;
    expect(line).toMatch(/variant="outline"/);
    expect(src('Board.tsx')).toMatch(/variant=\{laterFolds \|\| mode === 'sprint' \? 'outline' : 'default'\}/);
  });
});
