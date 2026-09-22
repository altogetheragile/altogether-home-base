import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { isSiteOwned } from './siteOwnedRoutes';

// One owner per URL, enforced in the direction the list cannot enforce on its own.
//
// siteOwnedRoutes.test.ts checks the list against vercel.json. It cannot see a component that
// reaches a Site URL with React Router, which renders the App's own idea of that page without ever
// asking the server. That is how this site came to have two home pages, and the fix was 4,933
// lines (#724). A `<Link to="/exams/...">` would start it again, one link at a time.
//
// AppLink and useAppNavigate exist for this: they leave the App, the server answers, and there is
// one implementation of every public URL.

const SOURCES = ['src'];
const SKIP = new Set(['AppLink.tsx', 'useAppNavigate.ts', 'siteOwnedRoutes.ts']);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) { walk(full, out); continue; }
    if (!/\.tsx?$/.test(name) || /\.test\.tsx?$/.test(name) || SKIP.has(name)) continue;
    out.push(full);
  }
  return out;
}

/** The literal path on a `<Link>` or `<Navigate>` element. Deliberately NOT `<AppLink>`, which is
 *  the fix, and deliberately not `navigate()`, which navigationRespectsTheBoundary.test.ts already
 *  covers. `[^>]*` spans newlines, so a tag broken over several lines is still seen. */
function routerTargets(src: string): string[] {
  return [...src.matchAll(/<(?:Link|Navigate)\s[^>]*?\bto=["'](\/[A-Za-z0-9/_-]*)["']/g)].map((m) => m[1]);
}

describe('the App never routes to a URL the Site owns', () => {
  const files = SOURCES.flatMap((d) => walk(d));

  it('has files to check, so a broken walk cannot pass silently', () => {
    expect(files.length).toBeGreaterThan(200);
  });

  it('uses no React Router link or navigate for a Site-owned path', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      // A file that imports neither is not doing router navigation at all.
      if (!/from 'react-router-dom'/.test(src)) continue;
      for (const target of routerTargets(src)) {
        if (isSiteOwned(target)) offenders.push(`${file} -> ${target}`);
      }
    }
    expect(offenders, `use AppLink / useAppNavigate instead:\n  ${offenders.join('\n  ')}`).toEqual([]);
  });
});
