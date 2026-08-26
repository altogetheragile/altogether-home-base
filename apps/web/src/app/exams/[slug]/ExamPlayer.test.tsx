import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { ExamPlayer, type ExamForPlayer } from './ExamPlayer';

// The question bank, in the order it was written. Supabase is mocked so nothing hits the network;
// the player always gets these rows back, in this order, and what it does with them is the subject.
/** A matching part: several rows sharing one screen and one set of options. */
const MATCH = Array.from({ length: 3 }, (_, i) => ({
  id: `m${i + 1}`, area: 'A', question_number: 1, part: 'A', item_type: 'match',
  part_instruction: 'For each action in Column 1, select the Principle in Column 2.',
  question_text: `Action ${i + 1}`, option_a: 'Focus on the Business Need', option_b: 'Deliver on Time',
  option_c: 'Collaborate', option_d: 'Never Compromise Quality',
  option_e: '', option_f: '', option_g: '', option_h: '',
  correct_answer: 'ABCD'[i], reference: `Row ${i + 1} reason. Ref 4.3.${i + 1}, A Principle.`,
  sort_order: i + 1,
}));

const BANK = Array.from({ length: 12 }, (_, i) => ({
  id: `q${i + 1}`, area: 'A', question_number: i + 1, part: null, item_type: null, part_instruction: null,
  question_text: `Question ${i + 1}`, option_a: 'One', option_b: 'Two', option_c: 'Three', option_d: 'Four',
  option_e: '', option_f: '', option_g: '', option_h: '',
  correct_answer: 'A', reference: null, sort_order: i + 1,
}));

// How many questions the bank holds, which the player counts on mount - it is the difference
// between a paper that re-orders and one that also draws.
const { bankSize, useMatching } = vi.hoisted(() => ({ bankSize: { current: 12 }, useMatching: { on: false } }));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: (_cols: string, opts?: { head?: boolean }) => (opts?.head
        // the count query: .eq().eq() then awaited
        ? { eq: () => ({ eq: () => Promise.resolve({ count: bankSize.current }) }) }
        : { eq: () => ({ eq: () => ({ order: () => Promise.resolve({ data: useMatching.on ? MATCH : BANK }) }) }) }),
      insert: vi.fn(),
    }),
    auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
  }),
}));

const exam = (over: Record<string, unknown> = {}) => ({
  id: 'e1', slug: 'agilepm-foundation-paper-1', title: 'AgilePM3 Foundation - Paper 1',
  description: null, scenario: null, duration_minutes: 40, pass_mark: 25, total_questions: 12,
  shuffle: true, ...over,
} as unknown as ExamForPlayer);

/** The order the paper actually put the questions in. */
async function paperOrder(opts: { shuffled?: boolean; exam?: Record<string, unknown> } = {}) {
  render(<ExamPlayer exam={exam(opts.exam)} />);
  // The bank is counted on mount, so wait for that before reading or touching the default.
  // The bank is counted on mount, and the switch only appears on a paper whose order is free.
  await waitFor(() => expect(screen.getByRole('button', { name: /exam mode/i })).toBeTruthy());
  if (opts.shuffled) fireEvent.click(screen.getByLabelText(/shuffle the question order/i));
  fireEvent.click(screen.getByRole('button', { name: /exam mode/i }));
  await waitFor(() => expect(screen.getByText(/^Question \d+$/)).toBeTruthy());
  // Walk the paper by pressing Next, collecting the question text as it comes.
  const seen: string[] = [screen.getByText(/^Question \d+$/).textContent ?? ''];
  for (let i = 1; i < BANK.length; i += 1) {
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    seen.push(screen.getByText(/^Question \d+$/).textContent ?? '');
  }
  return seen;
}

const WRITTEN = BANK.map((q) => q.question_text);

beforeEach(() => { cleanup(); bankSize.current = 12; useMatching.on = false; });

