import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const refresh = vi.fn();
const setVisitorView = vi.fn(async (_on: boolean) => ({ ok: true }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
vi.mock('@/app/actions/view', () => ({ setVisitorView: (on: boolean) => setVisitorView(on) }));

const { ViewSwitch } = await import('./ViewSwitch');

/** It sits folded against the edge until it is pointed at, tapped or tabbed to. The options are
 *  then pressed with fireEvent: user-event's pointer reports leaving the switch on its way from the
 *  tab to an option, which no browser does, and closes it. Checked in WebKit for real instead. */
const unfold = async (user = userEvent.setup()) => {
  await user.click(screen.getByRole('button', { name: /Change how you see this site/ }));
  return user;
};

beforeEach(() => {
  refresh.mockClear();
  setVisitorView.mockClear();
});

describe('the switch between admin view and visitor view', () => {
  it('stays out of the way, folded, saying only which view you are in', () => {
    render(<ViewSwitch asVisitor />);
    expect(screen.getByRole('button', { name: /^Visitor view\. Change how you see this site/ })).toBeTruthy();
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  it('says which view you are in', async () => {
    render(<ViewSwitch asVisitor={false} />);
    await unfold();
    expect(screen.getByRole('radio', { name: 'Admin view' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'Visitor view' }).getAttribute('aria-checked')).toBe('false');
  });

  it('switches to the visitor view and renders the page again', async () => {
    render(<ViewSwitch asVisitor={false} />);
    await unfold();
    fireEvent.click(screen.getByRole('radio', { name: 'Visitor view' }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(setVisitorView).toHaveBeenCalledWith(true);
  });

  it('switches back', async () => {
    render(<ViewSwitch asVisitor />);
    await unfold();
    fireEvent.click(screen.getByRole('radio', { name: 'Admin view' }));
    await waitFor(() => expect(setVisitorView).toHaveBeenCalledWith(false));
  });

  it('does nothing when you choose the view you are already in', async () => {
    render(<ViewSwitch asVisitor />);
    await unfold();
    fireEvent.click(screen.getByRole('radio', { name: 'Visitor view' }));
    expect(setVisitorView).not.toHaveBeenCalled();
  });
});
