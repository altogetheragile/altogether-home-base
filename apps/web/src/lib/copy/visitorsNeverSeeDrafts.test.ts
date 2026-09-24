import { describe, it, expect, vi, beforeEach } from 'vitest';

// The one promise drafting makes: nothing unpublished reaches anybody who is not the admin
// looking at it on purpose. Two conditions have to hold together, so both are checked apart.

let previewing = false;
let admin = false;

vi.mock('next/headers', () => ({ draftMode: async () => ({ isEnabled: previewing }) }));
vi.mock('@/lib/auth', () => ({ isAdmin: async () => admin }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => ({
      select: () => ({
        eq: async () =>
          table === 'site_copy_drafts'
            ? { data: [{ key: 'about.hero.heading', value: 'HALF WRITTEN' }] }
            : { data: [{ key: 'about.hero.heading', value: 'Published words' }] },
      }),
    }),
  }),
}));

const headingOn = async (page = 'about') => {
  vi.resetModules();
  const { getCopy } = await import('./index');
  return (await getCopy(page))('about.hero.heading');
};

beforeEach(() => {
  previewing = false;
  admin = false;
});

describe('a page asked for its words', () => {
  it('gives a visitor the published ones', async () => {
    expect(await headingOn()).toBe('Published words');
  });

  it('gives an admin the published ones too, until they ask to preview', async () => {
    // Being an admin is not the same as wanting to look at drafts. An admin reading their own
    // site should see what everybody else sees.
    admin = true;
    expect(await headingOn()).toBe('Published words');
  });

  it('gives drafts to an admin who is previewing', async () => {
    admin = true;
    previewing = true;
    expect(await headingOn()).toBe('HALF WRITTEN');
  });

  it('gives nothing unpublished to a visitor holding a draft cookie', async () => {
    // The case that matters. A cookie can be copied out of one browser and pasted into another,
    // or kept by somebody whose admin role was removed since. The role is checked on every
    // render, not once when the cookie was issued.
    previewing = true;
    admin = false;
    expect(await headingOn(), 'an unpublished draft was served to a visitor').toBe('Published words');
  });
});
