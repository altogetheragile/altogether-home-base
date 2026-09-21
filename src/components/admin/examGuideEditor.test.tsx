import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { ExamGuideEditor } from './ExamGuideEditor';
import type { Exam } from '@/hooks/useExams';

const mutate = vi.fn();
vi.mock('@/hooks/useExamMutations', () => ({
  useUpdateExam: () => ({ mutate, isPending: false }),
}));

const exam = (over: Partial<Exam> = {}) => ({
  id: 'e1', title: 'AgilePM3 Practitioner - Paper 1', slug: 'agilepm-practitioner-paper-1',
  description: 'A short line.', guide: null, duration_minutes: 130, pass_mark: 30,
  total_questions: 60, status: 'published', created_at: '', updated_at: '', ...over,
} as Exam);

beforeEach(() => { mutate.mockClear(); cleanup(); });

describe('the guide editor', () => {
  it('shows the markdown as the page will render it, not as source', () => {
    render(<ExamGuideEditor exam={exam({ guide: '## Open book\n\nIt is not a licence to look everything up.\n\n- Read the scenario first' })} onClose={vi.fn()} />);

    const heading = screen.getByRole('heading', { name: 'Open book' });
    expect(heading.tagName).toBe('H2');
    expect(screen.getByRole('listitem').textContent).toContain('Read the scenario first');
    // The source is in the textarea; it must not also be sitting in the preview as literal text.
    expect(screen.queryByText('## Open book')).toBeNull();
  });

  it('counts the words, because thinness is the problem it exists to fix', () => {
    render(<ExamGuideEditor exam={exam({ guide: 'One two three four five.' })} onClose={vi.fn()} />);
    expect(screen.getByText('5')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Guide markdown'), { target: { value: 'One two three.' } });
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('will not save until something changed, then sends the draft', () => {
    const onClose = vi.fn();
    render(<ExamGuideEditor exam={exam({ guide: 'Original.' })} onClose={onClose} />);

    const save = screen.getByRole('button', { name: /save/i }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Guide markdown'), { target: { value: 'Rewritten.' } });
    expect(save.disabled).toBe(false);
    fireEvent.click(save);

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toEqual({ id: 'e1', data: { guide: 'Rewritten.' } });
  });

  it('sends undefined rather than an empty string when cleared', () => {
    render(<ExamGuideEditor exam={exam({ guide: 'Something.' })} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(mutate.mock.calls[0][0].data.guide).toBeUndefined();
  });

  it('offers no Clear on an exam that has no guide yet', () => {
    render(<ExamGuideEditor exam={exam()} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /clear/i })).toBeNull();
  });

  // The guide is a thousand words behind one panel. The exam modal saves every field it knows
  // about, so if it still listed `guide` it would post `undefined` and wipe the lot on any
  // unrelated edit - changing a pass mark would silently delete the writing.
  it('is the only place that writes the guide', () => {
    const admin = readFileSync('src/pages/admin/AdminExams.tsx', 'utf8');
    const fields = admin.slice(admin.indexOf('const examFields'), admin.indexOf('];', admin.indexOf('const examFields')));
    expect(fields, 'the exam modal form still lists guide').not.toContain('guide');
    expect(admin, 'the exam modal handlers still send guide').not.toContain('guide: (data.guide');
  });
});
