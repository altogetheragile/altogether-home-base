import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SidebarProvider, SidebarMenu } from '@/components/ui/sidebar';
import { SidebarNavItem } from './AdminLayout';
import { navigation } from './adminNavigation';

// "Can setup be a link under admin?" The wizard was reachable only from the editor's drawer, so an
// admin in Admin had to go back to the site and open the drawer to find it.
//
// /setup belongs to the Site. A router link would have this app answer it instead, with nothing,
// so the link has to leave the app.

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

const setup = () => navigation.flatMap((g) => g.items).find((i) => i.href === '/setup');

describe('setup under admin', () => {
  it('is in the sidebar', () => {
    expect(setup(), 'Admin has no link to setup').toBeTruthy();
  });

  it('leaves the app for the Site rather than being answered here', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <SidebarProvider>
          <Routes>
            <Route path="/admin" element={<SidebarMenu><SidebarNavItem item={setup()!} pathname="/admin" /></SidebarMenu>} />
            <Route path="/setup" element={<p>this app answered /setup</p>} />
          </Routes>
        </SidebarProvider>
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /Site Setup/ });
    expect(link.getAttribute('href')).toBe('/setup');
    await userEvent.setup().click(link);
    expect(screen.queryByText('this app answered /setup'), 'the router caught a Site URL').toBeNull();
  });
});
