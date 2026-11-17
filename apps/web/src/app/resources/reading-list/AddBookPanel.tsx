'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Wand2, X } from 'lucide-react';
import { colors as c } from '@/lib/brand';
import { addBook } from '@/app/actions/readingList';
import { lookUpAmazonLink, type LookupResult } from './amazonLookup';

// "Add a book", for an admin standing on the reading list. Paste an Amazon link and press Fill in:
// the title, author, ASIN and (when Open Library has one) the cover come back to check. Choose the
// topic, then Add. Nothing is saved until Add, and the page then renders again with the book in it.

const FIELD = 'w-full rounded-md border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1';

export function AddBookPanel({ topics }: { topics: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [topic, setTopic] = useState('');
  const [found, setFound] = useState<LookupResult | null>(null);
  const [busy, setBusy] = useState<'lookup' | 'add' | null>(null);
  const [message, setMessage] = useState<{ kind: 'note' | 'error' | 'done'; text: string } | null>(null);

  const reset = () => { setLink(''); setTitle(''); setAuthor(''); setFound(null); setMessage(null); };

  const fill = async () => {
    setBusy('lookup');
    setMessage(null);
    try {
      const r = await lookUpAmazonLink(link);
      setFound(r);
      if (r.title) setTitle(r.title);
      if (r.author) setAuthor(r.author);
      setMessage({ kind: 'note', text: r.matchedBy && r.author?.includes(',') ? `${r.note} Check the authors: Open Library sometimes lists a foreword writer or illustrator as one.` : r.note });
    } catch (e) {
      setMessage({ kind: 'error', text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const add = async () => {
    setBusy('add');
    setMessage(null);
    const res = await addBook({ title, author, category_id: topic, asin: found?.asin ?? null, cover_url: found?.cover_url ?? null })
      .catch((e: Error) => ({ ok: false as const, error: e.message }));
    setBusy(null);
    if (!res.ok) { setMessage({ kind: 'error', text: res.error }); return; }
    const added = title;
    reset();
    setMessage({ kind: 'done', text: `"${added}" is on the list.` });
    router.refresh();
  };

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: c.deepTeal, borderColor: c.deepTeal, outlineColor: c.deepTeal }}
        >
          <Plus size={15} aria-hidden /> Add a book
        </button>
        {message?.kind === 'done' && <p role="status" className="m-0 text-sm" style={{ color: c.deepTeal }}>{message.text}</p>}
      </div>
    );
  }

  return (
    <section aria-label="Add a book" className="rounded-xl border p-4" style={{ borderColor: c.lightTeal, background: c.skyTeal }}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="m-0 text-base font-semibold" style={{ color: c.deepTeal }}>Add a book</h2>
        <button type="button" onClick={() => { reset(); setOpen(false); }} aria-label="Close" className="rounded p-1 hover:bg-white" style={{ color: c.muted }}>
          <X size={16} aria-hidden />
        </button>
      </div>

      <label htmlFor="add-link" className="mb-1 block text-sm font-medium" style={{ color: c.body }}>Amazon link</label>
      <div className="flex flex-wrap gap-2">
        <input
          id="add-link"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://www.amazon.co.uk/..."
          className={`${FIELD} min-w-0 flex-1 bg-white`}
          style={{ outlineColor: c.deepTeal }}
        />
        <button
          type="button"
          onClick={fill}
          disabled={!link.trim() || busy !== null}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: c.deepTeal }}
        >
          {busy === 'lookup' ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Wand2 size={15} aria-hidden />} Fill in
        </button>
      </div>

      <div className="mt-3 flex min-w-0 gap-3">
        {found?.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={found.cover_url} alt={`Cover found for ${title || 'this book'}`} width={64} height={96} className="h-24 w-16 shrink-0 rounded border object-cover" />
        )}
        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-3">
          <div className="min-w-0">
            <label htmlFor="add-title" className="mb-1 block text-xs font-medium" style={{ color: c.body }}>Title</label>
            <input id="add-title" value={title} onChange={(e) => setTitle(e.target.value)} className={`${FIELD} bg-white`} style={{ outlineColor: c.deepTeal }} />
          </div>
          <div className="min-w-0">
            <label htmlFor="add-author" className="mb-1 block text-xs font-medium" style={{ color: c.body }}>Author</label>
            <input id="add-author" value={author} onChange={(e) => setAuthor(e.target.value)} className={`${FIELD} bg-white`} style={{ outlineColor: c.deepTeal }} />
          </div>
          <div className="min-w-0">
            <label htmlFor="add-topic" className="mb-1 block text-xs font-medium" style={{ color: c.body }}>Topic</label>
            <select id="add-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className={`${FIELD} bg-white`} style={{ outlineColor: c.deepTeal }}>
              <option value="">Choose a topic</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Kept open after an add, for the next book, so the confirmation is shown here too. */}
      {message && (
        <p role={message.kind === 'error' ? 'alert' : 'status'} className="mb-0 mt-3 text-sm" style={{ color: message.kind === 'error' ? c.danger : message.kind === 'done' ? c.deepTeal : c.body }}>
          {message.text}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={add}
          disabled={!title.trim() || !topic || busy !== null}
          className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
          style={{ background: c.orange, color: '#1F2937' }}
        >
          {busy === 'add' ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Plus size={15} aria-hidden />} Add to the list
        </button>
        <span className="text-xs" style={{ color: c.muted }}>Shown to visitors at once, at the end of its topic. Edit anything else in Admin.</span>
      </div>
    </section>
  );
}
