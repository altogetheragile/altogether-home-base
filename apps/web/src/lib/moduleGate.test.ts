import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// vi.mock is hoisted above the file's consts, so the stub has to be hoisted with it. It records
// rather than throws: the real notFound() throws to stop rendering, and a throwing stub turns
// every assertion in the file into the same unhelpful error.
const { notFound } = vi.hoisted(() => ({ notFound: vi.fn() }));
vi.mock('next/navigation', () => ({ notFound }));
vi.mock('@/lib/site-settings', () => ({ getSiteSettings: async () => ({}) }));

const { requireModule } = await import('./module-gate');

// The Site answers /about, /coaching, /events, /blog, /exams and /courses. It did not check a
// single flag, so switching About off removed the menu entry and blocked a route nobody is served
// while altogetheragile.com/about carried on rendering. #720 claimed "off means unreachable" and
// that was only true of the App.

beforeEach(() => notFound.mockClear());

describe('a switched-off module', () => {
  it('404s the page', async () => {
    await requireModule('about', { show_about: false });
    expect(notFound, 'a switched-off page still rendered').toHaveBeenCalled();
  });

  it('renders when it is on', async () => {
    await requireModule('about', { show_about: true });
    expect(notFound, 'a switched-on page was 404d').not.toHaveBeenCalled();
  });

  it('falls back to the declared default when the column is null', async () => {
    // exams defaults off, about defaults on. A null must not mean "on" for everything.
    //
    // This used to use `events`, which defaulted off until the defaults were rewritten for a new
    // site: a freelancer's site has Events, and a practice exam bank is this practice's.
    await requireModule('exams', { show_exams: null });
    expect(notFound, 'exams defaults off and was allowed through').toHaveBeenCalled();

    notFound.mockClear();
    await requireModule('about', { show_about: null });
    expect(notFound, 'about defaults on and was 404d').not.toHaveBeenCalled();
  });
});

// Every page under app/ that owns a public route has to be gated or deliberately not. Missing one
// is exactly the fault this file exists for, and it is invisible until someone turns a flag off.
const APP = 'src/app';

/** Every page.tsx under app/, as a route path. */
function pages(dir = APP, route = ''): { route: string; file: string }[] {
  const out: { route: string; file: string }[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...pages(full, `${route}/${entry.name}`));
    else if (entry.name === 'page.tsx') out.push({ route: route || '/', file: full });
  }
  return out;
}

/** Routes with no module behind them, and why. */
const UNGATED = new Set([
  '/',        // the home page. A site without one is not a configuration anyone wants.
]);

describe('every page the Site serves', () => {
  it('is gated on a module, or listed as deliberately always on', () => {
    const loose = pages()
      .filter(({ route, file }) => !UNGATED.has(route) && !readFileSync(file, 'utf8').includes('requireModule('))
      .map(({ route }) => route);
    expect(loose, `no flag in front of: ${loose.join(', ')}`).toEqual([]);
  });

  it('finds pages at all, so a passing result means something', () => {
    expect(pages().length).toBeGreaterThan(5);
  });
});
