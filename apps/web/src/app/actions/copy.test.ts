import { describe, it, expect, vi, beforeEach } from 'vitest';

// A Server Action is a public endpoint. It is reachable by anyone who can read the page's
// JavaScript, whether or not the component that calls it was ever rendered for them. These cover
// what it does when the caller is not who the page assumed.

const upsert = vi.fn(async () => ({ error: null }));
const del = vi.fn(async () => ({ error: null }));
const revisionInsert = vi.fn(async () => ({ error: null }));
const revisionDelete = vi.fn(async () => ({ error: null }));
let admin = true;
let upsertFails = false;
/** What site_copy holds before the call under test. */
let existing: { key: string; value: string }[] = [];
/** The newest revision for a key, or null when there is none to undo to. */
let newestRevision: { id: number; value: string } | null = null;

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth', () => ({
  isAdmin: async () => admin,
  getCurrentUser: async () => ({ id: 'someone' }),
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === 'site_copy_revisions') {
        const one = { data: newestRevision };
        const chain: Record<string, unknown> = {
          select: () => chain,
          eq: () => chain,
          order: () => chain,
          limit: () => chain,
          maybeSingle: async () => one,
          then: (r: (v: { data: unknown }) => void) => r({ data: [] }),
        };
        return {
          ...chain,
          insert: (rows: unknown) => revisionInsert(rows as never),
          delete: () => ({ eq: () => revisionDelete() }),
        };
      }
      return {
        select: () => ({
          eq: Object.assign(async () => ({ data: [{ key: 'about.hero.heading', value: 'Her words' }] }), {
            maybeSingle: async () => ({ data: existing[0] ?? null }),
          }),
          in: async () => ({ data: existing }),
        }),
        upsert: (rows: unknown, opts: unknown) => {
          upsert(rows as never, opts as never);
          return Promise.resolve({ error: upsertFails ? { message: 'write failed' } : null });
        },
        delete: () => ({ eq: () => ({ eq: () => del() }) }),
      };
    },
  }),
}));

const load = async () => await import('./copy');

beforeEach(() => {
  admin = true;
  upsertFails = false;
  existing = [];
  newestRevision = null;
  upsert.mockClear();
  del.mockClear();
  revisionInsert.mockClear();
  revisionDelete.mockClear();
});

