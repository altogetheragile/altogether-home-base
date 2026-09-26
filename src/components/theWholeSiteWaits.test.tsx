import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotReadyYet } from './NotReadyYet';

// The Site learned to show a holding page while a site is being built. This app did not, so it
// carried on serving its tools and games to anybody who knew a URL while the front door said the
// site was not ready. A holding page covering one of two apps is not a holding page.

const settings = vi.hoisted(() => ({ value: {} as Record<string, unknown>, loading: false }));
const role = vi.hoisted(() => ({ value: null as string | null, loading: false }));

vi.mock('@/hooks/useSiteSettings', () => ({
  useSiteSettings: () => ({ settings: settings.value, isLoading: settings.loading }),
}));
vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => ({ data: role.value, isLoading: role.loading }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ in: async () => ({ data: [] }) }) }) }) },
}));

const show = (at = '/flow-game') =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[at]}>
        <NotReadyYet><p>the real app</p></NotReadyYet>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('the whole site waits, not half of it', () => {
  beforeEach(() => {
    settings.value = { under_construction: true, company_name: 'Stream Strategy', brand: {} };
    settings.loading = false;
    role.value = null;
    role.loading = false;
  });

  it('holds a visitor at the door, on a route this app serves', () => {
    // /flow-game was reachable with the switch on, which is the defect.
    show();
    expect(screen.queryByText('the real app')).toBeNull();
    expect(screen.getByRole('heading')).toBeTruthy();
  });

  it('lets an administrator through, as the Site does', () => {
    role.value = 'admin';
    show();
    expect(screen.getByText('the real app')).toBeTruthy();
  });

  it('leaves the site alone when the switch is off', () => {
    settings.value = { under_construction: false };
    show();
    expect(screen.getByText('the real app')).toBeTruthy();
  });

  it('keeps signing in open, or nobody can ever turn it off', () => {
    // An administrator who cannot reach /auth cannot become an administrator here.
    show('/auth');
    expect(screen.getByText('the real app')).toBeTruthy();
    show('/auth/reset');
    expect(screen.getAllByText('the real app').length).toBeGreaterThan(0);
  });

  it('decides nothing until both answers are in', () => {
    // Rendering the app first and correcting it a moment later shows a visitor exactly what the
    // switch is meant to hide; rendering the holding page first flashes it on every other site.
    settings.loading = true;
    const { container } = show();
    expect(container.textContent).toBe('');
  });

  it('is wrapped around every route this app has', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    const inside = app.slice(app.indexOf('<NotReadyYet>'), app.indexOf('</NotReadyYet>'));
    for (const routes of ['PublicRoutes', 'ProtectedUserRoutes', 'AdminRoutes', 'DynamicRoutes', 'FallbackRoutes']) {
      expect(inside, `${routes} is outside the gate`).toContain(routes);
    }
  });
});
