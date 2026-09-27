import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddFeedbackDialog from './AddFeedbackDialog';

// Recommendations arrive one at a time, by email or on LinkedIn. The only way onto the site was
// a spreadsheet with the right column headings, which is a strange thing to build for a single
// paragraph somebody has just sent you. Asked for as "can we add the manual mechanism to add one
// at a time".

const added = vi.fn();
vi.mock('@/hooks/useCourseFeedback', () => ({
  useAddFeedback: () => ({ mutate: added, isPending: false }),
}));

const openIt = async () => {
  const user = userEvent.setup();
  render(<AddFeedbackDialog />);
  await user.click(screen.getByRole('button', { name: /Add a testimonial/i }));
  return user;
};

describe('a recommendation at a time', () => {
  beforeEach(() => added.mockClear());

  it('will not save until there are words and a name', async () => {
    const user = await openIt();
    const save = screen.getByRole('button', { name: 'Add it' });
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText('What they said'), 'She was excellent.');
    expect(save, 'words alone are not enough: a quote from nobody').toBeDisabled();
    await user.type(screen.getByLabelText('First name'), 'Priya');
    expect(save).toBeEnabled();
  });

  it('sends empty fields as absent, not as empty strings', async () => {
    // The site checks these for truthiness before drawing them. An empty string would put an
    // empty badge and an empty line on the page.
    const user = await openIt();
    await user.type(screen.getByLabelText('What they said'), 'Genuinely changed how we work.');
    await user.type(screen.getByLabelText('First name'), 'Priya');
    await user.click(screen.getByRole('button', { name: 'Add it' }));

    const row = added.mock.calls[0][0];
    expect(row.company).toBeNull();
    expect(row.job_title).toBeNull();
    expect(row.course_name, 'blank would put "Unknown Course" on the page').toBeNull();
    expect(row.rating).toBeNull();
    expect(row.comment).toBe('Genuinely changed how we work.');
  });

  it('keeps a score inside one and ten', async () => {
    const user = await openIt();
    await user.type(screen.getByLabelText('What they said'), 'Superb.');
    await user.type(screen.getByLabelText('First name'), 'Priya');
    await user.type(screen.getByLabelText('Score out of 10'), '44');
    await user.click(screen.getByRole('button', { name: 'Add it' }));
    expect(added.mock.calls[0][0].rating).toBe(10);
  });

  it('puts it on the site by default, because whoever typed it has read it', async () => {
    const user = await openIt();
    await user.type(screen.getByLabelText('What they said'), 'Superb.');
    await user.type(screen.getByLabelText('First name'), 'Priya');
    await user.click(screen.getByRole('button', { name: 'Add it' }));
    expect(added.mock.calls[0][0].is_approved).toBe(true);
  });

  it('can be held back instead', async () => {
    const user = await openIt();
    await user.type(screen.getByLabelText('What they said'), 'Superb.');
    await user.type(screen.getByLabelText('First name'), 'Priya');
    await user.click(screen.getByLabelText('Show it on the site'));
    await user.click(screen.getByRole('button', { name: 'Add it' }));
    expect(added.mock.calls[0][0].is_approved).toBe(false);
  });

  it('does not decide the front page for you', async () => {
    // Featuring one is a decision about the home page, made on the row afterwards rather than
    // buried in the form that adds it.
    const user = await openIt();
    await user.type(screen.getByLabelText('What they said'), 'Superb.');
    await user.type(screen.getByLabelText('First name'), 'Priya');
    await user.click(screen.getByRole('button', { name: 'Add it' }));
    expect(added.mock.calls[0][0].is_featured).toBe(false);
  });

  it('records where it came from, the way the importer does', async () => {
    const user = await openIt();
    await user.type(screen.getByLabelText('What they said'), 'Superb.');
    await user.type(screen.getByLabelText('First name'), 'Priya');
    await user.click(screen.getByRole('button', { name: 'Add it' }));
    expect(added.mock.calls[0][0].source).toBe('linkedin');
  });
});
