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
// Which bank comes back is decided by the exam id in the query, not by a flag the tests share.
// A shared flag made this file flaky: a request still in flight from a previous test could observe
// the next test's setting, and the failure looked like a broken feature rather than a broken mock.
const { bankSize } = vi.hoisted(() => ({ bankSize: { current: 12 } }));
const MATCH_EXAM = 'exam-matching';
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: (_cols: string, opts?: { head?: boolean }) => (opts?.head
        // the count query: .eq().eq() then awaited
        ? { eq: () => ({ eq: () => Promise.resolve({ count: bankSize.current }) }) }
        : { eq: (_c: string, id: string) => ({ eq: () => ({ order: () =>
            Promise.resolve({ data: id === MATCH_EXAM ? MATCH : BANK }) }) }) }),
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

beforeEach(() => { cleanup(); bankSize.current = 12; });

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

describe('an answer can be changed', () => {
  /** Start a sitting and hand back the option buttons for the question on screen. */
  async function sitting(mode: RegExp) {
    cleanup(); bankSize.current = 12;
    render(<ExamPlayer exam={exam()} />);
    await waitFor(() => expect(screen.getByRole('button', { name: mode })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: mode }));
    await waitFor(() => expect(screen.getByText('Question 1')).toBeTruthy());
    // An option's accessible name is its letter run together with its text - "BTwo" - because the
    // two live in adjacent spans. Match on the option's own words rather than on that seam.
    const TEXT: Record<string, string> = { A: 'One', B: 'Two', C: 'Three', D: 'Four' };
    const opt = (letter: string) => screen.getByRole('button',
      { name: (n) => n.replace(/\s+/g, '') === letter + TEXT[letter] });
    return { opt, chosen: () => 'ABCD'.split('').filter((l) => opt(l).getAttribute('aria-pressed') === 'true') };
  }

  it('lets somebody in exam mode think again and pick a different one', async () => {
    // Exam mode took the first answer and froze it: every other option was dead on the click, with
    // nothing on screen to say why. Changing your mind is ordinary exam behaviour, and the real
    // paper allows it right up to the moment you hand it in.
    const { opt, chosen } = await sitting(/exam mode/i);
    fireEvent.click(opt('B'));
    expect(chosen(), 'the first answer did not take').toEqual(['B']);

    fireEvent.click(opt('C'));
    expect(chosen(), 'exam mode would not let the answer be changed').toEqual(['C']);

    // ...and still only one of them is held, rather than both.
    fireEvent.click(opt('A'));
    expect(chosen()).toEqual(['A']);
  });

  it('can still be cleared back to unanswered, and stays changed after moving away and back', async () => {
    // Leaving a question blank is a real answer in a negatively unmarked paper, and the count in
    // the top bar is what somebody navigates by, so it has to follow.
    const { opt, chosen } = await sitting(/exam mode/i);
    fireEvent.click(opt('B'));
    fireEvent.click(opt('B'));
    expect(chosen(), 'an answer could not be taken back').toEqual([]);
    expect(screen.getByText(/^0 answered$/)).toBeTruthy();

    fireEvent.click(opt('D'));
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^prev$/i }));
    expect(chosen(), 'the changed answer was lost on the way back').toEqual(['D']);
  });

  it('does not let practice mode change an answer once it has shown you the reason', async () => {
    // The one place the lock belongs. Practice reveals the answer the moment you commit, so
    // changing it afterwards is just marking your own work correct.
    const { opt, chosen } = await sitting(/practice mode/i);
    fireEvent.click(opt('B'));
    fireEvent.click(opt('C'));
    expect(chosen(), 'practice mode let the answer be changed after revealing it').toEqual(['B']);
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
    bankSize.current = 3;
    render(<ExamPlayer exam={exam({ id: MATCH_EXAM, total_questions: 3, scenario: 'A scenario.' })} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /practice mode/i })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /practice mode/i }));
    await waitFor(() => expect(screen.getByText('Action 1')).toBeTruthy());

    expect(document.body.textContent || '', 'the answer was explained before it was given').not.toContain('Row 1 reason');
    fireEvent.click(screen.getByLabelText('Row 1, option A'));
    // findBy, the canonical async query: it retries inside act until the row the click adds has
    // been flushed. An assertion on document.textContent inside waitFor passed locally and failed
    // in CI, which is the signature of a race rather than of a missing feature.
    expect(await screen.findByText(/Row 1 reason/), 'answering a row explained nothing').toBeTruthy();
    // ...and only for the row that was answered
    expect(document.body.textContent || '', 'an unanswered row gave its answer away').not.toContain('Row 2 reason');
  });
});

describe('a scenario paper keeps its order', () => {
  it('never re-orders a paper that has a scenario, whatever the per-exam flag says', async () => {
    // Its parts build on one another and on a shared scenario: part B assumes you have just read
    // part A. Shuffling those does not make a harder paper, it makes an incoherent one. The flag
    // was allowed to win, and a scenario paper with shuffle=true came back jumbled - found because
    // a matching test kept failing on a row that turned out to hold somebody else's question.
    for (let run = 0; run < 5; run += 1) {
      cleanup(); bankSize.current = 3;
      render(<ExamPlayer exam={exam({ id: MATCH_EXAM, total_questions: 3, scenario: 'A scenario.', shuffle: true })} />);
      await waitFor(() => expect(screen.getByRole('button', { name: /practice mode/i })).toBeTruthy());
      fireEvent.click(screen.getByRole('button', { name: /practice mode/i }));
      const rows = await screen.findAllByText(/^Action \d$/);
      expect(rows[0].textContent, 'a scenario paper came back jumbled').toBe('Action 1');
    }
  });
});
