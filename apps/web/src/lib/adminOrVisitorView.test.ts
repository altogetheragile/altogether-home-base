import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// "Can we have a toggle as an Admin to switch between Admin and visitor views?" An admin saw pens,
// outlines, switched-off pages and drafts, and had no way to see what anybody else would see
// without signing out. The switch is a cookie that takes the admin view away and nothing else.

let role = 'user';
let cookie: string | undefined;

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => (name === 'aa-visitor-view' && cookie !== undefined ? { value: cookie } : undefined) }),
}));
vi.mock('next/navigation', () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock('./supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: role === 'nobody' ? null : { id: 'u1' } }, error: null }) },
    from: () => ({ select: () => ({ eq: async () => ({ data: [{ role }] }) }) }),
  }),
}));

const ask = async () => {
  vi.resetModules();
  const auth = await import('./auth');
  return { shows: await auth.showsAdminView(), may: await auth.isAdmin() };
};

beforeEach(() => {
  role = 'user';
  cookie = undefined;
});

describe('admin view or visitor view', () => {
  it('shows an admin the admin view until they ask otherwise', async () => {
    role = 'admin';
    expect(await ask()).toEqual({ shows: true, may: true });
  });

  it('shows an admin who asked the visitor’s site, and leaves them every permission', async () => {
    role = 'admin';
    cookie = '1';
    // Still an admin: they can switch back, and anything they save still saves.
    expect(await ask()).toEqual({ shows: false, may: true });
  });

  it('gives nobody else anything for setting the cookie by hand', async () => {
    cookie = '1';
    expect(await ask()).toEqual({ shows: false, may: false });
    cookie = '0';
    expect(await ask()).toEqual({ shows: false, may: false });
  });
});

// The split only holds if each side keeps asking the right question. Pages ask what to show;
// actions and admin-only pages ask what is allowed. An action asking `showsAdminView` would refuse
// to save for an admin in the visitor's view; a page asking `isAdmin` would leave its pens on.
const SRC = 'src';
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return files(full);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });

describe('who asks which', () => {
  const all = files(SRC).map((f) => ({ f, text: readFileSync(f, 'utf8') }));

  it('every action and admin-only page checks the role, not the view', () => {
    const wrong = all.filter(({ f, text }) =>
      (/['"]use server['"]/.test(text) || f.includes('/api/') || /\/(setup|sites)\/page\.tsx$/.test(f)) &&
      text.includes('showsAdminView'));
    expect(wrong.map((w) => w.f)).toEqual([]);
  });

  it('no public page decides what it shows from the role', () => {
    const wrong = all.filter(({ f, text }) =>
      /\/page\.tsx$/.test(f) && !/\/(setup|sites)\/page\.tsx$/.test(f) && /\bisAdmin\(\)/.test(text));
    expect(wrong.map((w) => w.f)).toEqual([]);
  });

  it('the layout offers the switch to an admin in both views', () => {
    const layout = readFileSync(join(SRC, 'app/layout.tsx'), 'utf8');
    expect(layout).toMatch(/signedInAsAdmin && <ViewSwitch asVisitor=\{!admin\} \/>/);
    expect(layout).toMatch(/showsAdminView\(\)/);
  });

  it('takes an admin past the holding page in both views', () => {
    // The visitor's view first showed the holding page, which is what visitors get today and the
    // one thing an admin never needs shown: "A visitor view that doesn't bypass the under
    // construction view is pointless". It is for seeing the site visitors will get.
    const layout = readFileSync(join(SRC, 'app/layout.tsx'), 'utf8');
    expect(layout).toMatch(/const holding = !!settings\.under_construction && !signedInAsAdmin;/);
  });
});
