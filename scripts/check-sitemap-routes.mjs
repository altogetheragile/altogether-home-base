/**
 * Soft-404 guard (Phase 0, route/sitemap guard).
 *
 * Every URL in the sitemap has to resolve to a real route, and two apps answer
 * them. The routing config rewrites some paths to the Next Site and the App serves the
 * rest, so this checks each URL against whichever one owns it:
 *
 *   App-owned   - rendered in a headless browser against dist/, failing if the
 *                 Not Found page appears. A static route list cannot catch these
 *                 because a catch-all swallows the path; only the outcome is
 *                 reliable.
 *   Site-owned  - matched against the Next app's route files, failing if no
 *                 page.tsx could serve the path. This job builds only the App, so
 *                 rendering them is not available here. It still catches the
 *                 orphan class: a URL in the sitemap with no route behind it.
 *
 * Before the App stopped claiming the Site's URLs, all 40 were rendered here and
 * 36 of them passed by rendering a second implementation that nobody is served. This catches "orphan" URLs - a path that is
 * prerendered and/or in the sitemap but has no real route, so React falls
 * through to NotFound (the /courses class of bug). A static route-list check
 * cannot catch these because a catch-all ('*') or broad dynamic route ('/:slug')
 * silently swallows the path; only the rendered outcome is reliable.
 *
 * Usage:  node scripts/check-sitemap-routes.mjs   (run after a build)
 *         node scripts/check-sitemap-routes.mjs --extra /orphan-to-test
 *
 * Exit 0 = every sitemap URL renders real content. Exit 1 = at least one soft 404.
 */
import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { resolve, join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '..', 'dist');
const NOT_FOUND_MARKER = 'Page not found'; // the NotFound page's <h1>
const CONCURRENCY = 4;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.xml': 'application/xml', '.txt': 'text/plain',
};

if (!existsSync(DIST)) {
  console.error('No dist/ found. Run a build first (npm run build).');
  process.exit(1);
}

/** Serve dist/ the way Vercel does: prerendered dir index, real assets, else SPA fallback. */
function startServer() {
  const server = createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const candidates = [
      join(DIST, pathname),
      join(DIST, pathname, 'index.html'),
    ];
    let file = candidates.find((f) => existsSync(f) && statSync(f).isFile());
    // SPA fallback: the prerender renames the shell to _spa.html (so / is served by
    // the Next app via a rewrite); fall back to index.html if a build predates that.
    if (!file) file = existsSync(join(DIST, '_spa.html')) ? join(DIST, '_spa.html') : join(DIST, 'index.html');
    try {
      const body = readFileSync(file);
      res.setHeader('Content-Type', MIME[extname(file)] || 'application/octet-stream');
      res.end(body);
    } catch {
      res.statusCode = 500;
      res.end('error');
    }
  });
  return new Promise((res) => server.listen(0, () => res(server)));
}

function sitemapPaths() {
  const xml = readFileSync(resolve(DIST, 'sitemap.xml'), 'utf-8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  return locs.map((u) => new URL(u).pathname);
}

async function main() {
  const extra = process.argv.includes('--extra')
    ? process.argv[process.argv.indexOf('--extra') + 1]
    : null;
  const paths = sitemapPaths();
  if (extra) paths.push(extra); // for self-testing the guard catches an orphan

  // Who answers what. the routing config is the thing that actually decides, so it is the
  // thing that is read; src/config/siteOwnedRoutes.ts is checked against it by test.
  //
  // A source of "/blog" claims exactly /blog. A source of "/blog/:path*" claims
  // everything under it. Those are the only two shapes in use.
  const rewrites = (JSON.parse(readFileSync(resolve(__dirname, '..', 'config', 'vercel', 'routing.json'), 'utf8')).rewrites ?? [])
    .filter((r) => r.destination.includes('web-next'))
    .map((r) => r.source)
    .filter((src) => !src.startsWith('/_next') && !src.startsWith('/api'));

  const exact = new Set(rewrites.filter((src) => !src.includes(':')));
  const prefixes = rewrites.filter((src) => src.includes(':')).map((src) => src.replace(/\/:.*$/, ''));

  /** Whether the Site answers this path. */
  const siteOwns = (path) => exact.has(path) || prefixes.some((p) => path.startsWith(p + '/'));

  const siteePaths = paths.filter(siteOwns);
  const appPaths = paths.filter((p) => !siteOwns(p));

  /** Does a Next route file exist that could serve this path? */
  function siteRouteExists(path) {
    const segments = path.split('/').filter(Boolean);
    let dir = resolve(__dirname, '..', 'apps/web/src/app');
    for (const seg of segments) {
      const literal = join(dir, seg);
      if (existsSync(literal) && statSync(literal).isDirectory()) { dir = literal; continue; }
      const dynamic = existsSync(dir)
        ? readdirSync(dir, { withFileTypes: true })
            .filter((e) => e.isDirectory() && e.name.startsWith('['))
            .map((e) => join(dir, e.name))[0]
        : undefined;
      if (!dynamic) return false;
      dir = dynamic;
    }
    return existsSync(join(dir, 'page.tsx'));
  }

  const server = await startServer();
  const { port } = server.address();
  const base = `http://localhost:${port}`;
  const browser = await chromium.launch();

  const failures = [];
  let checked = 0;

  async function checkPath(path) {
    const page = await browser.newPage();
    try {
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(600); // let React mount and route
      const text = await page.locator('body').innerText();
      if (text.includes(NOT_FOUND_MARKER)) failures.push(path);
    } catch (err) {
      failures.push(`${path} (error: ${err.message})`);
    } finally {
      checked++;
      await page.close();
    }
  }

  for (const path of siteePaths) {
    checked++;
    if (!siteRouteExists(path)) failures.push(`${path} (no Next route file could serve it)`);
  }

  // Simple concurrency pool.
  const queue = [...appPaths];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) await checkPath(queue.shift());
    }),
  );

  await browser.close();
  server.close();

  console.log(`Checked ${checked} sitemap URL(s): ${appPaths.length} rendered against the App, ${siteePaths.length} matched to a Site route file.`);
  if (failures.length) {
    console.error(`\nSOFT 404 - these sitemap URLs render the Not Found page:`);
    for (const f of failures) console.error(`  - ${f}`);
    console.error(`\nA URL in the sitemap must resolve to a real route. Either add the`);
    console.error(`route, remove it from the sitemap/prerender, or redirect it.`);
    process.exit(1);
  }
  console.log('OK - every sitemap URL renders real content.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
