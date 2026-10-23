import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// /auth is this app's page, and its menu said Coaching, Sign In and Dashboard on a site that had
// renamed them Services and My Dashboard. The page you had just left, served by the Site, said
// what the site had written. One menu, two names for the same link.

const saved = vi.hoisted(() => ({ rows: [] as { key: string; value: string }[] }));
const settings = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        eq: async () => ({ data: table === 'site_copy' ? saved.rows : [] }),
      }),
    }),
  },
}));
vi.mock('@/hooks/useSiteSettings', () => ({ useSiteSettings: () => ({ settings: settings.value, isLoading: false }) }));
vi.mock('@/hooks/useUserRole', () => ({ useUserRole: () => ({ data: null, isLoading: false }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null, signOut: vi.fn() }) }));
vi.mock('@/components/legal/legalText', () => ({ useOwnLegal: () => ({ data: {} }) }));
vi.mock('@/components/LogoFull', () => ({ default: () => null }));

const { default: Navigation } = await import('./Navigation');
const { default: Footer } = await import('./Footer');

const show = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/auth']}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );

beforeEach(() => {
  saved.rows = [];
  settings.value = {};
});

describe('the App menu says what the site says', () => {
  it('uses the names the site gave its pages and its button', async () => {
    saved.rows = [
      { key: 'nav.coaching', value: 'Services' },
      { key: 'nav.signIn', value: 'Log In' },
      { key: 'nav.resources', value: 'Reading' },
    ];
    show(<Navigation />);
    const menu = screen.getByRole('navigation', { name: 'Main navigation' });
    await waitFor(() => expect(within(menu).getAllByText('Services').length).toBeGreaterThan(0));
    expect(within(menu).queryByText('Coaching')).toBeNull();
    expect(within(menu).getAllByText('Log In').length).toBeGreaterThan(0);
    expect(within(menu).getAllByText('Reading').length).toBeGreaterThan(0);
  });

  it('says what it always said on a site that has renamed nothing', () => {
    show(<Navigation />);
    const menu = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(menu).getAllByText('Coaching').length).toBeGreaterThan(0);
    expect(within(menu).getAllByText('Sign In').length).toBeGreaterThan(0);
  });

  it('switches pages on and off by the same defaults as the Site', () => {
    // Practice Exams was on by default here and off everywhere else.
    show(<Navigation />);
    expect(screen.queryByText('Practice Exams')).toBeNull();
  });

  it('leaves out a page the site has switched off', () => {
    settings.value = { show_events: false };
    show(<Navigation />);
    expect(screen.queryByText('Events')).toBeNull();
  });
});

describe('the App footer says what the site says', () => {
  it('lists the pages under the site’s names, and not the ones it switched off', async () => {
    saved.rows = [{ key: 'nav.coaching', value: 'Services' }, { key: 'footer.quicklinks', value: 'Find Your Way' }];
    settings.value = { show_events: false };
    show(<Footer />);
    await waitFor(() => expect(screen.getByText('Services')).toBeTruthy());
    expect(screen.getByText('Find Your Way')).toBeTruthy();
    expect(screen.queryByText('Coaching')).toBeNull();
    expect(screen.queryByText('Events')).toBeNull();
  });
});
