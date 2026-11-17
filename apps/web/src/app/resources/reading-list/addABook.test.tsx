import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
const addBook = vi.fn(async () => ({ ok: true as const, id: 'new' }));
vi.mock('@/app/actions/readingList', () => ({ addBook }));
const lookUpAmazonLink = vi.fn();
vi.mock('./amazonLookup', () => ({ lookUpAmazonLink }));

const { AddBookPanel } = await import('./AddBookPanel');

// "Add a book" on the live page: paste an Amazon link, Fill in, choose a topic, Add. Nothing is
// saved until Add, and what the lookup found can be changed first.

const topics = [{ id: '11111111-1111-1111-1111-111111111111', name: 'Scrum' }];
const COVER = 'https://x.supabase.co/storage/v1/object/public/assets/reading-covers/ol-1.jpg';

beforeEach(() => { refresh.mockClear(); addBook.mockClear(); lookUpAmazonLink.mockReset(); });

const openAndFill = async (found: object) => {
  lookUpAmazonLink.mockResolvedValueOnce(found);
  render(<AddBookPanel topics={topics} />);
  fireEvent.click(screen.getByRole('button', { name: /Add a book/ }));
  fireEvent.change(screen.getByLabelText('Amazon link'), { target: { value: 'https://www.amazon.co.uk/Scrum-Mastery/dp/0957587406' } });
  fireEvent.click(screen.getByRole('button', { name: /Fill in/ }));
  await waitFor(() => expect(lookUpAmazonLink).toHaveBeenCalled());
};

describe('adding a book from the page', () => {
  it('fills the form from the link, and adds it with the topic chosen', async () => {
    await openAndFill({ asin: '0957587406', title: 'Scrum Mastery', author: 'Geoff Watts', cover_url: COVER, matchedBy: 'isbn', note: 'Found by its ISBN.' });
    await waitFor(() => expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Scrum Mastery'));
    expect((screen.getByLabelText('Author') as HTMLInputElement).value).toBe('Geoff Watts');
    expect(screen.getByAltText(/Cover found/)).toBeTruthy();

    const add = screen.getByRole('button', { name: /Add to the list/ });
    expect((add as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Topic'), { target: { value: topics[0].id } });
    fireEvent.click(add);
    await waitFor(() => expect(addBook).toHaveBeenCalledWith({
      title: 'Scrum Mastery', author: 'Geoff Watts', category_id: topics[0].id, asin: '0957587406', cover_url: COVER,
    }));
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toMatch(/Scrum Mastery.*on the list/);
  });

  it('asks for the authors to be checked when the lookup found several', async () => {
    await openAndFill({ asin: '0957587406', title: 'Scrum Mastery', author: 'Geoff Watts, Rebecca Traeger', cover_url: null, matchedBy: 'isbn', note: 'Found by its ISBN.' });
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/Check the authors/));
  });

  it('says why when the lookup fails, and keeps what was typed', async () => {
    lookUpAmazonLink.mockRejectedValueOnce(new Error('That is not an Amazon link.'));
    render(<AddBookPanel topics={topics} />);
    fireEvent.click(screen.getByRole('button', { name: /Add a book/ }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'My Book' } });
    fireEvent.change(screen.getByLabelText('Amazon link'), { target: { value: 'https://example.com/x' } });
    fireEvent.click(screen.getByRole('button', { name: /Fill in/ }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/not an Amazon link/));
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('My Book');
  });

  it('does not refresh the page when the save is refused', async () => {
    addBook.mockResolvedValueOnce({ ok: false, error: 'That book is already on the list.' } as never);
    await openAndFill({ asin: null, title: 'Scrum Mastery', author: 'Geoff Watts', cover_url: null, matchedBy: 'title', note: 'Found.' });
    fireEvent.change(screen.getByLabelText('Topic'), { target: { value: topics[0].id } });
    fireEvent.click(screen.getByRole('button', { name: /Add to the list/ }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/already on the list/));
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe('the addBook action', () => {
  const action = readFileSync(resolve(__dirname, '../../actions/readingList.ts'), 'utf8');
  const add = action.slice(action.indexOf('export async function addBook'));

  it('re-checks the admin, and accepts a cover only from the covers folder', () => {
    expect(add).toMatch(/if \(!\(await isAdmin\(\)\)\) return \{ ok: false/);
    expect(add).toMatch(/cover\.startsWith\(folder\)/);
  });

  it('puts the new book at the end of its topic, shown', () => {
    expect(add).toMatch(/is_visible: true, sort_order: \(last\?\.sort_order \?\? 0\) \+ 10/);
  });
});
