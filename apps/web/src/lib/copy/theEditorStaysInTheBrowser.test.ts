import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// The editor's controls are client components. Importing a value from lib/copy's index pulls in
// the Supabase server client, which imports next/headers, and the whole app answers 500 with
// "You're importing a component that needs next/headers".
//
// It costs nothing to get wrong: the types compile, the tests pass, and only a running page says
// so. That happened, which is why this is here.

const EDIT_DIR = 'src/components/edit';

describe('the editor stays in the browser', () => {
  const clientFiles = readdirSync(EDIT_DIR)
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => [f, readFileSync(join(EDIT_DIR, f), 'utf8')] as const);

  it('has files to check', () => {
    expect(clientFiles.length).toBeGreaterThan(0);
  });

  it("never imports a value from lib/copy's index", () => {
    // `import type` is erased and therefore harmless; a value import is not.
    const offenders = clientFiles
      .filter(([, src]) => /^import\s+(?!type\b)[^;]*from\s+'@\/lib\/copy'/m.test(src))
      .map(([name]) => name);
    expect(offenders, 'import from @/lib/copy/fields instead').toEqual([]);
  });

  it('never reaches the server client or next/headers directly', () => {
    const offenders = clientFiles
      .filter(([, src]) =>
        src.split('\n').some((l) => /^\s*import\b/.test(l) && /@\/lib\/supabase\/server|next\/headers/.test(l)),
      )
      .map(([name]) => name);
    expect(offenders).toEqual([]);
  });

  it('keeps the pure half pure', () => {
    // Import lines only. The comment at the top of that file names both of these, because
    // explaining why the split exists is the whole point of it.
    const importLines = readFileSync('src/lib/copy/fields.ts', 'utf8')
      .split('\n')
      .filter((l) => /^\s*import\b/.test(l));
    expect(importLines.filter((l) => /next\/headers|@\/lib\/supabase/.test(l))).toEqual([]);
  });
});
