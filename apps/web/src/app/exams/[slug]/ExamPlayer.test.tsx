import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExamPlayer, type ExamForPlayer } from './ExamPlayer';

// The question bank, in the order it was written. Supabase is mocked so nothing hits the network;
// the player always gets these rows back, in this order, and what it does with them is the subject.
const BANK = Array.from({ length: 12 }, (_, i) => ({
  id: `q${i + 1}`, area: 'A', question_number: i + 1, part: null, item_type: null, part_instruction: null,
  question_text: `Question ${i + 1}`, option_a: 'One', option_b: 'Two', option_c: 'Three', option_d: 'Four',
  option_e: '', option_f: '', option_g: '', option_h: '',
  correct_answer: 'A', reference: null, sort_order: i + 1,
}));

// How many questions the bank holds, which the player counts on mount - it is the difference
// between a paper that re-orders and one that also draws.
const { bankSize } = vi.hoisted(() => ({ bankSize: { current: 12 } }));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: (_cols: string, opts?: { head?: boolean }) => (opts?.head
        // the count query: .eq().eq() then awaited
        ? { eq: () => ({ eq: () => Promise.resolve({ count: bankSize.current }) }) }
        : { eq: () => ({ eq: () => ({ order: () => Promise.resolve({ data: BANK }) }) }) }),
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
  await waitFor(() => expect(screen.getByLabelText(/shuffle the question order/i)).toBeTruthy());
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

beforeEach(() => { document.body.innerHTML = ''; bankSize.current = 12; });

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
    document.body.innerHTML = '';

    // Shuffled, over several sittings, the paper does not always come back in the written order.
    // Asked over several because a shuffle is allowed to land on the written order by chance -
    // once in 12 factorial, but a test that can fail once in a blue moon is a test nobody trusts.
    const runs = [] as string[][];
    for (let i = 0; i < 6; i += 1) { document.body.innerHTML = ''; runs.push(await paperOrder({ shuffled: true })); }
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

  it('leaves a paper that draws from a POOL shuffling, because that is what it is for', async () => {
    // The one a blanket default would have broken, silently. The Scrum Master paper asks 40 of 131,
    // so shuffling does not only re-order it - it decides which forty. Its own description says so:
    // "the questions are selected from a larger pool and change each time the exam is taken."
    // Defaulting every paper to the written order would have served the same first forty for ever.
    bankSize.current = 40;   // a bank the same size as the paper: re-ordering only
    render(<ExamPlayer exam={exam({ total_questions: 12 })} />);
    await waitFor(() => expect(screen.getByLabelText(/shuffle the question order/i)).toBeTruthy());
    expect((screen.getByLabelText(/shuffle the question order/i) as HTMLInputElement).checked,
      'a paper that draws from a pool arrived with its pool switched off').toBe(true);

    document.body.innerHTML = '';
    bankSize.current = 12;   // ...and a bank that IS the paper
    render(<ExamPlayer exam={exam({ total_questions: 12 })} />);
    await waitFor(() => expect(screen.getByLabelText(/shuffle the question order/i)).toBeTruthy());
    expect((screen.getByLabelText(/shuffle the question order/i) as HTMLInputElement).checked,
      'a fixed paper arrived jumbled').toBe(false);
  });
});
