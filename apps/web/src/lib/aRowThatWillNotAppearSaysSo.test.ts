import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { REGISTRIES } from '@/lib/copy';

// Reported from the live site: a philosophy card was added and never appeared.
//
// items(text, ['heading']) drops any row without a heading. That is right - a row typed by a
// person is a row mid-typing, and half a card on a page is worse than no card - and it happened
// in silence. The row saved, the editor showed it, the page ignored it.
//
// The editor says so now, which only helps while the two agree about which boxes are needed. The
// page states its requirement at the call site and the registry states it in the field; this
// keeps them the same.

const PAGES = ['src/app/page.tsx', 'src/app/about/page.tsx', 'src/app/coaching/page.tsx'];

/** Every items(t('key'), ['a','b']) the pages actually make. */
function requiredInCode(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const file of PAGES) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/items<[^>]*>\(\s*t\('([^']+)'\)\s*,\s*\[([^\]]*)\]/g)) {
      out.set(m[1], [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]));
    }
    // A call with no list requires nothing.
    for (const m of src.matchAll(/items<[^>]*>\(\s*t\('([^']+)'\)\s*\)/g)) out.set(m[1], []);
  }
  return out;
}

describe('a row that will not appear says so', () => {
  const inCode = requiredInCode();
  const entries = REGISTRIES.flatMap((r) => Object.entries(r.entries)).filter(([, e]) => e.type === 'items');

  it('finds the item lists the pages render', () => {
    expect(inCode.size).toBeGreaterThan(0);
  });

  it('marks in the registry exactly what the page insists on', () => {
    const wrong: string[] = [];
    for (const [key, entry] of entries) {
      const needed = inCode.get(key);
      if (needed === undefined) continue; // rendered elsewhere, or not yet rendered
      const marked = (entry.fields ?? []).filter((f) => f.required).map((f) => f.key).sort();
      if (JSON.stringify(marked) !== JSON.stringify([...needed].sort())) {
        wrong.push(`${key}: page needs [${needed}], registry marks [${marked}]`);
      }
    }
    expect(wrong, 'the editor and the page disagree about which boxes are needed').toEqual([]);
  });

  it('never marks a box the item does not have', () => {
    const stray = entries.flatMap(([key, e]) =>
      (e.fields ?? []).filter((f) => f.required && !e.fields?.some((g) => g.key === f.key)).map((f) => `${key}.${f.key}`),
    );
    expect(stray).toEqual([]);
  });

  it('warns rather than silently dropping', () => {
    const control = readFileSync('../../packages/ui/src/editor/ItemRows.tsx', 'utf8');
    expect(control).toMatch(/will not appear on the page until/);
    expect(control).toMatch(/f\.required/);
  });
});
