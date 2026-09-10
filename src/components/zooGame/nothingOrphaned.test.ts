import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';

// Controls the game has, and cannot reach.
//
// Three features turned out this fortnight to exist and be unreachable - saying no to work, taking
// a run of path back up, and reordering the Sprint Backlog. Each one was wired at both ends and
// broken in the middle: a screen declared the callback, the page handed it over, and the screen
// never passed it on to anything that renders. Nothing failed. The control simply was not there,
// and the code read as though it were - which is why I looked in the wrong place twice.
//
// So the shape of that fault is a test. It cannot know whether a control is REACHABLE - that needs
// a person - but it can say when a component is handed something it never reads, which is what all
// three had in common.

const dir = 'src/components/zooGame';
const files = readdirSync(dir).filter((f) => /\.tsx$/.test(f) && !/\.test\./.test(f));

/** Props a component declares in its own type and never mentions again. */
function droppedProps(text: string): string[] {
  const out: string[] = [];
  // Declarations, not object-literal entries: a type line ends in a semicolon, a key ends in a
  // comma. And EditApi is a contract between two other files, so it is read where it is used.
  const body = text.replace(/export interface EditApi \{[\s\S]*?\n\}/, '');
  for (const m of body.matchAll(/^\s*(on[A-Z]\w*)\??:\s*\([^)]*\)\s*=>[^,]*;\s*$/gm)) {
    const name = m[1];
    if (text.match(new RegExp(`\\b${name}\\b`, 'g'))!.length <= 1) out.push(name);
  }
  return out;
}

describe('every callback a screen is handed', () => {
  it('is read by the screen it is handed to', () => {
    const dropped = files.flatMap((f) => droppedProps(readFileSync(`${dir}/${f}`, 'utf8')).map((p) => `${f}: ${p}`));
    expect(dropped, 'a screen takes this and never passes it anywhere - the control it belongs to cannot be reached')
      .toEqual([]);
  });
});

describe('every action a player can send', () => {
  it('is sent by something', () => {
    const actions = readFileSync(`${dir}/zooActions.ts`, 'utf8');
    const keys = [...actions.matchAll(/^\s{4}(\w+):\s*\(/gm)].map((m) => m[1]);
    const screens = [
      ...readdirSync(dir).filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f) && f !== 'zooActions.ts')
        .map((f) => readFileSync(`${dir}/${f}`, 'utf8')),
      ...readdirSync('src/pages').filter((f) => /\.tsx$/.test(f))
        .map((f) => readFileSync(`src/pages/${f}`, 'utf8')),
    ];
    const unsent = keys.filter((k) => !screens.some((t) => new RegExp(`\\b${k}\\b`).test(t)));
    // One is known and named rather than quietly allowed: `addCopy`/`setCopyPiece` put another
    // plant beside a planting item, which the options strip does not offer yet. It is a decision to
    // take, not dead code to delete, so it is listed here where the next person will see it rather
    // than left to be rediscovered. (`reorderSprint` was on this list until the board grew the
    // control it had been declaring for months.)
    expect(unsent.filter((k) => !['addCopy', 'setCopyPiece'].includes(k)),
      'the game offers this action and no screen ever sends it').toEqual([]);
  });
});
