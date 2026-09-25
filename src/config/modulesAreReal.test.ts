import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { MODULES, NAV_FLAGS, flagOf } from './modules';

// A switch that does nothing is worse than no switch, because it is believed.
//
// Before this, four flags - show_protected_projects, show_dynamic_pages, show_recommendations and
// show_admin_routes - existed in the settings type and on the admin page and were referenced
// nowhere else. You could turn Projects off and nothing happened. Meanwhile 28 public routes had
// no flag in front of them at all, so /zoo-game rendered for anyone who typed it however the
// setting was left.
//
// These tests hold the three pieces together: the module list, the routes, and the settings type.

const routes = () => readFileSync('src/config/routes.tsx', 'utf8');
const settings = () => readFileSync('src/hooks/useSiteSettings.ts', 'utf8');
const dbTypes = () => readFileSync('src/integrations/supabase/types.ts', 'utf8');

/** The site_settings columns, as the generated Supabase types have them. */
function settingsColumns(): Set<string> {
  const src = dbTypes();
  const start = src.indexOf('      site_settings: {');
  const block = src.slice(start, src.indexOf('Relationships: []', start));
  return new Set([...block.matchAll(/(show_[a-z_]+)\??:/g)].map((m) => m[1]));
}

/** Every path in the router, with the feature guarding it, if any.
 *
 *  Scanned by splitting on `<Route path=`, not by matching a fixed indentation: the router nests,
 *  and a regex pinned to four spaces silently saw 34 of the 105 routes and called the rest gated.
 */
function routeGates(): { path: string; feature: string | null }[] {
  const parts = routes().split(/(<Route path="[^"]+")/);
  const out: { path: string; feature: string | null }[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const path = parts[i].match(/<Route path="([^"]+)"/)![1];
    const seg = parts[i + 1] ?? '';
    const g = seg.match(/SiteSettingsRouteGuard feature="([a-z_]+)"/);
    out.push({ path, feature: g ? g[1] : null });
  }
  return out;
}

/** Routes inside /admin are declared relative (no leading slash) and already sit behind
 *  ProtectedRoute requiredRole="admin", so they are not the subject here. */
const isPublic = (path: string) => path.startsWith('/') && !path.startsWith('/admin');

// Auth, the legal pages and the account page. A site with no way to sign in or read its own terms
// is not a configuration anyone wants, and the admin area must never be switchable from inside it.
const ALWAYS_ON = ['/auth', '/auth/reset', '/terms', '/cookies', '/privacy', '/account/security'];

/** Redirects to somewhere that IS gated, so putting a second gate in front of them would only
 *  change which 404 you get. `/` is the home page and a site without one is not a configuration. */
const LEGACY_REDIRECTS = ['/knowledge', '/knowledge/:slug'];

describe('every module', () => {
  it('has its flag declared on the settings type', () => {
    const src = settings();
    const missing = MODULES.filter((m) => !src.includes(`${flagOf(m)}:`)).map(flagOf);
    expect(missing, `not on SiteSettings: ${missing.join(', ')}`).toEqual([]);
  });

  // The zoo switch existed in the type, in the nav defaults and on the settings page for weeks
  // while site_settings had no column for it, so turning it on saved into nothing. A module whose
  // flag has nowhere to live is not a module yet.
  it('has a column on site_settings to be saved in', () => {
    const cols = settingsColumns();
    const missing = MODULES.filter((m) => !cols.has(flagOf(m))).map(flagOf);
    expect(missing, `no site_settings column: ${missing.join(', ')}`).toEqual([]);
  });

  // Either router will do. The App owns /flow-game and /projects; the Site owns /about and /blog;
  // and since the App stopped declaring routes the Site answers, six modules are gated only on the
  // Site side. A module switching nothing anywhere is still a lie in a form.
  it('guards at least one route, on whichever side owns it', () => {
    const guarded = new Set([...routeGates().map((r) => r.feature), ...siteGated()]);
    const unused = MODULES.filter((m) => !guarded.has(m.feature)).map((m) => m.feature);
    expect(unused, `switches nothing on either side: ${unused.join(', ')}`).toEqual([]);
  });
});

