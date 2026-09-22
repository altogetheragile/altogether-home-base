import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const save = vi.fn(async () => ({ ok: true as const }));
const refresh = vi.fn();
vi.mock('./actions', () => ({ saveGuide: (...a: unknown[]) => save(...(a as [])) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const { GuideEditor } = await import('./GuideEditor');

beforeEach(() => { save.mockClear(); refresh.mockClear(); save.mockResolvedValue({ ok: true }); });

const open = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /edit guide/i }));
  return user;
};

describe('the editor on the exam page', () => {
  it('starts as a button, not a panel, so it stays out of the way', () => {
    render(<GuideEditor examId="e1" initial="## Hello" />);
    expect(screen.getByRole('button', { name: /edit guide/i })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens with the guide as it stands, and previews it the way the page renders it', async () => {
    render(<GuideEditor examId="e1" initial={'## A heading\n\nSome prose.'} />);
    await open();
    expect(screen.getByLabelText('Guide markdown')).toHaveValue('## A heading\n\nSome prose.');
    // The preview uses lib/markdown, the same renderer the page uses.
    expect(document.querySelector('.aa-exam-guide h2')?.textContent).toBe('A heading');
  });

  it('will not save until something has changed', async () => {
    render(<GuideEditor examId="e1" initial="## Hello" />);
    const user = await open();
    const button = screen.getByRole('button', { name: /save/i });
    expect(button).toBeDisabled();
    await user.type(screen.getByLabelText('Guide markdown'), ' there');
    expect(button).not.toBeDisabled();
  });

  it('saves the edit and re-renders the page beneath it', async () => {
    render(<GuideEditor examId="e1" initial="Hello" />);
    const user = await open();
    await user.type(screen.getByLabelText('Guide markdown'), '!');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(save).toHaveBeenCalledWith('e1', 'Hello!'));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(await screen.findByText('Saved')).toBeTruthy();
  });

  it('says what went wrong rather than pretending it saved', async () => {
    save.mockResolvedValue({ ok: false, error: 'Not allowed.' } as never);
    render(<GuideEditor examId="e1" initial="Hello" />);
    const user = await open();
    await user.type(screen.getByLabelText('Guide markdown'), '!');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByText('Not allowed.')).toBeTruthy();
    expect(screen.queryByText('Saved')).toBeNull();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('counts the words, because a guide has a length worth watching', async () => {
    render(<GuideEditor examId="e1" initial="one two three" />);
    await open();
    expect(screen.getByText(/3 words/)).toBeTruthy();
  });
});
