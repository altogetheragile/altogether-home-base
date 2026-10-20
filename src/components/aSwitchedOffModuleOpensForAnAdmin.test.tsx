import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SiteSettingsRouteGuard } from './SiteSettingsRouteGuard';

// AI Tools is switched off because it is not finished, and an admin trying the unfinished tools
// from an initiative got "Page Not Found" at every step: the way past the switch was ?preview=true
// on the address, and no link carried it. The public must still see nothing.

const settings = vi.hoisted(() => ({ value: {} as Record<string, unknown>, loading: false }));
const role = vi.hoisted(() => ({ value: null as string | null, loading: false }));
const auth = vi.hoisted(() => ({ loading: false }));

vi.mock('@/hooks/useSiteSettings', () => ({
  useSiteSettings: () => ({ settings: settings.value, isLoading: settings.loading }),
}));
vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => ({ data: role.value, isLoading: role.loading }),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ loading: auth.loading }) }));
vi.mock('@/components/Navigation', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));

const show = (at = '/canvases/product-vision') =>
  render(
    <MemoryRouter initialEntries={[at]}>
      <SiteSettingsRouteGuard feature="ai_tools"><p>the canvas</p></SiteSettingsRouteGuard>
    </MemoryRouter>,
  );

describe('a switched-off module opens for an admin', () => {
  beforeEach(() => {
    settings.value = { show_ai_tools: false };
    settings.loading = false;
    role.value = null;
    role.loading = false;
    auth.loading = false;
  });

  it('is still not found for the public', () => {
    show();
    expect(screen.queryByText('the canvas')).toBeNull();
    expect(screen.getByText('Page Not Found')).toBeTruthy();
  });

  it('is still not found for a signed-in user who is not an admin', () => {
    role.value = 'user';
    show();
    expect(screen.queryByText('the canvas')).toBeNull();
  });

  it('opens for an admin from a plain link, and says it is hidden', () => {
    role.value = 'admin';
    show();
    expect(screen.getByText('the canvas')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('AI Tools is switched off');
  });

  it('waits for the role rather than flashing Page Not Found at an admin', () => {
    role.value = 'admin';
    role.loading = true;
    show();
    expect(screen.queryByText('Page Not Found')).toBeNull();
    expect(screen.queryByText('the canvas')).toBeNull();
  });

  it('carries no banner when the module is on', () => {
    settings.value = { show_ai_tools: true };
    show();
    expect(screen.getByText('the canvas')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
