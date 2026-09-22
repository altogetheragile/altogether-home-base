import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { ExamPlayer, type ExamForPlayer } from './ExamPlayer';

// The guide is the only substantial writing on an exam page.
//
// Measured on production before this existed: each exam page rendered about 140 words, and nearly
// all of them were the navigation, the footer, and a mode explainer identical on all five papers.
// What was unique to a page was two or three sentences. Google crawled the Practitioner and PSM
// papers and declined to index them, while both Foundation papers were kept - the signature of
// pages too thin to earn a slot rather than a technical fault.
//
// Two things therefore have to hold, and both are asserted here: the guide has to be in the HTML
// that comes back from the server (a crawler runs no exam), and it has to be gone once the paper
// starts, because reading about the exam is what you do INSTEAD of sitting it.

const BANK = Array.from({ length: 4 }, (_, i) => ({
  id: `q${i + 1}`, area: 'A', question_number: i + 1, part: null, item_type: null,
  part_instruction: null, question_text: `Question ${i + 1}`,
  option_a: 'One', option_b: 'Two', option_c: 'Three', option_d: 'Four',
  option_e: '', option_f: '', option_g: '', option_h: '',
  correct_answer: 'A', reference: null, sort_order: i + 1,
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: (_cols: string, opts?: { head?: boolean }) => (opts?.head
        ? { eq: () => ({ eq: () => Promise.resolve({ count: BANK.length }) }) }
        : { eq: () => ({ eq: () => ({ order: () => Promise.resolve({ data: BANK }) }) }) }),
      insert: vi.fn(),
    }),
    auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
  }),
}));

const GUIDE = [
  '## How the Practitioner paper works',
  '',
  'It is an objective test, not an essay, and the format catches people out.',
  '',
  '- Four questions, sixty marks',
  '- Open book, so the handbook is on the desk',
].join('\n');

const exam = (over: Record<string, unknown> = {}) => ({
  id: 'e1', slug: 'agilepm-practitioner-paper-1', title: 'AgilePM3 Practitioner - Paper 1',
  description: 'A short line.', guide: null, scenario: null,
  duration_minutes: 130, pass_mark: 2, total_questions: BANK.length, shuffle: false, ...over,
} as unknown as ExamForPlayer);

beforeEach(cleanup);

describe('an exam guide', () => {
  it('renders its markdown on the start card', async () => {
    render(<ExamPlayer exam={exam({ guide: GUIDE })} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /exam mode/i })).toBeTruthy());

    const heading = screen.getByRole('heading', { name: /how the practitioner paper works/i });
    expect(heading.tagName).toBe('H2');
    expect(screen.getByText(/objective test, not an essay/i)).toBeTruthy();
    // A list has to read as a list: the app's reset clears markers, which is why the styles
    // put them back. If markdown were shown raw, the hyphens would be here instead.
    expect(screen.getAllByRole('listitem').some((li) => /sixty marks/i.test(li.textContent ?? ''))).toBe(true);
    expect(screen.queryByText(/^- Four questions/)).toBeNull();
  });

  it('is absent when the exam has none, leaving the card as it was', async () => {
    render(<ExamPlayer exam={exam()} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /exam mode/i })).toBeTruthy());
    expect(document.querySelector('.aa-exam-guide')).toBeNull();
    expect(screen.getByText('A short line.')).toBeTruthy();
  });

  it('goes away once the paper starts', async () => {
    render(<ExamPlayer exam={exam({ guide: GUIDE })} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /exam mode/i })).toBeTruthy());
    expect(document.querySelector('.aa-exam-guide')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /exam mode/i }));
    await waitFor(() => expect(screen.getByText('Question 1')).toBeTruthy());
    expect(document.querySelector('.aa-exam-guide')).toBeNull();
  });

  it('carries no script through the markdown renderer', async () => {
    render(<ExamPlayer exam={exam({ guide: '<script>alert(1)</script>\n\nSafe text.' })} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /exam mode/i })).toBeTruthy());
    const guide = document.querySelector('.aa-exam-guide');
    expect(guide?.querySelector('script')).toBeNull();
    expect(guide?.textContent).toContain('Safe text.');
  });

  // The column has to be asked for. A rendering that works against a row the query never fetched
  // is how #712 shipped: the code was right and the data it read was not.
  it('is fetched by the page that renders it', () => {
    const page = readFileSync('src/app/exams/[slug]/page.tsx', 'utf8');
    // Scoped to getExam: the file has more than one query, and matching the first `.select(`
    // made this assert against whichever function happened to be declared highest.
    const getExam = page.slice(page.indexOf('async function getExam'));
    const select = getExam.match(/\.select\(\s*'([^']*)'/)?.[1] ?? '';
    expect(select, 'the exam query does not ask for the guide column').toContain('guide');
  });
});
