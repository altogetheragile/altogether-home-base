import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';

const uploadCover = vi.fn(async () => 'https://example.supabase.co/storage/v1/object/public/assets/reading-covers/b-1.jpg');
const setBookCover = vi.fn(async () => ({ ok: true as const }));
vi.mock('./coverUpload', async (orig) => ({ ...(await orig<typeof import('./coverUpload')>()), uploadCover }));
vi.mock('@/app/actions/readingList', () => ({ setBookFlags: vi.fn(), setBookCover }));

const { ReadingListBrowser } = await import('./ReadingListBrowser');
const { centreCrop, COVER_W, COVER_H } = await import('./coverUpload');

// An admin can put a cover on a book from the page itself. A visitor gets no such button, and the
// server checks the address it is given rather than trusting the browser.

const shelves = [{
  category: { id: 'c1', name: 'Scrum', slug: 'scrum', description: null },
  books: [{ id: 'b', title: 'Scrum Mastery', author: 'Geoff Watts', blurb: null, featured: false, href: '#', cover: null }],
}];
const words = {
  all: 'All', reset: 'Show Every Book', filterLabel: 'Topic', searchLabel: 'Search', count: '{shown} of {total}',
  empty: 'None', button: 'View on Amazon', favourites: 'Our Favourites',
};

describe('cropping an uploaded picture', () => {
  it('takes the largest book-shaped rectangle from the middle', () => {
    expect(COVER_W / COVER_H).toBeCloseTo(2 / 3);
    // Too wide: trims the sides.
    expect(centreCrop(1200, 900)).toEqual({ sx: 300, sy: 0, sw: 600, sh: 900 });
    // Too tall: trims top and bottom.
    expect(centreCrop(600, 1200)).toEqual({ sx: 0, sy: 150, sw: 600, sh: 900 });
    // Already a cover: untouched.
    expect(centreCrop(400, 600)).toEqual({ sx: 0, sy: 0, sw: 400, sh: 600 });
  });
});

describe('the upload button', () => {
  it('is not there for a visitor', () => {
    render(<ReadingListBrowser shelves={shelves} initialCategory="" words={words} />);
    expect(screen.queryByText(/Upload a cover/)).toBeNull();
  });

  it('uploads, saves, and shows the cover on the tile', async () => {
    render(<ReadingListBrowser shelves={shelves} initialCategory="" words={words} admin />);
    const tile = screen.getByRole('heading', { name: 'Scrum Mastery' }).closest('li')!;
    const input = tile.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'cover.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(within(tile).getByAltText('Cover of Scrum Mastery')).toBeTruthy());
    expect(uploadCover).toHaveBeenCalledWith('b', file);
    expect(setBookCover).toHaveBeenCalledWith('b', expect.stringContaining('/reading-covers/'));
    expect(within(tile).getByText(/Replace the cover/)).toBeTruthy();
  });

  it('leaves the tile alone and says so when the save is refused', async () => {
    setBookCover.mockResolvedValueOnce({ ok: false, error: 'Not allowed.' } as never);
    render(<ReadingListBrowser shelves={shelves} initialCategory="" words={words} admin />);
    const tile = screen.getByRole('heading', { name: 'Scrum Mastery' }).closest('li')!;
    fireEvent.change(tile.querySelector('input[type="file"]')!, { target: { files: [new File(['x'], 'c.png', { type: 'image/png' })] } });
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/Not allowed/));
    expect(within(tile).queryByAltText('Cover of Scrum Mastery')).toBeNull();
  });
});

describe('the server action', () => {
  const action = readFileSync(resolve(__dirname, '../../actions/readingList.ts'), 'utf8');
  const setCover = action.slice(action.indexOf('export async function setBookCover'));

  it('re-checks the admin and accepts only addresses in the covers folder', () => {
    expect(setCover).toMatch(/if \(!\(await isAdmin\(\)\)\) return \{ ok: false/);
    expect(setCover).toMatch(/url\.startsWith\(folder\)/);
    expect(action).toMatch(/\/storage\/v1\/object\/public\/assets\/reading-covers\//);
  });

  it('marks the cover as chosen by hand, so the fetch script leaves it alone', () => {
    expect(setCover).toMatch(/cover_source: 'upload'/);
  });

  it('does not export the folder helper, which would make it callable from the browser', () => {
    expect(action).not.toMatch(/export (async )?function coverFolder/);
  });
});
