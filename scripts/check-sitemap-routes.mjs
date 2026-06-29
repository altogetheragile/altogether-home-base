/**
 * Soft-404 guard (Phase 0, route/sitemap guard).
 *
 * Loads every URL in the built sitemap against the built site and fails if any
 * renders the Not Found page. This catches "orphan" URLs - a path that is
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
import { readFileSync, existsSync, statSync } from 'fs';
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

  // Simple concurrency pool.
  const queue = [...paths];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) await checkPath(queue.shift());
    }),
  );

  await browser.close();
  server.close();

  console.log(`Checked ${checked} sitemap URL(s).`);
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
