import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { SiteSettings } from '@/lib/site-settings';

vi.mock('next/navigation', () => ({ usePathname: () => '/about' }));
vi.mock('@/app/actions/signOut', () => ({ signOut: vi.fn() }));

const { Navigation } = await import('./Navigation');
const settings = {} as SiteSettings;

// The header was the only thing the presence cookie was ever used for, and all it could say was
// that somebody was signed in. Now it is read from the real session, so it can say who.

describe('the header, signed out', () => {
  it('offers Sign In and greets nobody', () => {
    render(<Navigation settings={settings} />);
    expect(screen.getAllByRole('link', { name: 'Sign In' }).length).toBeGreaterThan(0);
    expect(screen.queryByTestId('nav-greeting')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).toBeNull();
  });

  it('offers no Sign Out to somebody who is not signed in', () => {
    render(<Navigation settings={settings} />);
    expect(screen.queryByRole('button', { name: 'Sign Out' })).toBeNull();
  });
});

describe('signing out', () => {
  // It was only in the App's dashboard menu. Signed in as somebody else to try their site, there
  // was no way out from the site itself.
  it('is in the header for somebody signed in', () => {
    render(<Navigation settings={settings} signedIn name="Fiona" />);
    expect(screen.getAllByRole('button', { name: 'Sign Out' }).length).toBeGreaterThan(0);
  });
});

describe('the header, signed in', () => {
  it('offers the dashboard and greets them by name', () => {
    render(<Navigation settings={settings} signedIn name="Alun" />);
    expect(screen.getAllByRole('link', { name: 'Dashboard' }).length).toBeGreaterThan(0);
    expect(screen.getByTestId('nav-greeting')).toHaveTextContent('Hi, Alun');
    expect(screen.queryByRole('link', { name: 'Sign In' })).toBeNull();
  });

  it('still offers the dashboard when we hold no name for them', () => {
    render(<Navigation settings={settings} signedIn />);
    expect(screen.getAllByRole('link', { name: 'Dashboard' }).length).toBeGreaterThan(0);
    expect(screen.queryByTestId('nav-greeting')).toBeNull();
  });

  it('sends them to the App with a real navigation, since this app does not serve /dashboard', () => {
    render(<Navigation settings={settings} signedIn name="Alun" />);
    const cta = screen.getAllByRole('link', { name: 'Dashboard' })[0];
    expect(cta.getAttribute('href')).toBe('/dashboard');
  });
});
