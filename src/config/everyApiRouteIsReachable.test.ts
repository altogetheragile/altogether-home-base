import { describe, it, expect } from 'vitest';
import { readdirSync, existsSync } from 'node:fs';
import routing from '../../config/vercel/routing.json';

// The Site has API routes. The App answers every URL this repository does not explicitly hand
// over, so a route with no rewrite is served by the App instead, which does not have it, and the
// visitor gets the App's own 404 with a 200 beside it.
//
// /api/preview was written, tested, deployed and unreachable on both live sites. Previewing a
// draft went to "Page not found" and a plain curl said 200, because the App's catch-all is a
// perfectly successful way of serving the wrong thing.

const API_DIR = 'apps/web/src/app/api';
const rewritten = new Set(routing.rewrites.map((r) => r.source));

describe('every API route the Site has is reachable', () => {
  const routes = existsSync(API_DIR)
    ? readdirSync(API_DIR, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
    : [];

  it('finds the routes at all, or this test is watching an empty room', () => {
    expect(routes.length).toBeGreaterThan(0);
  });

  for (const route of routes) {
    it(`/api/${route} is handed to the Site rather than answered by the App`, () => {
      expect(rewritten, `/api/${route} has no rewrite, so the App answers it`).toContain(`/api/${route}`);
    });
  }

  it('sends each of them to the Site, not somewhere else', () => {
    for (const route of routes) {
      const rule = routing.rewrites.find((r) => r.source === `/api/${route}`);
      expect(rule?.destination, `/api/${route} points somewhere unexpected`).toContain(`/api/${route}`);
    }
  });
});
