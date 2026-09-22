import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { ExamPlayer, type ExamForPlayer, type Sibling } from './ExamPlayer';

// An exam page used to be a dead end. The only link off it was back to /exams, so someone who had
// just been marked on Paper 1 had to go through the hub to reach Paper 2.
//
// What this is NOT: a fix for discovery. Every paper is already linked from /exams and listed in
// the sitemap, and agilepm-practitioner-paper-2 has still never been crawled. Google knows the URL
// and is choosing not to spend budget on it. These links are for the person already on the page.

const BANK = Array.from({ length: 2 }, (_, i) => ({
  id: `q${i + 1}`, area: 'A', question_number: i + 1, part: null, item_type: null,
  part_instruction: null, question_text: `Question ${i + 1}`,
  option_a: 'One', option_b: 'Two', option_c: 'Three', option_d: 'Four',
  option_e: '', option_f: '', option_g: '', option_h: '',
  correct_answer: 'A', reference: null, sort_order: i + 1,
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: (_c: string, opts?: { head?: boolean }) => (opts?.head
        ? { eq: () => ({ eq: () => Promise.resolve({ count: BANK.length }) }) }
        : { eq: () => ({ eq: () => ({ order: () => Promise.resolve({ data: BANK }) }) }) }),
      insert: vi.fn(),
    }),
    auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
  }),
}));

const PAPER_2: Sibling = {
  title: 'AgilePM3 Practitioner - Paper 2', slug: 'agilepm-practitioner-paper-2',
  total_questions: 60, duration_minutes: 130,
};

const exam = (over: Record<string, unknown> = {}) => ({
  id: 'e1', slug: 'agilepm-practitioner-paper-1', title: 'AgilePM3 Practitioner - Paper 1',
  description: null, guide: null, scenario: null, duration_minutes: 130, pass_mark: 1,
  total_questions: BANK.length, shuffle: false, ...over,
} as unknown as ExamForPlayer);

beforeEach(cleanup);

describe('the links between sibling papers', () => {
  it('points at the other paper by a real href', async () => {
    render(<ExamPlayer exam={exam()} siblings={[PAPER_2]} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /exam mode/i })).toBeTruthy());

    const link = screen.getByRole('link', { name: /AgilePM3 Practitioner - Paper 2/ });
    expect(link.getAttribute('href')).toBe('/exams/agilepm-practitioner-paper-2');
  });

  it('names one paper in the singular and several in the plural', async () => {
    render(<ExamPlayer exam={exam()} siblings={[PAPER_2]} />);
    await waitFor(() => expect(screen.getByText(/the other paper in this set/i)).toBeTruthy());

    cleanup();
    render(<ExamPlayer exam={exam()} siblings={[PAPER_2, { ...PAPER_2, slug: 'p3', title: 'Paper 3' }]} />);
    await waitFor(() => expect(screen.getByText(/other papers in this set/i)).toBeTruthy());
  });

  it('shows nothing for a paper with no siblings, rather than an empty heading', async () => {
    render(<ExamPlayer exam={exam({ title: 'Professional Scrum Master' })} siblings={[]} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /exam mode/i })).toBeTruthy());
    expect(screen.queryByText(/paper in this set/i)).toBeNull();
  });

  it('is there again on the results screen, where "what now" is being asked', async () => {
    render(<ExamPlayer exam={exam()} siblings={[PAPER_2]} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /exam mode/i })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /exam mode/i }));
    await waitFor(() => expect(screen.getByText('Question 1')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    fireEvent.click(screen.getByRole('button', { name: /finish|submit/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /retake/i })).toBeTruthy());
    expect(screen.getByRole('link', { name: /Paper 2/ }).getAttribute('href')).toBe('/exams/agilepm-practitioner-paper-2');
  });

  // The links only do their job if they are in the HTML the server sends.
  it('is fed by the page, grouped by qualification', () => {
    const page = readFileSync('src/app/exams/[slug]/page.tsx', 'utf8');
    expect(page, 'the page does not fetch siblings').toContain('getSiblings');
    expect(page, 'siblings are not passed to the player').toContain('siblings={siblings}');
    expect(page, 'siblings are not grouped by subject').toContain('examSubject(e.title) === subject');
  });
});
