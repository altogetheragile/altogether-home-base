import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { REGISTRIES } from './index';
import { MODULE_FOR_PATH, COPY_ROUTES } from './routes';

// Hiding a page is decided in one place and acted on in three: the gate that 404s it, the menu
// that drops it, and the banner that admits an admin is seeing something nobody else can. If
// those three disagree, the failure is the worst kind — a page you believe is hidden and is not.

describe('hidden is hidden from visitors', () => {
  it('gives every switchable page a switch in its own drawer', () => {
    const missing = Object.entries(MODULE_FOR_PATH)
      .map(([url, module]) => [url, COPY_ROUTES[url], module] as const)
      .filter(([, page]) => page)
      .filter(([, page]) => {
        const reg = REGISTRIES.find((r) => r.page === page);
        return !Object.values(reg?.entries ?? {}).some((e) => e.type === 'switch' && e.path?.startsWith('show_'));
      })
      .map(([url]) => url);
    expect(missing, 'these pages can be hidden but not from the page itself').toEqual([]);
  });

  it('points each switch at the flag its own gate reads', () => {
    // A switch wired to the wrong flag hides a different page, and the one you were looking at
    // stays up.
    const wrong: string[] = [];
    for (const [url, module] of Object.entries(MODULE_FOR_PATH)) {
      const page = COPY_ROUTES[url];
      const reg = REGISTRIES.find((r) => r.page === page);
      const sw = Object.values(reg?.entries ?? {}).find((e) => e.type === 'switch' && e.path?.startsWith('show_'));
      if (sw && sw.path !== `show_${module}`) wrong.push(`${url}: ${sw.path} should be show_${module}`);
    }
    expect(wrong).toEqual([]);
  });

  it('only claims a page is hidden for a URL the gate actually guards', () => {
    const gate = readFileSync('src/lib/module-gate.ts', 'utf8');
    const gated = new Set([...gate.matchAll(/'([a-z]+)'/g)].map((m) => m[1]));
    const unguarded = [...new Set(Object.values(MODULE_FOR_PATH))].filter((m) => !gated.has(m));
    expect(unguarded, 'the banner would claim a page is hidden that nobody 404s').toEqual([]);
  });

  it('lets an admin through rather than 404ing them', () => {
    const gate = readFileSync('src/lib/module-gate.ts', 'utf8');
    expect(gate).toMatch(/isAdmin\(\)/);
    // The order matters: shown first, then admin, then notFound. An isAdmin() call before the
    // cheap check would hit auth on every page render of every page that is switched on.
    const shown = gate.indexOf('moduleIsShown(module, s)');
    const admin = gate.indexOf('await isAdmin()');
    const gone = gate.indexOf('notFound()');
    expect(shown).toBeLessThan(admin);
    expect(admin).toBeLessThan(gone);
  });

  it('never lets the home page be switched off', () => {
    // A site with no front door is not a state worth being able to reach by accident.
    expect(MODULE_FOR_PATH['/']).toBeUndefined();
  });
});
