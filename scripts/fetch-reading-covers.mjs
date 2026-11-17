/**
 * Fetch reading list covers from Open Library, once, into this project's own storage.
 * Run: node scripts/fetch-reading-covers.mjs [--dry] [--limit 10]
 *
 * For every book with no cover yet: search Open Library by title and first author, accept a result
 * only when its title matches and one of its authors shares a surname with ours, download the
 * medium cover, put it in the assets bucket at reading-covers/<book id>.jpg, and record it.
 *
 * Strict on purpose. A missing cover is a gap you can fill in Admin; a wrong cover is a mistake on
 * the live page that nobody notices. Every book it cannot match is listed at the end.
 *
 * Safe to run again: it only looks at books with no cover, and never touches one uploaded in
 * Admin. Polite to Open Library: one request at a time, a pause between books.
 *
 * Needs the migration 20261117200000_a_book_has_a_cover.sql first.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dry = process.argv.includes('--dry');
const li = process.argv.indexOf('--limit');
const LIMIT = li > -1 ? Number(process.argv[li + 1]) : Infinity;
// A generic name: no person or project in it.
const HEADERS = { 'user-agent': 'reading-list-cover-fetch/1.0' };
const PAUSE_MS = 1500;

function env(name) {
  if (process.env[name]) return process.env[name];
  const line = readFileSync(resolve(ROOT, '.env'), 'utf-8').split('\n').find((l) => l.startsWith(name + '='));
  return line ? line.slice(name.length + 1).replace(/^['"]|['"]$/g, '').trim() : '';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Lower case, accents and punctuation off, "&" as "and", runs of space squeezed. */
export const norm = (s) => (s ?? '')
  .normalize('NFKD').replace(/[\u0300-\u036F]/g, '')
  .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
/** The title without a subtitle: "Scrum: A Pocket Guide" and "Scrum - A Pocket Guide" agree. */
const mainTitle = (s) => norm(s.split(/[:(]|\s[-–]\s/)[0]);
const surnames = (authors) => authors
  .split(/,|\band\b|&/).map((a) => norm(a.replace(/\(.*?\)/g, '')).split(' ').pop()).filter(Boolean);

/** Whether an Open Library result is this book. Title must match in full, or the main titles must
 *  match exactly; and an author must share a surname. */
export function isMatch(book, doc) {
  const want = norm(book.title);
  const got = norm(doc.title ?? '');
  const titleOk = got === want || (mainTitle(book.title).length > 3 && mainTitle(doc.title ?? '') === mainTitle(book.title) && got.startsWith(mainTitle(book.title)));
  if (!titleOk) return false;
  const ours = surnames(book.author);
  if (!ours.length) return true;
  const theirs = (doc.author_name ?? []).flatMap((a) => surnames(a));
  return ours.some((s) => theirs.includes(s));
}

async function search(params) {
  const res = await fetch(`https://openlibrary.org/search.json?${params}&fields=key,title,author_name,cover_i&limit=10`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Open Library search said ${res.status}`);
  return (await res.json()).docs ?? [];
}

export async function findCover(book) {
  const first = book.author.split(',')[0].replace(/\(.*?\)/g, '').trim();
  const tries = [
    `title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(first)}`,
    `q=${encodeURIComponent(`${book.title.split(':')[0]} ${first}`)}`,
  ];
  for (const t of tries) {
    const docs = await search(t);
    // An exact title first, then the main title; the first with a cover wins.
    const ranked = docs.filter((d) => d.cover_i && isMatch(book, d))
      .sort((a, b) => Number(norm(b.title) === norm(book.title)) - Number(norm(a.title) === norm(book.title)));
    if (ranked[0]) return { coverId: ranked[0].cover_i, matched: ranked[0].title };
    await sleep(PAUSE_MS);
  }
  return null;
}

async function main() {
  const url = env('VITE_SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    console.error('Needs VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, in the environment or .env.');
    process.exit(2);
  }
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: books, error } = await db.from('reading_books')
    .select('id, title, author, cover_url, cover_source').is('cover_url', null).order('title');
  if (error) throw new Error(error.message);
  const todo = books.slice(0, LIMIT);
  console.log(`${books.length} books have no cover${Number.isFinite(LIMIT) ? `; looking at ${todo.length}` : ''}.${dry ? ' Dry run.' : ''}\n`);

  const found = [];
  const missing = [];
  for (const book of todo) {
    let hit = null;
    try { hit = await findCover(book); } catch (e) { console.warn(`  ! ${book.title}: ${e.message}`); }
    if (!hit) { missing.push(book); console.log(`  - ${book.title}`); await sleep(PAUSE_MS); continue; }

    const img = await fetch(`https://covers.openlibrary.org/b/id/${hit.coverId}-M.jpg?default=false`, { headers: HEADERS });
    const type = img.headers.get('content-type') ?? '';
    const bytes = img.ok ? Buffer.from(await img.arrayBuffer()) : null;
    // A real cover is a JPEG of a few kilobytes; anything else is a placeholder or an error page.
    if (!bytes || !type.startsWith('image/') || bytes.length < 2000) {
      missing.push(book);
      console.log(`  - ${book.title} (Open Library has a record but no usable cover)`);
      await sleep(PAUSE_MS);
      continue;
    }
    if (!dry) {
      const path = `reading-covers/${book.id}.jpg`;
      const up = await db.storage.from('assets').upload(path, bytes, { contentType: 'image/jpeg', upsert: true, cacheControl: '31536000' });
      if (up.error) throw new Error(`upload ${book.title}: ${up.error.message}`);
      const publicUrl = db.storage.from('assets').getPublicUrl(path).data.publicUrl;
      // Only where there is still no cover: an upload made in Admin while this ran wins.
      const set = await db.from('reading_books').update({ cover_url: publicUrl, cover_source: 'openlibrary' })
        .eq('id', book.id).is('cover_url', null);
      if (set.error) throw new Error(`record ${book.title}: ${set.error.message}`);
    }
    found.push(book);
    console.log(`  + ${book.title}${norm(hit.matched) !== norm(book.title) ? `  (matched "${hit.matched}")` : ''}`);
    await sleep(PAUSE_MS);
  }

  console.log(`\n${found.length} covers ${dry ? 'would be ' : ''}added, ${missing.length} not found.`);
  if (missing.length) {
    console.log('\nAdd these by hand in Admin > Reading List (filter "No cover"):');
    for (const b of missing) console.log(`  ${b.title} - ${b.author}`);
  }
}

// Run only as a script, so the matching can be imported by a test.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
