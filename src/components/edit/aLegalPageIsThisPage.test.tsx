import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditDrawer, type EditorHost } from '@altogether/ui/editor/EditDrawer';
import type { CopyField } from '@altogether/ui/editor/store';
import { legalTabFor, withLegalTabs } from './legalTab';

// Opening the editor on /privacy offered the menu and This Site, and the Privacy box was on This
// Site under a fold. "Should /privacy have a this page section in the curtain?" It should: the
// page's own words, under This Page, saved where they always were.

const SITE: CopyField[] = [
  { key: 'site.brand.name', label: 'Business name', hint: '', value: 'Stream Strategy', shipped: '', group: 'What this site is called',
    draft: { value: 'Stream Strategy Ltd', at: '' } },
  { key: 'site.legal.privacy', label: 'Privacy notice', hint: '', value: '', shipped: '', group: 'Legal pages',
    draft: { value: '## Who We Are', at: '' } },
  { key: 'site.legal.terms', label: 'Terms and conditions', hint: '', value: '', shipped: '', group: 'Legal pages' },
];

const host = (pathname: string) => {
  const store = {
    load: vi.fn(async (page: string) => (page === 'site' ? SITE : [])),
    save: vi.fn(async () => ({ ok: true as const })),
    reset: vi.fn(async () => ({ ok: true as const })),
    undo: vi.fn(async () => ({ ok: true as const })),
    saveDraft: vi.fn(async () => ({ ok: true as const })),
    publishDrafts: vi.fn(async () => ({ ok: true as const })),
    discardDrafts: vi.fn(async () => ({ ok: true as const })),
  };
  const h: EditorHost = {
    pathname,
    pageForPath: legalTabFor,
    alwaysOffered: [
      { page: 'navigation', label: 'Menu and Footer' },
      { page: 'site', label: 'This Site' },
    ],
    openAt: legalTabFor(pathname) ?? 'site',
    refresh: vi.fn(),
    upload: vi.fn(async () => ''),
    ...withLegalTabs(store),
  };
  return { h, store };
};

describe('a legal page is This Page', () => {
  it('is offered on each legal page, and nowhere else', () => {
    expect(legalTabFor('/privacy')).toBe('legal:privacy');
    expect(legalTabFor('/terms/')).toBe('legal:terms');
    expect(legalTabFor('/cookies')).toBe('legal:cookies');
    expect(legalTabFor('/about')).toBeNull();
    expect(legalTabFor('/privacy-matters')).toBeNull();
  });

  it('opens on This Page with that page’s box and no other', async () => {
    render(<EditDrawer host={host('/privacy').h} />);
    await waitFor(() => expect(screen.getByLabelText('Privacy notice')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'This Page' })).toBeTruthy();
    expect(screen.queryByLabelText('Terms and conditions')).toBeNull();
    expect(screen.queryByLabelText('Business name')).toBeNull();
  });

  it('saves where This Site saves, so the two are one value', async () => {
    const { h, store } = host('/terms');
    render(<EditDrawer host={h} />);
    const user = userEvent.setup();
    await waitFor(() => expect(screen.getByLabelText('Terms and conditions')).toBeTruthy());
    await user.type(screen.getByLabelText('Terms and conditions'), 'Bookings are final.');
    await user.click(screen.getByRole('button', { name: /^Save 1 change/ }));
    await waitFor(() => expect(store.save).toHaveBeenCalledWith('site', { 'site.legal.terms': 'Bookings are final.' }));
  });

  it('throws away its draft where This Site keeps it', async () => {
    const { h, store } = host('/privacy');
    render(<EditDrawer host={h} />);
    await waitFor(() => expect(screen.getByLabelText('Privacy notice')).toBeTruthy());
    // The box's own Discard, not the band's.
    await userEvent.setup().click(screen.getAllByRole('button', { name: 'Discard' }).slice(-1)[0]);
    await waitFor(() => expect(store.discardDrafts).toHaveBeenCalledWith('site', 'site.legal.privacy'));
  });

  it('publishes only its own box, never the rest of This Site', async () => {
    const { h, store } = host('/privacy');
    const result = await h.publishDrafts!('legal:privacy');
    expect(result.ok).toBe(true);
    expect(store.save).toHaveBeenCalledWith('site', { 'site.legal.privacy': '## Who We Are' });
    expect(store.save).toHaveBeenCalledTimes(1);
    expect(store.publishDrafts).not.toHaveBeenCalled();
    expect(store.discardDrafts).toHaveBeenCalledWith('site', 'site.legal.privacy');
  });

  it('throws away only its own box when told to throw everything away', async () => {
    const { h, store } = host('/privacy');
    await h.discardDrafts!('legal:privacy');
    expect(store.discardDrafts).toHaveBeenCalledWith('site', 'site.legal.privacy');
  });

  it('leaves This Site exactly as it was', async () => {
    const { h, store } = host('/privacy');
    expect(await h.load('site')).toHaveLength(3);
    await h.publishDrafts!('site');
    expect(store.publishDrafts).toHaveBeenCalledWith('site');
    await h.discardDrafts!('site');
    expect(store.discardDrafts).toHaveBeenCalledWith('site', undefined);
  });

  it('offers no This Page anywhere else', async () => {
    render(<EditDrawer host={host('/about').h} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'This Site' })).toBeTruthy());
    expect(screen.queryByRole('button', { name: 'This Page' })).toBeNull();
  });
});