describe('every public route', () => {
  it('is either behind a module or deliberately always on', () => {
    const loose = routeGates()
      .filter((r) => !r.feature && isPublic(r.path))
      .map((r) => r.path)
      .filter((p) => !ALWAYS_ON.includes(p) && !LEGACY_REDIRECTS.includes(p) && p !== '/');
    expect(loose, `no flag in front of: ${loose.join(', ')}`).toEqual([]);
  });

  it('names a feature the module list knows', () => {
    const known = new Set(MODULES.map((m) => m.feature));
    const strays = routeGates().map((r) => r.feature)
      .filter((f): f is string => !!f && !known.has(f as never));
    expect([...new Set(strays)], `guarded by unknown features: ${strays.join(', ')}`).toEqual([]);
  });

  it('keeps the way in and the way back unswitchable', () => {
    const gates = new Map(routeGates().map((r) => [r.path, r.feature]));
    for (const path of ALWAYS_ON) {
      if (!gates.has(path)) continue;
      expect(gates.get(path), `${path} must not be behind a flag`).toBeNull();
    }
  });
});

describe('every menu flag', () => {
  // show_recommendations sat in the settings type and on the admin page and was read nowhere, so
  // the panel it claimed to control appeared regardless. A switch nobody reads is a lie told in a
  // form. This greps the source rather than the router, because these flags gate components.
  it('is read by something outside the settings page', () => {
    for (const f of NAV_FLAGS) {
      const hits = execSync(
        `grep -rl "${f.flag}" src --include=*.tsx --include=*.ts || true`,
        { encoding: 'utf8' },
      )
        .split('\n')
        .filter((p) => p && !p.includes('config/modules') && !p.includes('admin/AdminSettings')
          && !p.includes('useSiteSettings') && !p.includes('.test.'));
      expect(hits.length, `${f.flag} is declared but read nowhere`).toBeGreaterThan(0);
    }
  });
});

// ============= The two routers must agree =============
//
// The Site answers /about, /coaching, /events, /blog, /exams and /training; the App answers the
// rest. Both gate on the same site_settings columns, and neither can import the other's source, so
// the Site repeats the defaults in apps/web/src/lib/module-gate.ts.
//
// #720 gated 32 App routes, declared "off means unreachable", and left every Site page open,
// because the test only ever read one router. This is the half that was missing.

const gateSource = () => readFileSync('apps/web/src/lib/module-gate.ts', 'utf8');

/** The modules the Site gates a page on, found by grepping its pages for requireModule(). */
function siteGated(): Set<string> {
  const out = execSync(
    `grep -rho "requireModule('[a-z_]*'" apps/web/src/app || true`, { encoding: 'utf8' },
  );
  return new Set([...out.matchAll(/requireModule\('([a-z_]+)'/g)].map((m) => m[1]));
}

/** The Site's copy of the defaults. */
function siteDefaults(): Record<string, boolean> {
  const src = gateSource();
  const block = src.slice(src.indexOf('const DEFAULTS'), src.indexOf('};', src.indexOf('const DEFAULTS')));
  return Object.fromEntries(
    [...block.matchAll(/(\w+):\s*(true|false)/g)].map((m) => [m[1], m[2] === 'true']),
  );
}

describe('the modules the Site gates', () => {
  it('are modules the App has heard of', () => {
    const known = new Set(MODULES.map((m) => m.feature));
    const strays = Object.keys(siteDefaults()).filter((f) => !known.has(f as never));
    expect(strays, `gated on the Site, unknown to the module list: ${strays.join(', ')}`).toEqual([]);
  });

  it('default the same way on both sides', () => {
    const site = siteDefaults();
    const drift = MODULES
      .filter((m) => m.feature in site && site[m.feature] !== m.defaultOn)
      .map((m) => `${m.feature}: App ${m.defaultOn}, Site ${site[m.feature]}`);
    expect(drift, `the two routers disagree about what off means: ${drift.join('; ')}`).toEqual([]);
  });
});
