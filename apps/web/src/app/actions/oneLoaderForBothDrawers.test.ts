import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Both apps mount the same editor, and each had its own loader for it. They were the same
// implementation, written twice, so the Site's copy quietly fell four properties behind:
//
//   options    a choice drew an empty list          (reported: "the drop down is empty")
//   says       a switch could not say its own words
//   group      a heading had nothing to group by, so This Site stayed one flat column
//   notShown   a section that is not on the page said nothing
//
// All four shipped, passed their tests against the App's loader, and did nothing on the Site,
// which is the one actually used to edit. The fix is not to copy four more properties across.

const source = readFileSync('src/app/actions/copy.ts', 'utf8');

describe('one loader for both drawers', () => {
  it('does not define a second shape for a field', () => {
    // A re-export is fine. A declaration is the thing that drifted.
    expect(source, 'CopyField is declared here again').not.toMatch(/export type CopyField = \{/);
    expect(source).toMatch(/export type \{ CopyField \}/);
  });

  it('asks the editor for a page rather than assembling one itself', () => {
    expect(source).toMatch(/return loadPage\(await createClient\(\), REGISTRIES, page\)/);
  });

  it('keeps the two things that really are this app’s', () => {
    // Only an administrator may ask, and the answer comes from the server because these pages
    // are server-rendered and cached.
    expect(source).toMatch(/if \(!\(await isAdmin\(\)\)\) return \[\];/);
    expect(source).toContain("'@/lib/supabase/server'");
  });

  it('no longer reads a registry entry into a field by hand', () => {
    // The projection that fell behind: label, hint, value, shipped, then a list of optional
    // properties that had to be remembered in two places.
    expect(source).not.toMatch(/shipped: e\.value/);
  });
});
