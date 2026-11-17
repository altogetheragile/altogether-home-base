import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';

const setBookFlags = vi.fn(async () => ({ ok: true as const }));
vi.mock('@/app/actions/readingList', () => ({ setBookFlags, setBookCover: vi.fn() }));

const { ReadingListBrowser } = await import('./ReadingListBrowser');

// A favourite is collected at the top and also stays in its own topic, so somebody reading one
// topic still sees its best books there. One book, two tiles, one state.

const book = (id: string, title: string, featured = false) =>
  ({ id, title, author: 'Someone', blurb: null, featured, href: 'https://www.amazon.co.uk/s?k=x' });
const shelves = [
  { category: { id: 'c1', name: 'Scrum', slug: 'scrum', description: null }, books: [book('a', 'Scrum Mastery', true), book('b', 'Scrum Insights')] },
  { category: { id: 'c2', name: 'Coaching', slug: 'coaching', description: null }, books: [book('c', 'Coaching Agile Teams')] },
];
const words = {
  all: 'All', reset: 'Show Every Book', filterLabel: 'Topic', searchLabel: 'Search by title or author',
  count: 'Showing {shown} of {total} books', empty: 'None', button: 'View on Amazon', favourites: 'Our Favourites',
};
const section = (heading: string) => screen.getByRole('heading', { name: heading }).closest('section')!;

describe('favourites', () => {
  it('appear at the top and in their own topic, and are counted once', () => {
    render(<ReadingListBrowser shelves={shelves} initialCategory="" words={words} />);
    expect(within(section('Our Favourites')).getByText('Scrum Mastery')).toBeTruthy();
    expect(within(section('Scrum')).getByText('Scrum Mastery')).toBeTruthy();
    expect(screen.getByText('Showing 3 of 3 books')).toBeTruthy();
  });

  it('change in both places when hearted from either', async () => {
    render(<ReadingListBrowser shelves={shelves} initialCategory="" words={words} admin />);
    fireEvent.click(within(section('Coaching')).getByRole('button', { name: 'Favourite: Coaching Agile Teams' }));
    await waitFor(() => expect(within(section('Our Favourites')).getByText('Coaching Agile Teams')).toBeTruthy());
    expect(within(section('Coaching')).getByText('Coaching Agile Teams')).toBeTruthy();
    const hearts = screen.getAllByRole('button', { name: 'Favourite: Coaching Agile Teams' });
    expect(hearts.map((h) => h.getAttribute('aria-pressed'))).toEqual(['true', 'true']);
    expect(setBookFlags).toHaveBeenCalledWith('c', { is_featured: true });
  });
});
