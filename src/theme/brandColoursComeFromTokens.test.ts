import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

// The palette is written down once, in @altogether/ui/tokens.
//
// It was already the stated architecture - `src/theme/colors.ts` re-exports the package, and the
// Next Site spreads it as CSS variables - and 41 files hardcoded the hex anyway. A rebrand was a
// find-and-replace rather than a config change, which is the opposite of what a token system is
// for, and the kind of thing nobody notices until they try to sell the thing.
//
// Both apps are clean now. The Site went first; the App followed, 25 files of it - inline styles,
// module constants named TEAL and ORANGE, a stylesheet, and a handful of data defaults.
//
// The list of exceptions is empty and meant to stay that way. Anything that needs a brand colour
// imports it from '@/theme/colors' (App) or '@/lib/brand' (Site), or uses var(--aa-*) where the
// value has to live in CSS.

const BRAND = ['#004D4D', '#007A7A', '#FF9715', '#F0FAFA', '#D9F2F2', '#B2DFDF'];

/** Where the palette is allowed to be written as hex, because this is where it is defined. */
const SOURCE_OF_TRUTH = ['packages/ui/src/tokens.ts'];

/** Still to convert. Empty, and it stays empty: everything the App draws now takes its colour
 *  from the token package, either as an import or through the --aa-* variables the app root
 *  provides. A new entry here means somebody reintroduced a literal. */
const NOT_YET: string[] = [];

/** Files carrying a brand colour as a literal hex value.
 *
 *  Tests are excluded: this one names all six in order to look for them, and a test asserting
 *  something about a colour has to be able to write it down. */
function offenders(): string[] {
  const pattern = BRAND.join('\\|');
  const out = execSync(
    `grep -rl "${pattern}" src apps/web/src packages/ui/src --include=*.ts --include=*.tsx --include=*.css 2>/dev/null || true`,
    { encoding: 'utf8' },
  );
  return out.split('\n').filter(Boolean).filter((f) => !/\.test\.[jt]sx?$/.test(f)).sort();
}

describe('the brand palette', () => {
  it('is hardcoded only where it is defined, or where it is still being converted', () => {
    const allowed = new Set([...SOURCE_OF_TRUTH, ...NOT_YET]);
    const strays = offenders().filter((f) => !allowed.has(f));
    expect(strays, `hardcoded brand colours: ${strays.join(', ')}. Import from '@/theme/colors' (App) or '@/lib/brand' (Site), or use var(--aa-*)`).toEqual([]);
  });

  it('has no stale entries on the list of files still to convert', () => {
    const current = new Set(offenders());
    const done = NOT_YET.filter((f) => !current.has(f));
    expect(done, `already converted, remove from NOT_YET: ${done.join(', ')}`).toEqual([]);
  });

  it('is entirely absent from both apps', () => {
    const strays = offenders().filter((f) => !SOURCE_OF_TRUTH.includes(f));
    expect(strays, `hardcoded brand colours: ${strays.join(', ')}`).toEqual([]);
  });
});