describe('the question order is a choice', () => {
  it('gives everybody the same paper unless somebody asks otherwise', async () => {
    // The whole point. A trainer sits a room down in front of the same paper, and "the answer to
    // question 7" has to mean the same thing to all of them. This used to shuffle every time with
    // no way to stop it: "if I get a group to sit the same exam they get the questions in a
    // different order".
    expect(await paperOrder()).toEqual(WRITTEN);
  });

  it('offers the shuffle, and honours it when it is turned on', async () => {
    // Re-ordering is still a real thing to want - for a re-sit, or to practise without learning the
    // order - so it is still here. It is asked for now rather than assumed.
    render(<ExamPlayer exam={exam()} />);
    await waitFor(() => expect(screen.getByLabelText(/shuffle the question order/i)).toBeTruthy());
    cleanup();

    // Shuffled, over several sittings, the paper does not always come back in the written order.
    // Asked over several because a shuffle is allowed to land on the written order by chance -
    // once in 12 factorial, but a test that can fail once in a blue moon is a test nobody trusts.
    const runs = [] as string[][];
    for (let i = 0; i < 6; i += 1) { cleanup(); runs.push(await paperOrder({ shuffled: true })); }
    expect(runs.some((r) => r.join() !== WRITTEN.join()), 'shuffling changed nothing').toBe(true);
    // ...and whatever the order, it is the same twelve questions.
    for (const r of runs) expect([...r].sort()).toEqual([...WRITTEN].sort());
  });

  it('does not offer it on a paper whose order carries meaning', () => {
    // A scenario paper's items build on one another, so jumbling them is not an option, it is a
    // fault. The scenario itself is what says so.
    render(<ExamPlayer exam={exam({ scenario: 'Harbour Quarter Regeneration...' })} />);
    expect(screen.queryByLabelText(/shuffle the question order/i),
      'a scenario paper is offered a shuffle that would break it').toBeNull();
  });

  it('is not offered on a paper that draws from a POOL, because that is not just an order', async () => {
    // The one a blanket toggle would have broken, silently. The Scrum Master paper asks 40 of 131,
    // so shuffling does not merely re-order it - it decides WHICH forty. Its own description says
    // so: "the questions are selected from a larger pool and change each time the exam is taken."
    // Offering to switch that off would be offering to turn it into a different exam.
    bankSize.current = 40;                       // a bank bigger than the paper
    render(<ExamPlayer exam={exam({ total_questions: 12 })} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /exam mode/i })).toBeTruthy());
    expect(screen.queryByLabelText(/shuffle the question order/i),
      'a pool paper is offered a switch that would turn it into a different exam').toBeNull();

    // ...and it still draws a fresh set, exactly as it did before any of this.
    const runs: string[][] = [];
    for (let i = 0; i < 6; i += 1) { cleanup(); runs.push(await paperOrder({ exam: { total_questions: 12 } })); }
    expect(runs.some((r) => r.join() !== WRITTEN.join()), 'the pool paper stopped drawing').toBe(true);
  });

  it('is offered where the paper IS its bank, which is the Foundation papers', async () => {
    // 50 of 50: shuffling changes nothing but the sequence, so the sequence is a free choice.
    bankSize.current = 12;
    render(<ExamPlayer exam={exam({ total_questions: 12 })} />);
    await waitFor(() => expect(screen.getByLabelText(/shuffle the question order/i)).toBeTruthy());
    expect((screen.getByLabelText(/shuffle the question order/i) as HTMLInputElement).checked).toBe(false);
  });
});

describe('practice mode explains a matching answer', () => {
  it('shows the reason for each row once it is answered, as it does for every other question type', async () => {
    // The dot turned green and that was the whole of the teaching. Every other kind of question
    // shows its reference in practice mode; a matching part showed nothing, so the parts of the
    // paper that teach by comparison taught the least.
    // Start from a clean DOM. The tests above render several times inside one test, and a root
    // left behind makes getBy throw on a duplicate, which surfaces here as a timeout and reads
    // like the feature is broken when it is not.
    cleanup();
    useMatching.on = true; bankSize.current = 3;
    render(<ExamPlayer exam={exam({ total_questions: 3, scenario: 'A scenario.' })} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /practice mode/i })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /practice mode/i }));
    await waitFor(() => expect(screen.getByText('Action 1')).toBeTruthy());

    expect(document.body.textContent || '', 'the answer was explained before it was given').not.toContain('Row 1 reason');
    fireEvent.click(screen.getByLabelText('Row 1, option A'));
    // Asserted on the document text rather than with getByText: the reason lives in a row that is
    // added to the table after the state settles, and a getBy inside waitFor reports "unable to
    // find" on its first poll and never retries far enough to see it.
    await waitFor(() => expect(document.body.textContent || '',
      'answering a row explained nothing').toContain('Row 1 reason'));
    // ...and only for the row that was answered
    expect(document.body.textContent || '', 'an unanswered row gave its answer away').not.toContain('Row 2 reason');
  });
});
