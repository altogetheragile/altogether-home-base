import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditDrawer, type EditorHost } from '@altogether/ui/editor/EditDrawer';
import type { CopyField } from '@altogether/ui/editor/store';

// Grouping and search are only worth anything if they behave: a group folds away and comes back,
// a search shows what matches and nothing else, and nothing you typed can end up hidden inside a
// folded group with no sign of it.

const field = (key: string, label: string, hint = ''): CopyField =>
  ({ key, label, hint, value: '', shipped: '' });

const FIELDS: CopyField[] = [
  field('home.hero.heading', 'Hero heading', 'The big line at the top'),
  field('home.hero.intro', 'Hero intro'),
  field('home.hero.button', 'Hero button'),
  field('home.stats.items', 'Statistics'),
  field('home.founder.years', 'Years of experience'),
  field('home.founder.credentials', 'Credentials'),
  field('home.cta.heading', 'Closing heading'),
  field('home.cta.button', 'Closing button'),
  field('home.meta.description', 'Search description'),
];

const host = (): EditorHost => ({
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
});

const open = async () => {
  render(<EditDrawer host={host()} />);
  await waitFor(() => expect(screen.getByText('Hero')).toBeTruthy());
};

describe('the drawer folds and finds', () => {
  it('puts the fields under headings taken from their keys', async () => {
    await open();
    for (const name of ['Hero', 'Stats', 'Founder', 'Call to action', 'Search and sharing']) {
      expect(screen.getByText(name), `no heading for ${name}`).toBeTruthy();
    }
  });

  it('shows how many are inside a group without opening it', async () => {
    await open();
    const hero = screen.getByText('Hero').closest('button')!;
    expect(within(hero).getByText('3')).toBeTruthy();
  });

  it('folds a group away and brings it back', async () => {
    await open();
    const user = userEvent.setup();
    expect(screen.queryByLabelText('Hero heading')).toBeTruthy();
    await user.click(screen.getByText('Hero').closest('button')!);
    expect(screen.queryByLabelText('Hero heading')).toBeNull();
    await user.click(screen.getByText('Hero').closest('button')!);
    expect(screen.queryByLabelText('Hero heading')).toBeTruthy();
  });

  it('shows only what matches, and says how many that is', async () => {
    await open();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Find a field'), 'button');
    expect(screen.getByText('2 of 9')).toBeTruthy();
    expect(screen.queryByLabelText('Hero button')).toBeTruthy();
    expect(screen.queryByLabelText('Closing button')).toBeTruthy();
    expect(screen.queryByLabelText('Statistics')).toBeNull();
    // A group with nothing matching is gone, not shown empty.
    expect(screen.queryByText('Stats')).toBeNull();
  });

  it('searches the hint too, because that is the language on screen', async () => {
    await open();
    await userEvent.setup().type(screen.getByLabelText('Find a field'), 'big line');
    expect(screen.queryByLabelText('Hero heading')).toBeTruthy();
    expect(screen.getByText('1 of 9')).toBeTruthy();
  });

  it('says so plainly when nothing matches', async () => {
    await open();
    await userEvent.setup().type(screen.getByLabelText('Find a field'), 'zzzz');
    expect(screen.getByText('Nothing here matches that.')).toBeTruthy();
  });

  it('opens a folded group while searching, so a result is never hidden', async () => {
    await open();
    const user = userEvent.setup();
    await user.click(screen.getByText('Stats').closest('button')!);
    expect(screen.queryByLabelText('Statistics')).toBeNull();
    await user.type(screen.getByLabelText('Find a field'), 'statistics');
    expect(screen.queryByLabelText('Statistics')).toBeTruthy();
  });

  it('clears the search and puts everything back', async () => {
    await open();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Find a field'), 'button');
    await user.click(screen.getByLabelText('Clear'));
    expect(screen.queryByLabelText('Statistics')).toBeTruthy();
  });
});
