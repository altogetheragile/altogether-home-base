/**
 * Seed the reading list from a CSV.
 * Run: node scripts/seed-reading-list.mjs [--dry] [--file data/reading-list.csv]
 *
 * Safe to run again. Books are matched on title and author: a match is updated in place, never
 * duplicated, and anything the file does not mention (an ASIN, a blurb, a link added in Admin) is
 * left alone. Categories are matched on name. The Amazon Associates tag is set only if the site has
 * none yet, so a tag changed in Admin is never put back.
 *
 * Uses the same reader and the same plan as Admin's import (packages/ui/src/readingListCsv.ts), so
 * the two cannot disagree about what a duplicate is. Needs packages/ui built: npm install does it.
 *
 * Needs the migration first: npx supabase db push
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readReadingListCsv, planImport } from '../packages/ui/dist/readingListCsv.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const dry = process.argv.includes('--dry');
const fileArg = process.argv.indexOf('--file');
const FILE = resolve(ROOT, fileArg > -1 ? process.argv[fileArg + 1] : 'data/reading-list.csv');
const TAG = 'altogethera09-21';

function env(name) {
  if (process.env[name]) return process.env[name];
  const line = readFileSync(resolve(ROOT, '.env'), 'utf-8').split('\n').find((l) => l.startsWith(name + '='));
  return line ? line.slice(name.length + 1).replace(/^['"]|['"]$/g, '').trim() : '';
}

const url = env('VITE_SUPABASE_URL');
const key = env('SUPABASE_SERVICE_ROLE_KEY');
if (!url || !key) {
  console.error('Needs VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, in the environment or .env.');
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const must = (res, what) => {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
};

async function main() {
  const { books: file, problems } = readReadingListCsv(readFileSync(FILE, 'utf-8'));
  for (const p of problems) console.warn(`  skip line ${p.line}: ${p.reason}`);
  console.log(`${FILE}: ${file.length} books, ${file.filter((b) => b.show).length} shown.`);

  const categories = must(await db.from('reading_categories').select('id, name, slug, sort_order'), 'read categories');
  const books = must(await db.from('reading_books').select('id, title, author, category_id, is_visible, asin, amazon_url, blurb, is_featured, sort_order'), 'read books');
  const notes = must(await db.from('reading_book_notes').select('book_id, owned_format, source_note'), 'read notes');
  const noteOf = new Map(notes.map((n) => [n.book_id, n]));
  const existing = books.map((b) => ({ ...b, owned_format: noteOf.get(b.id)?.owned_format ?? null, source_note: noteOf.get(b.id)?.source_note ?? null }));

  const plan = planImport(file, categories, existing);
  console.log(`Categories: ${plan.newCategories.length} new (${plan.newCategories.map((c) => c.name).join(', ') || 'none'}).`);
  console.log(`Books: ${plan.inserts.length} new, ${plan.updates.length} updated, ${plan.unchanged} unchanged.`);
  if (plan.duplicates.length) console.warn(`  In the file twice, later row used: ${plan.duplicates.join('; ')}`);

  const settings = must(await db.from('site_settings').select('id, amazon_associate_tag').limit(1).maybeSingle(), 'read settings');
  const setTag = settings && !settings.amazon_associate_tag;
  console.log(setTag ? `Associates tag: will set to ${TAG}.` : `Associates tag: already ${settings?.amazon_associate_tag ?? '(no settings row)'}, left alone.`);

  if (dry) { console.log('\nDry run: nothing written.'); return; }

  if (plan.newCategories.length) {
    must(await db.from('reading_categories').insert(plan.newCategories.map((c) => ({ ...c, is_visible: true }))), 'add categories');
  }
  const allCats = must(await db.from('reading_categories').select('id, name'), 'reread categories');
  const catId = (name) => allCats.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase())?.id;

  const row = (w) => {
    const r = {
      title: w.title, author: w.author, category_id: catId(w.category), is_visible: w.is_visible,
      amazon_url: w.amazon_url, sort_order: w.sort_order,
    };
    for (const k of ['asin', 'blurb', 'is_featured']) if (w[k] !== undefined) r[k] = w[k];
    return r;
  };
  const noteRow = (id, w) => ({ book_id: id, owned_format: w.owned_format, source_note: w.source_note });

  if (plan.inserts.length) {
    const added = must(await db.from('reading_books').insert(plan.inserts.map(row)).select('id, title, author'), 'add books');
    const idOf = new Map(added.map((b) => [`${b.title}\u0000${b.author}`, b.id]));
    must(await db.from('reading_book_notes').upsert(plan.inserts.map((w) => noteRow(idOf.get(`${w.title}\u0000${w.author}`), w))), 'add notes');
  }
  for (const w of plan.updates) {
    must(await db.from('reading_books').update(row(w)).eq('id', w.id), `update ${w.title}`);
    must(await db.from('reading_book_notes').upsert(noteRow(w.id, w)), `update notes for ${w.title}`);
  }
  if (setTag) must(await db.from('site_settings').update({ amazon_associate_tag: TAG }).eq('id', settings.id), 'set tag');

  console.log('\nDone.');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
