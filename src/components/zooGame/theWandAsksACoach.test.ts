import { describe, it, expect, vi, beforeEach } from 'vitest';

// Al had assumed the wand was AI. It was a regular expression, which reshaped text without
// reading it, so an objective from work came back as "Open the people who start BestU carry on
// after an initial two-week period ... so that visitors love it and come back."
//
// It asks a coach now. The mechanical reword stays as the fallback, because the game is playable
// without an account and the coach is auth-gated: a signed-out player must still get something
// honest, and must be told which answered.

const invoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke } } }));

// The pure half, so this needs no component rendered to find out what the wand does.
const { rewordWithCoach: reword } = await import('./useGoalCoach');

describe('the wand asks a coach', () => {
  // mockClear rather than mockReset: every test below sets its own implementation, and mockReset
  // leaves a rejected promise that Vitest then reports as an unhandled rejection, failing a test
  // whose own assertions all pass.
  beforeEach(() => invoke.mockClear());

  it('uses what the coach says, and says it was coached', async () => {
    invoke.mockResolvedValue({ data: { success: true, data: {
      verdict: 'reshaped', goal: 'Open a zoo families cross the county for.', note: 'You named the work.',
    } }, error: null });
    const out = await reword('build a zoo');
    expect(out.goal).toBe('Open a zoo families cross the county for.');
    expect(out.note).toBe('You named the work.');
    expect(out.coached).toBe(true);
  });

  it('falls back to the old reword when nobody is signed in', async () => {
    // Auth-gated, and the game is not. This is what most first-time players get.
    invoke.mockResolvedValue({ data: null, error: { message: 'Unauthorized' } });
    const out = await reword('lions');
    expect(out.coached, 'it claimed to have been coached').toBe(false);
    expect(out.goal, 'the fallback did nothing').not.toBe('lions');
    expect(out.note).toMatch(/\w/);
  });

  it('falls back when the call blows up, rather than failing in their face', async () => {
    // An answer of the wrong sort entirely, which makes the destructuring inside askTheCoach
    // throw. Exercises the same catch as an offline rejection without a rejected promise in the
    // test: Vitest reports one of those as unhandled and fails the test whatever catches it,
    // even though the function returns the fallback correctly.
    invoke.mockResolvedValue(null);
    const out = await reword('lions');
    expect(out.coached).toBe(false);
    expect(out.note).toMatch(/\w/);
    expect(out.goal.trim().length).toBeGreaterThan(0);
  });

  it('falls back on an answer in the wrong shape', async () => {
    // A model that returns half an answer must not empty the field they were working in.
    invoke.mockResolvedValue({ data: { success: true, data: { verdict: 'good', goal: '', note: '' } }, error: null });
    const out = await reword('lions');
    expect(out.coached).toBe(false);
    expect(out.goal.trim().length).toBeGreaterThan(0);
  });

  it('asks nobody about an empty goal', async () => {
    const out = await reword('   ');
    expect(invoke).not.toHaveBeenCalled();
    expect(out).toEqual({ goal: '', note: '', coached: false });
  });

  it('sends the goal, and nothing else', async () => {
    invoke.mockResolvedValue({ data: { success: true, data: { verdict: 'good', goal: 'A zoo.', note: 'Tidied.' } }, error: null });
    await reword('  a zoo  ');
    expect(invoke).toHaveBeenCalledWith('zoo-goal-coach', { body: { goal: 'a zoo' } });
  });
});
