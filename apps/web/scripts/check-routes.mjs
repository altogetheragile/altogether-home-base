/**
 * Render guard for the Site's routes.
 * Run against a started server:  node scripts/check-routes.mjs http://localhost:3000
 *                                 node scripts/check-routes.mjs http://localhost:3000 --extra /orphan
 *
 * Every public URL the Site owns has to answer 200 with real content in the HTML. That last part
 * is the point: these pages exist because a crawler reading an SPA gets an empty shell, so a Site
 * page that renders but says nothing has failed at the only job it has.
 *
 * This replaces coverage the repo lost. check-sitemap-routes.mjs used to render all 40 sitemap
 * URLs, but it renders them against the App, and the App stopped claiming the Site's URLs. It now
 * matches those to a route file instead, which catches an orphan URL but would pass a page that
 * exists and throws. This catches that.
 *
 * A module that is switched off 404s by design (src/lib/module-gate.ts), so the flags are read
 * first and those routes are reported as skipped rather than failed.
 */
import { createClient } from '@supabase/supabase-js';

const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const MIN_WORDS = 100;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/** Visible words in a server-rendered response. */
function words(html) {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ');
  return stripped.split(/\s+/).filter(Boolean).length;
}

/** One real row per dynamic route, so the check exercises them as a visitor would. */
async function dynamicRoutes() {
  const out = [];
  const [{ data: posts }, { data: exams }, { data: courses }] = await Promise.all([
    supabase.from('blog_posts').select('slug').eq('is_published', true).limit(1),
    supabase.from('exams').select('slug').eq('status', 'published').limit(1),
    supabase.from('event_templates').select('slug').not('slug', 'is', null).limit(1),
  ]);
  if (posts?.[0]) out.push({ path: `/blog/${posts[0].slug}`, module: 'blog' });
  if (exams?.[0]) out.push({ path: `/exams/${exams[0].slug}`, module: 'exams' });
  if (courses?.[0]) out.push({ path: `/courses/${courses[0].slug}`, module: 'events' });
  return out;
}

const STATIC_ROUTES = [
  { path: '/', module: null },
  { path: '/about', module: 'about' },
  { path: '/coaching', module: 'coaching' },
  { path: '/contact', module: 'contact' },
  { path: '/testimonials', module: 'testimonials' },
  { path: '/events', module: 'events' },
  { path: '/blog', module: 'blog' },
  { path: '/exams', module: 'exams' },
];

const { data: settingsRows } = await supabase.from('site_settings').select('*').limit(1);
const settings = settingsRows?.[0] ?? {};
const isOn = (module) => module === null || settings[`show_${module}`] !== false;

// --extra is for proving the guard still fails when it should.
const extraIdx = process.argv.indexOf('--extra');
const extra = extraIdx > -1 ? process.argv[extraIdx + 1] : null;

const routes = [...STATIC_ROUTES, ...(await dynamicRoutes())];
if (extra) routes.push({ path: extra, module: null });
const failures = [];
const skipped = [];
let checked = 0;

for (const { path, module } of routes) {
  if (!isOn(module)) { skipped.push(`${path} (show_${module} is off)`); continue; }
  checked++;
  try {
    const res = await fetch(`${base}${path}`);
    const html = await res.text();
    const count = words(html);
    if (!res.ok) failures.push(`${path} answered ${res.status}`);
    else if (count < MIN_WORDS) failures.push(`${path} rendered only ${count} words`);
  } catch (err) {
    failures.push(`${path} (${err.message})`);
  }
}

console.log(`Checked ${checked} Site route(s) against ${base}.`);
for (const s of skipped) console.log(`  skipped ${s}`);

if (failures.length) {
  console.error('\nThese Site routes did not render real content:');
  for (const f of failures) console.error(`  - ${f}`);
  console.error('\nA Site page exists to put words in the HTML. One that 404s, errors or comes');
  console.error(`back under ${MIN_WORDS} words is not doing the job it was moved here for.`);
  process.exit(1);
}
console.log('OK - every switched-on Site route renders real content.');
