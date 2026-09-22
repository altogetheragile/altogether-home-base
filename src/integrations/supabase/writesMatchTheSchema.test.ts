import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// The four taxonomy tables are not the same shape, and one form writes to all of them.
//
// It sent every field to whichever table was active, and each is missing at least one of them, so
// PostgREST rejected the whole write. Creating or editing ANY taxonomy item was failing:
//
//   decision_levels       no full_description
//   knowledge_categories  no full_description
//   activity_domains      no display_order
//   knowledge_tags        neither, nor colour or description
//
// Found by upgrading @supabase/supabase-js, whose stricter insert types refuse a property the
// table has no column for. The old pinned version accepted them and the failure happened at
// runtime, silently.
//
// The compiler guards the single-table writes now, and does it better than a string search could:
// an earlier version of this file banned `full_description` per file and failed on a write to
// activity_domains, which genuinely has that column. What the compiler cannot see is a dynamic
// table name, which is exactly what this form uses, so that is what is checked here.

const SRC = () => readFileSync('src/pages/admin/AdminTaxonomy.tsx', 'utf8');

describe('the taxonomy form', () => {
  it('names the columns of each table it writes to', () => {
    const src = SRC();
    expect(src, 'the per-table column map is gone').toContain('TAXONOMY_COLUMNS');
    for (const table of ['decision_levels', 'knowledge_categories', 'activity_domains', 'knowledge_tags']) {
      expect(src, `${table} has no column list`).toContain(`${table}:`);
    }
  });

  it('sends nothing that has not been through the filter', () => {
    const src = SRC();
    expect(src, 'a write passes the raw form data').not.toMatch(/\.(insert|update)\(\s*data\s*\)/);
    expect(src.match(/\.(insert|update)\(/g)?.length, 'expected one insert and one update').toBe(2);
    expect((src.match(/taxonomyRow\(/g) ?? []).length, 'a write skips taxonomyRow').toBeGreaterThanOrEqual(2);
  });
});
