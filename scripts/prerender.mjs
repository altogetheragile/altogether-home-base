/**
 * Post-build prerender script.
 *
 * Serves dist/ with Vite preview, visits every public route with
 * Playwright, and overwrites the HTML files with the fully-rendered
 * output so crawlers get complete content without executing JS.
 *
 * Usage:  node scripts/prerender.mjs
 *
 * Vercel setup: set build command to
 *   npx playwright install chromium --with-deps && npm run build
 */

import { chromium } from 'playwright';
import { preview } from 'vite';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');

// Load .env for local builds (Vercel sets env vars via dashboard)
const envPath = resolve(ROOT, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^(\w+)=["']?(.+?)["']?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

// ── Routes to prerender ─────────────────────────────────────────────
const STATIC_ROUTES = [
  '/',
  '/events',
  '/knowledge',
  '/coaching',
  '/blog',
  '/exams',
  '/about',
  '/contact',
  '/testimonials',
  '/ai-tools',
  '/privacy',
  '/terms',
  '/cookies',
];

// ── Helpers ──────────────────────────────────────────────────────────

/** Parse additional routes from the static sitemap.xml. */
function routesFromSitemap() {
  const sitemapPath = resolve(DIST, 'sitemap.xml');
  if (!existsSync(sitemapPath)) return [];
  const xml = readFileSync(sitemapPath, 'utf-8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  return urls
    .map(u => { try { return new URL(u).pathname; } catch { return null; } })
    .filter(Boolean)
    .filter(p => !STATIC_ROUTES.includes(p));
}

/** Fetch dynamic routes from Supabase (courses, knowledge items, exams). */
async function routesFromSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn('  Supabase env vars not set — skipping dynamic routes');
    return [];
  }

  const supabase = createClient(url, key);
  const routes = [];

  const { data: templates } = await supabase
    .from('event_templates')
    .select('id')
    .eq('is_published', true);
  if (templates) {
    for (const t of templates) routes.push(`/courses/${t.id}`);
  }

  const { data: techniques } = await supabase
    .from('knowledge_items')
    .select('slug')
    .eq('is_published', true);
  if (techniques) {
    for (const t of techniques) routes.push(`/knowledge/${t.slug}`);
  }

  const { data: exams } = await supabase
    .from('exams')
    .select('slug')
    .eq('status', 'published');
  if (exams) {
    for (const e of exams) routes.push(`/exams/${e.slug}`);
  }

  console.log(`  Found ${routes.length} dynamic routes from Supabase`);
  return routes;
}

/** Write rendered HTML to dist/<route>/index.html. */
function writeHtml(route, html) {
  if (route === '/') {
    writeFileSync(resolve(DIST, 'index.html'), html, 'utf-8');
    return;
  }
  const segments = route.replace(/^\//, '').split('/');
  const dir = resolve(DIST, ...segments);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf-8');
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  // Gracefully skip if Playwright browsers aren't installed
  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    console.warn(`\nSkipping prerender: ${err.message}\n`);
    console.warn('Run "npx playwright install chromium" to enable prerendering.\n');
    return;
  }

  const sitemapRoutes = routesFromSitemap();
  const dynamicRoutes = await routesFromSupabase();
  const allRoutes = [...new Set([...STATIC_ROUTES, ...sitemapRoutes, ...dynamicRoutes])];

  console.log(`\nPrerendering ${allRoutes.length} routes…\n`);

  // Start Vite preview server on dist/
  const server = await preview({
    root: ROOT,
    preview: { port: 4174, strictPort: false },
  });
  const address = server.httpServer.address();
  const origin = `http://localhost:${address.port}`;

  const context = await browser.newContext({
    userAgent: 'AltogetherAgile-Prerenderer',
  });

  let succeeded = 0;
  let skipped = 0;

  for (const route of allRoutes) {
    const url = `${origin}${route}`;
    try {
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });

      // Give React Helmet a moment to inject meta tags
      await page.waitForTimeout(500);

      // Skip 404 pages — they shouldn't be prerendered
      const is404 = await page.locator('text=Page not found').count() > 0;
      if (is404 && route !== '/') {
        console.log(`  skip ${route} (404)`);
        skipped++;
        await page.close();
        continue;
      }

      let html = await page.content();

      // Mark as prerendered
      html = html.replace('</head>', '<meta name="prerender-status" content="prerendered">\n</head>');

      writeHtml(route, html);
      console.log(`  ok   ${route}`);
      succeeded++;
      await page.close();
    } catch (err) {
      // Non-fatal: log and continue with other routes
      console.warn(`  skip ${route} (${err.message})`);
      skipped++;
    }
  }

  await browser.close();
  server.httpServer.close();

  console.log(`\nPrerendered ${succeeded} pages${skipped ? `, skipped ${skipped}` : ''}\n`);
}

main().catch(err => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
