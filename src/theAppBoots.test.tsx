import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '@/App';

// A provider mounted in the wrong place threw while rendering, React unmounted the tree, and
// every page this app serves went white. It passed tsc, eslint, 1960 unit tests, both builds and
// the route guard, because nothing here had ever rendered the app and the guard only asks the
// Site for its pages.
//
// This renders the real thing - the real providers, in the real order, from the real App.tsx -
// and fails when it falls into the error boundary instead of booting.
//
// Two things are replaced, and only two. The toast library reaches for browser APIs jsdom does
// not have, and the analytics script has no business loading in a test. Everything between them
// is the app as it ships.
vi.mock('@vercel/analytics/react', () => ({ Analytics: () => null }));
vi.mock('@/components/ui/sonner', () => ({ Toaster: () => null }));

describe('the app boots', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders itself rather than the error boundary', async () => {
    render(<App />);
    // The boundary's own words. Seeing them means something threw on the way up, which is what
    // a white page is: React unmounting a tree it could not render.
    await waitFor(() => expect(document.body.innerHTML.length).toBeGreaterThan(0));
    expect(screen.queryByText('Something went wrong'), 'the app fell into its error boundary').toBeNull();
  });

  it('does not throw while rendering, on an app route or a site one', async () => {
    // The failure was a hook called outside its provider, which throws during render rather than
    // failing a request. It does not need the network to happen, and it happens on every route.
    for (const path of ['/', '/auth', '/dashboard']) {
      window.history.pushState({}, '', path);
      expect(() => render(<App />), `${path} threw while rendering`).not.toThrow();
      expect(screen.queryByText('Something went wrong'), `${path} fell into the error boundary`).toBeNull();
    }
  });
});
