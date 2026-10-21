import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditDrawer, type EditorHost } from '@altogether/ui/editor/EditDrawer';
import type { CopyField } from '@altogether/ui/editor/store';

// Starter wording arrives as a draft in every box on a page. Read one at a time, so each one has
// to be takeable, changeable and throwable-away on its own, and readable in full first. The page's
// "Publish them" is still there for a page that reads well as a whole.

const LONG = 'We run small focus groups that get past the polite answer, and turn what people really think into insight a brand team can use on Monday morning.';

const FIELDS: CopyField[] = [
  { key: 'home.hero.heading', label: 'Hero heading', hint: '', value: 'Old heading', shipped: '', draft: { value: 'Find What People Really Think', at: '' } },
  { key: 'home.hero.intro', label: 'Hero intro', hint: '', value: '', shipped: '', draft: { value: LONG, at: '' } },
];

const host = () => {
  const h: EditorHost = {
    pathname: '/',
    pageForPath: () => 'home',
    alwaysOffered: [],
    openAt: 'home',
    load: vi.fn(async () => FIELDS),
    save: vi.fn(async () => ({ ok: true as const })),
    reset: vi.fn(async () => ({ ok: true as const })),
    undo: vi.fn(async () => ({ ok: true as const })),
    refresh: vi.fn(),
    upload: vi.fn(async () => 'https://example.com/x.png'),
    saveDraft: vi.fn(async () => ({ ok: true as const })),
    publishDrafts: vi.fn(async () => ({ ok: true as const })),
    discardDrafts: vi.fn(async () => ({ ok: true as const })),
  };
  return h;
};

// Two fields in one group, so the drawer shows them flat, with no heading to unfold.
const openHero = async (h: EditorHost) => {
  render(<EditDrawer host={h} />);
  await waitFor(() => expect(screen.getByLabelText('Hero heading')).toBeTruthy());
};

describe('drafts, one at a time', () => {
  it('shows the whole draft, not the first eighty characters', async () => {
    await openHero(host());
    expect(screen.getByText(LONG)).toBeTruthy();
  });

  it('puts one draft live and forgets it, leaving the others waiting', async () => {
    const h = host();
    await openHero(h);
    await userEvent.setup().click(screen.getAllByRole('button', { name: 'Use this' })[0]);
    await waitFor(() => expect(h.save).toHaveBeenCalledWith('home', { 'home.hero.heading': 'Find What People Really Think' }));
    await waitFor(() => expect(h.discardDrafts).toHaveBeenCalledWith('home', 'home.hero.heading'));
    expect(h.publishDrafts).not.toHaveBeenCalled();
  });

  it('puts a draft in the box to be changed, and saving it clears the draft it came from', async () => {
    const h = host();
    await openHero(h);
    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: 'Edit it' })[0]);
    const box = screen.getByLabelText('Hero heading') as HTMLTextAreaElement;
    expect(box.value).toBe('Find What People Really Think');
    await user.type(box, '!');
    await user.click(screen.getByRole('button', { name: /^Save 1 change/ }));
    await waitFor(() => expect(h.save).toHaveBeenCalledWith('home', { 'home.hero.heading': 'Find What People Really Think!' }));
    await waitFor(() => expect(h.discardDrafts).toHaveBeenCalledWith('home', 'home.hero.heading'));
  });

  it('throws one away without touching the site', async () => {
    const h = host();
    await openHero(h);
    await userEvent.setup().click(screen.getAllByRole('button', { name: 'Discard' }).slice(-1)[0]);
    await waitFor(() => expect(h.discardDrafts).toHaveBeenCalledWith('home', 'home.hero.intro'));
    expect(h.save).not.toHaveBeenCalled();
  });
});
