import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadDrafts, saveDraft, publishDrafts, discardDrafts,
} from '@altogether/ui/editor/store';
import type { CopyRegistry } from '@altogether/ui/editor/fields';

// Saving publishes. Drafting is the other path, and the whole value of it rests on one promise:
// that nothing reaches the live site until somebody says so. These are the ways that promise
// could quietly break.
//
// Against the built package, because that is what both apps import. A draft function that works
// in source and was never rebuilt is the failure this repository has already had once.

const REGISTRY: CopyRegistry[] = [
  {
    page: 'test',
    label: 'A page',
    entries: {
      'test.heading': { value: 'As shipped', label: 'Heading', hint: '' },
      'test.body': { value: 'Also shipped', label: 'Body', hint: '' },
    },
  },
];

/** Every table this touches, and what happened to it. */
type Log = {
  drafts: { upserted: unknown[]; deleted: { page?: string; key?: string }[] };
  copy: { upserted: unknown[] };
  revisions: { inserted: unknown[] };
};

let log: Log;
/** What site_copy_drafts holds before the call under test. */
let waiting: { key: string; value: string; updated_at: string }[];
/** Set to make the write to site_copy fail, which is the case publishing must survive. */
let copyWriteFails: boolean;
/** Set to make the drafts table behave as though it does not exist. */
let draftsTableMissing: boolean;

beforeEach(() => {
  log = { drafts: { upserted: [], deleted: [] }, copy: { upserted: [] }, revisions: { inserted: [] } };
  waiting = [];
  copyWriteFails = false;
  draftsTableMissing = false;
});

/** Enough of a Supabase client for these paths, recording what each table was asked to do.
 *
 *  Hand-written rather than mocked: the point of every test here is which table was written to,
 *  and a mock that answers everything the same way cannot tell you that. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = {
  from(table: string) {
    if (table === 'site_copy_drafts') {
      if (draftsTableMissing) {
        const missing = () => { throw new Error('relation "site_copy_drafts" does not exist'); };
        return { select: missing, upsert: missing, delete: missing };
      }
      return {
        select: () => ({ eq: async () => ({ data: waiting }) }),
        upsert: async (rows: unknown) => { log.drafts.upserted.push(...(rows as unknown[])); return { error: null }; },
        delete: () => {
          const target: { page?: string; key?: string } = {};
          log.drafts.deleted.push(target);
          const chain = {
            eq(column: string, value: string) {
              if (column === 'page') target.page = value;
              if (column === 'key') target.key = value;
              return chain;
            },
            in() { return chain; },
            then: (resolve: (v: { error: null }) => void) => resolve({ error: null }),
          };
          return chain;
        },
      };
    }
    if (table === 'site_copy') {
      return {
        select: () => ({ in: async () => ({ data: [] }) }),
        upsert: async (rows: unknown) => {
          log.copy.upserted.push(...(rows as unknown[]));
          return { error: copyWriteFails ? { message: 'the write failed' } : null };
        },
      };
    }
    if (table === 'site_copy_revisions') {
      return { insert: async (rows: unknown) => { log.revisions.inserted.push(rows); return { error: null }; } };
    }
    throw new Error(`nothing should touch ${table} here`);
  },
};

describe('saving as a draft', () => {
  it('writes to the drafts and leaves the live words alone', async () => {
    // The entire promise, in one assertion.
    const result = await saveDraft(db, REGISTRY, 'test', { 'test.heading': 'Not ready' }, 'someone');

    expect(result).toEqual({ ok: true });
    expect(log.drafts.upserted).toHaveLength(1);
    expect(log.copy.upserted, 'a draft reached the live site').toEqual([]);
  });

  it('refuses a key the page does not have', async () => {
    // Otherwise it is accepted, waits, and fails at publish time, by which point more has been
    // written on top of it.
    const result = await saveDraft(db, REGISTRY, 'test', { 'test.invented': 'x' }, 'someone');
    expect(result).toEqual({ ok: false, error: 'Not part of this page: test.invented' });
    expect(log.drafts.upserted).toEqual([]);
  });
});

describe('publishing what is waiting', () => {
  it('writes the drafted value to the live words, then forgets the draft', async () => {
    waiting = [{ key: 'test.heading', value: 'Ready now', updated_at: '2026-09-24T10:00:00Z' }];

    const result = await publishDrafts(db, REGISTRY, 'test', 'someone');

    expect(result).toEqual({ ok: true });
    expect(log.copy.upserted).toHaveLength(1);
    expect((log.copy.upserted[0] as { value: string }).value).toBe('Ready now');
    expect(log.drafts.deleted, 'the draft was left behind and would publish again').toHaveLength(1);
  });

  it('records a revision, so a published draft can be undone like any other change', async () => {
    waiting = [{ key: 'test.heading', value: 'Ready now', updated_at: '2026-09-24T10:00:00Z' }];
    await publishDrafts(db, REGISTRY, 'test', 'someone');
    expect(log.revisions.inserted).toHaveLength(1);
  });

  it('keeps the draft when the write to the live words fails', async () => {
    // The one outcome with nothing to recover from: the live value is still the old one and the
    // new one has been thrown away. Clearing before checking the write is how that happens.
    waiting = [{ key: 'test.heading', value: 'Ready now', updated_at: '2026-09-24T10:00:00Z' }];
    copyWriteFails = true;

    const result = await publishDrafts(db, REGISTRY, 'test', 'someone');

    expect(result.ok).toBe(false);
    expect(log.drafts.deleted, 'the draft was discarded although publishing failed').toEqual([]);
  });

  it('says so plainly when there is nothing waiting', async () => {
    const result = await publishDrafts(db, REGISTRY, 'test', 'someone');
    expect(result).toEqual({ ok: false, error: 'There is nothing waiting to be published here.' });
    expect(log.copy.upserted).toEqual([]);
  });
});

describe('discarding', () => {
  it('touches the drafts and nothing else', async () => {
    const result = await discardDrafts(db, 'test');
    expect(result).toEqual({ ok: true });
    expect(log.drafts.deleted).toEqual([{ page: 'test' }]);
    expect(log.copy.upserted).toEqual([]);
  });

  it('can discard one field without discarding the rest', async () => {
    await discardDrafts(db, 'test', 'test.heading');
    expect(log.drafts.deleted).toEqual([{ page: 'test', key: 'test.heading' }]);
  });
});

describe('a deployment whose migration has not run', () => {
  it('loses drafting and nothing else', async () => {
    // The hazard this shape exists for. The drafts read sits outside the read that fetches the
    // published words, so a missing table cannot take the words down with it: sharing one try
    // would have made an unapplied migration look like a site that had reverted to its shipped
    // wording, everywhere at once.
    draftsTableMissing = true;
    await expect(loadDrafts(db, 'test')).resolves.toEqual({});
  });
});
