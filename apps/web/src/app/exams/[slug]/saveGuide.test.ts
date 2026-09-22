import { describe, it, expect, vi, beforeEach } from 'vitest';

// A Server Action is a public endpoint. The page only renders the editor for an admin, but that
// happened in a different request and proves nothing about this one. So the interesting cases here
// are the ones where the caller is not who the page thought they were.

const update = vi.fn(() => ({ eq: async () => ({ error: null }) }));
const admin = { value: true };

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth', () => ({ isAdmin: async () => admin.value }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ from: () => ({ update }) }),
}));

const { saveGuide } = await import('./actions');

beforeEach(() => {
  update.mockClear();
  update.mockImplementation(() => ({ eq: async () => ({ error: null }) }));
  admin.value = true;
});

describe('saving a guide', () => {
  it('refuses anyone who is not an admin, and writes nothing', async () => {
    admin.value = false;
    await expect(saveGuide('e1', 'Hello')).resolves.toEqual({ ok: false, error: 'Not allowed.' });
    expect(update).not.toHaveBeenCalled();
  });

  it('writes the guide for an admin', async () => {
    await expect(saveGuide('e1', '## A heading\n\nSome prose.')).resolves.toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ guide: '## A heading\n\nSome prose.' });
  });

  it('stores an emptied guide as nothing, not as an empty string', async () => {
    // The page hides the whole section on null; on '' it would render an empty bordered block.
    await saveGuide('e1', '   \n  ');
    expect(update).toHaveBeenCalledWith({ guide: null });
  });

  it('refuses something far longer than a guide', async () => {
    const result = await saveGuide('e1', 'x'.repeat(60_001));
    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it('hands back what the database said rather than claiming success', async () => {
    update.mockImplementation(() => ({ eq: async () => ({ error: { message: 'new row violates row-level security policy' } }) }));
    await expect(saveGuide('e1', 'Hello')).resolves.toEqual({
      ok: false,
      error: 'new row violates row-level security policy',
    });
  });
});
