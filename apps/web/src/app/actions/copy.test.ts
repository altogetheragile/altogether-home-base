import { describe, it, expect, vi, beforeEach } from 'vitest';

// A Server Action is a public endpoint. It is reachable by anyone who can read the page's
// JavaScript, whether or not the component that calls it was ever rendered for them. These cover
// what it does when the caller is not who the page assumed.

const upsert = vi.fn(async () => ({ error: null }));
const del = vi.fn(async () => ({ error: null }));
let admin = true;

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth', () => ({
  isAdmin: async () => admin,
  getCurrentUser: async () => ({ id: 'someone' }),
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({ eq: async () => ({ data: [{ key: 'about.hero.heading', value: 'Her words' }] }) }),
      upsert: (rows: unknown, opts: unknown) => upsert(rows as never, opts as never),
      delete: () => ({ eq: () => ({ eq: () => del() }) }),
    }),
  }),
}));

const load = async () => await import('./copy');

beforeEach(() => {
  admin = true;
  upsert.mockClear();
  del.mockClear();
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
