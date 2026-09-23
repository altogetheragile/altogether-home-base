import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { colors, colorValues, brandCssVars } from './brand';

// A site that can be stood up for someone else has to be able to change colour without a rebuild.
// That means no component may contain a brand colour: it refers to one, and the value is supplied
// once, at the root, from wherever the brand happens to live.
//
// This was true of four files and false of ten when it was written.

const SRC = resolve(__dirname, '..');
const BRAND_HEX = Object.values(colorValues).map((v) => v.toUpperCase());

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) { walk(full, out); continue; }
    if (/\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

describe('the palette is a reference, not a value', () => {
  it('hands out custom properties rather than hex', () => {
    expect(colors.deepTeal).toBe('var(--aa-deep-teal)');
    expect(colors.orangeHover).toBe('var(--aa-orange-hover)');
  });

  it('still knows the literal values, for the places that need one', () => {
    expect(colorValues.deepTeal).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('defines every property it hands out, and defines it from a literal', () => {
    for (const token of Object.keys(colorValues)) {
      const ref = colors[token as keyof typeof colors];
      const name = ref.slice('var('.length, -1);
      expect(brandCssVars[name as `--aa-${string}`], `${token} is referenced but never defined`)
        .toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});

describe('no component hard-codes a brand colour', () => {
  const files = walk(SRC).filter((f) => !f.endsWith('lib/brand.ts'));

  it('has files to check, so a broken walk cannot pass silently', () => {
    expect(files.length).toBeGreaterThan(30);
  });

  it('finds none', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8').toUpperCase();
      for (const hex of BRAND_HEX) {
        if (src.includes(hex)) offenders.push(`${file.replace(SRC + '/', '')} -> ${hex}`);
      }
    }
    expect(offenders, `use the palette from @/lib/brand instead:\n  ${offenders.join('\n  ')}`).toEqual([]);
  });
});

describe('the Site does not keep its own copy of a shared component', () => {
  it('defines nothing @altogether/ui already exports', () => {
    const shared = resolve(__dirname, '../../../../packages/ui/src/components/ui');
    const exported = readdirSync(shared)
      .filter((f) => f.endsWith('.tsx') && !f.includes('.stories.'))
      .map((f) => f.replace('.tsx', ''));
    expect(exported.length, 'the shared package appears to be empty').toBeGreaterThan(5);

    const local: string[] = [];
    try {
      for (const f of readdirSync(join(SRC, 'components/ui'))) {
        const name = f.replace(/\.tsx$/, '');
        const body = readFileSync(join(SRC, 'components/ui', f), 'utf8');
        // A one-line re-export is the boundary marker Next needs; a real implementation is a copy.
        if (exported.includes(name) && !body.includes('@altogether/ui')) local.push(name);
      }
    } catch { /* no components/ui directory at all, which is the cleanest state */ }

    expect(local, `these duplicate @altogether/ui: ${local.join(', ')}`).toEqual([]);
  });
});
