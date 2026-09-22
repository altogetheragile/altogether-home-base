import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminCopy from './AdminCopy';
import type { CopyRow } from '@/hooks/useSiteCopy';

const mutate = vi.fn();
const query = { data: [] as CopyRow[], isLoading: false, error: null as Error | null };

vi.mock('@/hooks/useSiteCopy', () => ({
  useSiteCopy: () => query,
  useUpdateCopy: () => ({ mutate, isPending: false }),
}));

const row = (over: Partial<CopyRow> = {}): CopyRow => ({
  key: 'home.hero.eyebrow', page: 'home', value: 'Co-author of AgilePM3 v2 and AgileBA v3',
  label: 'Hero eyebrow', hint: 'The credential line above the heading', sort: 0, ...over,
});

const show = () => render(<MemoryRouter><AdminCopy /></MemoryRouter>);

beforeEach(() => { mutate.mockClear(); cleanup(); query.data = []; query.error = null; });

describe('the site copy editor', () => {
  it('captions each string with where it lives, not just its id', () => {
    query.data = [row()];
    show();
    expect(screen.getByText('Hero eyebrow')).toBeTruthy();
    expect(screen.getByText('The credential line above the heading')).toBeTruthy();
    expect(screen.getByText('home.hero.eyebrow')).toBeTruthy();
  });

  it('saves only what changed, and only once it has', () => {
    query.data = [row()];
    show();
    expect(screen.queryByRole('button', { name: /save/i })).toBeNull();

    fireEvent.change(screen.getByLabelText('Hero eyebrow'), { target: { value: 'Co-author of AgilePM3' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(mutate).toHaveBeenCalledWith({ key: 'home.hero.eyebrow', value: 'Co-author of AgilePM3' });
  });

  it('puts a draft back without saving it', () => {
    query.data = [row()];
    show();
    const input = screen.getByLabelText('Hero eyebrow') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Something else' } });
    fireEvent.click(screen.getByRole('button', { name: /undo/i }));

    expect(input.value).toBe('Co-author of AgilePM3 v2 and AgileBA v3');
    expect(mutate).not.toHaveBeenCalled();
  });

  // A heading split over two lines is the only place the wording carries layout, so the editor
  // has to say so rather than let someone flatten it by accident.
  it('explains the line break on a string that has one', () => {
    query.data = [row({ key: 'home.hero.heading', label: 'Hero heading', value: 'Practical agile training\nand coaching.' })];
    show();
    expect(screen.getByText(/Each line becomes its own line/)).toBeTruthy();
  });

  it('says where to look when the table is not there yet', () => {
    query.error = new Error('relation "public.site_copy" does not exist');
    show();
    expect(screen.getByText(/docs\/SITE_COPY.md/)).toBeTruthy();
    expect(screen.getByText(/shipped wording until then/)).toBeTruthy();
  });
});
