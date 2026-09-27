import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SiteIcon } from '@/components/SiteIcon';

// A component mounted outside the QueryClientProvider threw "No QueryClient set" while rendering,
// React unmounted the tree, and every page this app serves went white: /auth, /dashboard, every
// tool. It reached production because nothing here renders the app, and the route guard only
// asks the Site for its pages.
//
// So: anything that reads the site's settings has to be inside the provider, and this says so in
// the one way that cannot be satisfied by a comment.

vi.mock('@/hooks/useSiteSettings', () => ({
  useSiteSettings: () => ({ settings: { brand: { images: { favicon: 'https://cdn.example/a.png' } } } }),
}));

describe('the app renders', () => {
  beforeEach(() => {
    document.head.querySelectorAll('link[rel*="icon"]').forEach((l) => l.remove());
  });

  it('mounts the tab icon inside a query client, not beside one', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <SiteIcon />
        <p>the rest of the app</p>
      </QueryClientProvider>,
    );
    expect(screen.getByText('the rest of the app')).toBeTruthy();
    await waitFor(() =>
      expect(document.head.querySelector('link[rel="icon"]')?.getAttribute('href'))
        .toBe('https://cdn.example/a.png'));
  });

});

describe('the app tree keeps its providers in the right order', () => {
  it('has every settings reader inside the query client', async () => {
    // Source-level, because rendering the whole app in jsdom drags in routing, auth and Supabase.
    // The shape is what matters: nothing that queries may sit after </QueryClientProvider>.
    const { readFileSync } = await import('node:fs');
    const app = readFileSync('src/App.tsx', 'utf8');
    const afterProvider = app.slice(app.indexOf('</QueryClientProvider>'));
    for (const reader of ['<SiteIcon', '<NotReadyYet']) {
      expect(afterProvider, `${reader} is mounted outside the query client`).not.toContain(reader);
    }
  });
});
