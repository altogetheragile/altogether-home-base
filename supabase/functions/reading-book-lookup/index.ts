// Fill in a reading list book from an Amazon link, without reading Amazon.
//
// POST { url } as an admin. Returns what could be found:
//   { asin, title, author, cover_url, matchedBy: 'isbn' | 'title' | null, note }
//
// The ASIN comes from the link. For a printed book it is the ISBN-10, which Open Library looks up
// exactly. Otherwise the title words in the link are searched, and a record is accepted only if
// the link begins with its whole title. A cover, when there is one, is copied once into this
// project's storage (assets/reading-covers/), named after Open Library's cover id so looking the
// same book up twice does not store it twice.
//
// An Amazon short link (amzn.to, a.co) is followed by reading its redirect header only.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.5';
import { parseAmazonUrl, isIsbn10, pickByTitle, titleFromSlug, titleQueries, SHORT_HOSTS, type OpenLibraryDoc } from '../_shared/bookLookup.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// A generic name: no person or project in it.
const OL = { 'user-agent': 'reading-list-book-lookup/1.0' };

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://altogetheragile.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

/** Follows an Amazon short link by its redirect header, at most three hops. */
async function expand(url: string): Promise<string> {
  let current = url;
  for (let i = 0; i < 3; i += 1) {
    let host = '';
    try { host = new URL(current).hostname; } catch { return current; }
    if (!SHORT_HOSTS.test(host)) return current;
    const res = await fetch(current, { method: 'HEAD', redirect: 'manual' });
    const next = res.headers.get('location');
    if (!next) return current;
    current = new URL(next, current).toString();
  }
  return current;
}

/** A printed book by its ISBN, from the edition's own record: its author list is the book's
 *  authors, where a search lists every contributor (foreword, illustrator) as an author. */
async function byIsbn(isbn: string): Promise<OpenLibraryDoc | null> {
  const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`, { headers: OL });
  if (!res.ok) return null;
  const ed = await res.json();
  let keys: string[] = (ed.authors ?? []).map((a: { key: string }) => a.key);
  if (!keys.length && ed.works?.[0]?.key) {
    const work = await (await fetch(`https://openlibrary.org${ed.works[0].key}.json`, { headers: OL })).json();
    keys = (work.authors ?? []).map((a: { author?: { key: string } }) => a.author?.key).filter(Boolean);
  }
  const names: string[] = [];
  for (const key of keys.slice(0, 3)) {
    const a = await (await fetch(`https://openlibrary.org${key}.json`, { headers: OL })).json().catch(() => null);
    if (a?.name) names.push(a.name);
  }
  return { title: ed.title, author_name: names, cover_i: ed.covers?.find((c: number) => c > 0) };
}

async function search(params: string): Promise<OpenLibraryDoc[]> {
  const res = await fetch(`https://openlibrary.org/search.json?${params}&fields=title,author_name,cover_i&limit=10`, { headers: OL });
  if (!res.ok) throw new Error(`Open Library said ${res.status}`);
  return (await res.json()).docs ?? [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);
  const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
  if (isAdmin !== true) return json({ error: 'Only an administrator can look books up.' }, 403);

  try {
    const body = await req.json();
    const given = String(body?.url ?? '').trim().slice(0, 2000);
    if (!given) return json({ error: 'Paste an Amazon link first.' }, 400);
    const parts = parseAmazonUrl(await expand(given));
    if (!parts) return json({ error: 'That is not an Amazon link.' }, 400);

    let doc: OpenLibraryDoc | null = null;
    let matchedBy: 'isbn' | 'title' | null = null;
    if (isIsbn10(parts.asin)) {
      doc = await byIsbn(parts.asin);
      if (doc?.title) matchedBy = 'isbn';
      else doc = null;
    }
    for (const q of parts.slug && !doc ? titleQueries(parts.slug) : []) {
      doc = pickByTitle(parts.slug, await search(`q=${encodeURIComponent(q)}`));
      if (doc) { matchedBy = 'title'; break; }
    }

    let cover_url: string | null = null;
    if (doc?.cover_i) {
      const img = await fetch(`https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg?default=false`, { headers: OL });
      const bytes = img.ok ? new Uint8Array(await img.arrayBuffer()) : null;
      // A real cover is a JPEG of a few kilobytes; anything else is a placeholder or an error.
      if (bytes && (img.headers.get('content-type') ?? '').startsWith('image/') && bytes.length >= 2000) {
        const path = `reading-covers/ol-${doc.cover_i}.jpg`;
        const up = await supabase.storage.from('assets').upload(path, bytes, { contentType: 'image/jpeg', upsert: true, cacheControl: '31536000' });
        if (!up.error) cover_url = supabase.storage.from('assets').getPublicUrl(path).data.publicUrl;
      }
    }

    const title = doc?.title ?? (parts.slug ? titleFromSlug(parts.slug) : null);
    const author = doc?.author_name?.slice(0, 3).join(', ') ?? null;
    const note = matchedBy === 'isbn' ? 'Found by its ISBN.'
      : matchedBy === 'title' ? 'Found by the title in the link. Check it is the right book.'
        : parts.slug ? 'Not found. The title is taken from the link; add the author yourself.'
          : 'Not found, and the link has no title in it. Fill in the title and author yourself.';
    return json({ asin: parts.asin, title, author, cover_url, matchedBy, note });
  } catch (e) {
    return json({ error: `The lookup failed: ${(e as Error).message}` }, 502);
  }
});