describe('editing the words from the page they appear on', () => {
  it('gives a visitor nothing to edit', async () => {
    admin = false;
    const { loadPageCopy } = await load();
    expect(await loadPageCopy('about')).toEqual([]);
  });

  it('refuses a visitor who calls the action directly', async () => {
    admin = false;
    const { savePageCopy, resetCopy } = await load();
    expect(await savePageCopy('about', { 'about.hero.heading': 'defaced' })).toEqual({ ok: false, error: 'Not allowed.' });
    expect(await resetCopy('about', 'about.hero.heading')).toEqual({ ok: false, error: 'Not allowed.' });
    expect(upsert).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
  });

  it('refuses a key the page does not read', async () => {
    // Otherwise site_copy grows rows nothing renders, and the editor lists words that do nothing.
    const { savePageCopy } = await load();
    const result = await savePageCopy('about', { 'about.hero.heading': 'fine', 'made.up.key': 'not fine' });
    expect(result.ok).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('refuses a page that does not exist', async () => {
    const { savePageCopy } = await load();
    expect((await savePageCopy('nowhere', { a: 'b' })).ok).toBe(false);
  });

  it('writes only what changed', async () => {
    // Two admins editing different parts of one page should not overwrite each other with values
    // neither of them looked at.
    const { savePageCopy } = await load();
    expect(await savePageCopy('about', { 'about.hero.heading': 'New heading' })).toEqual({ ok: true });
    const [rows] = upsert.mock.calls[0] as unknown as [Array<{ key: string; page: string }>];
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe('about.hero.heading');
    expect(rows[0].page).toBe('about');
  });

  it('upserts on the key alone, which is the primary key', async () => {
    // site_copy's primary key is `key`, not (page, key). Naming the wrong conflict target fails
    // at runtime only, with a message about no unique constraint.
    const { savePageCopy } = await load();
    await savePageCopy('about', { 'about.hero.heading': 'x' });
    expect(upsert.mock.calls[0][1]).toEqual({ onConflict: 'key' });
  });

  it('lays a saved edit over the shipped wording', async () => {
    const { loadPageCopy } = await load();
    const fields = await loadPageCopy('about');
    const heading = fields.find((f) => f.key === 'about.hero.heading');
    expect(heading?.value).toBe('Her words');
    // The shipped wording is kept beside it, so "Put back" has something to put back.
    expect(heading?.shipped).not.toBe('Her words');
    expect(heading?.shipped.length).toBeGreaterThan(0);
  });

  it('saving nothing is not an error', async () => {
    const { savePageCopy } = await load();
    expect(await savePageCopy('about', {})).toEqual({ ok: true });
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe('putting a value back', () => {
  it('is only offered when the shipped wording is something, not nothing', async () => {
    // The editor decides this from the field it gets back, so the contract is that `shipped`
    // carries the real shipped value rather than the resolved one.
    const { loadPageCopy } = await load();
    const fields = await loadPageCopy('about');
    const blank = fields.filter((f) => !f.shipped.trim());
    // Every blank-by-design key must be recognisable as blank from the field alone, or the editor
    // cannot tell "put back the original" from "delete everything I have written".
    expect(blank.every((f) => f.shipped === '')).toBe(true);
    expect(fields.find((f) => f.key === 'about.timeline.list')?.shipped).toBe('');
  });
});

describe('every change can be undone', () => {
  it('records what the change replaced, not what it wrote', async () => {
    existing = [{ key: 'about.hero.heading', value: 'What it said before' }];
    const { savePageCopy } = await load();
    await savePageCopy('about', { 'about.hero.heading': 'What it says now' });

    const [rows] = revisionInsert.mock.calls[0] as unknown as [Array<{ key: string; value: string }>];
    expect(rows[0].value, 'undo would jump forwards, not back').toBe('What it said before');
  });

  it('treats a key with no row as showing its shipped wording', async () => {
    // Nothing in site_copy means the page was rendering the registry default, so that is what the
    // change replaced and that is where undo has to return to.
    existing = [];
    const { savePageCopy } = await load();
    await savePageCopy('about', { 'about.hero.heading': 'Something new' });

    const [rows] = revisionInsert.mock.calls[0] as unknown as [Array<{ value: string }>];
    const { REGISTRIES } = await import('@/lib/copy');
    const shipped = REGISTRIES.find((r) => r.page === 'about')!.entries['about.hero.heading'].value;
    expect(rows[0].value).toBe(shipped);
  });

  it('records nothing when the save failed', async () => {
    // An undo offering to restore a change that never landed is worse than no undo at all.
    existing = [{ key: 'about.hero.heading', value: 'Untouched' }];
    upsertFails = true;
    const { savePageCopy } = await load();
    expect((await savePageCopy('about', { 'about.hero.heading': 'Attempted' })).ok).toBe(false);
    expect(revisionInsert).not.toHaveBeenCalled();
  });

  it('records nothing for a field that was saved without being changed', async () => {
    existing = [{ key: 'about.hero.heading', value: 'The same' }];
    const { savePageCopy } = await load();
    await savePageCopy('about', { 'about.hero.heading': 'The same' });
    expect(revisionInsert, 'undo would step over a change that never happened').not.toHaveBeenCalled();
  });

  it('puts the value back, then forgets it, so undoing twice goes further back', async () => {
    newestRevision = { id: 42, value: 'The older wording' };
    const { undoCopy } = await load();
    expect(await undoCopy('about', 'about.hero.heading')).toEqual({ ok: true });

    const [row] = upsert.mock.calls[0] as unknown as [{ value: string }];
    expect(row.value).toBe('The older wording');
    expect(revisionDelete, 'the revision must be popped or undo repeats itself').toHaveBeenCalled();
  });

  it('keeps the revision when putting the value back failed', async () => {
    // Deleting first would lose the only copy of it.
    newestRevision = { id: 42, value: 'The only copy of this' };
    upsertFails = true;
    const { undoCopy } = await load();
    expect((await undoCopy('about', 'about.hero.heading')).ok).toBe(false);
    expect(revisionDelete).not.toHaveBeenCalled();
  });

  it('says so plainly when there is nothing to undo', async () => {
    newestRevision = null;
    const { undoCopy } = await load();
    expect(await undoCopy('about', 'about.hero.heading')).toEqual({ ok: false, error: 'There is nothing to undo here.' });
  });

  it('refuses a visitor, and a key the page does not read', async () => {
    newestRevision = { id: 1, value: 'x' };
    admin = false;
    const { undoCopy } = await load();
    expect((await undoCopy('about', 'about.hero.heading')).ok).toBe(false);
    admin = true;
    const fresh = await load();
    expect((await fresh.undoCopy('about', 'made.up.key')).ok).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });
});
