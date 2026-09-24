import { describe, it, expect, vi, beforeEach } from 'vitest';

// This address is public. Anyone can request it, signed in or not, and what it hands out is a
// cookie that makes the site render unpublished work. Both of the things that protects are here.

let admin = true;
const enable = vi.fn();
const disable = vi.fn();

vi.mock('next/headers', () => ({
  draftMode: async () => ({ isEnabled: false, enable, disable }),
}));
vi.mock('@/lib/auth', () => ({ isAdmin: async () => admin }));

beforeEach(() => {
  admin = true;
  enable.mockClear();
  disable.mockClear();
});

const get = async (url: string) => {
  const { GET } = await import('./route');
  const { NextRequest } = await import('next/server');
  return GET(new NextRequest(new Request(url)));
};

describe('who may turn the preview on', () => {
  it('gives an admin the draft cookie', async () => {
    const response = await get('https://example.test/api/preview?on=1&back=%2Fabout');
    expect(enable).toHaveBeenCalled();
    expect(response.headers.get('location')).toBe('https://example.test/about');
  });

  it('gives a visitor nothing, and says nothing about why', async () => {
    // Not an error page: somebody poking at this address learns only that it goes somewhere
    // ordinary. The drafts table refuses them separately, so this is the outer of two locks.
    admin = false;
    const response = await get('https://example.test/api/preview?on=1&back=%2Fabout');
    expect(enable, 'a visitor was handed the draft cookie').not.toHaveBeenCalled();
    expect(response.headers.get('location')).toBe('https://example.test/about');
  });

  it('turns it off again when asked', async () => {
    await get('https://example.test/api/preview?on=0&back=%2F');
    expect(disable).toHaveBeenCalled();
  });
});

describe('where it agrees to send you afterwards', () => {
  it('refuses anywhere that is not this site', async () => {
    // An open redirect on a public address: "back" is whatever the URL says, and a link that
    // goes through your domain on its way to somebody else's is the shape phishing wants.
    const { safeBack } = await import('./safeBack');
    expect(safeBack('https://evil.example/steal')).toBe('/');
    // Protocol-relative, which a browser reads as another origin although it starts with a slash.
    expect(safeBack('//evil.example/steal')).toBe('/');
    expect(safeBack(null)).toBe('/');
    expect(safeBack('/about')).toBe('/about');
  });
});
