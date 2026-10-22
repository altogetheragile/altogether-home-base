import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const refresh = vi.fn();
const setVisitorView = vi.fn(async (_on: boolean) => ({ ok: true }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
vi.mock('@/app/actions/view', () => ({ setVisitorView: (on: boolean) => setVisitorView(on) }));

const { ViewSwitch } = await import('./ViewSwitch');

beforeEach(() => {
  refresh.mockClear();
  setVisitorView.mockClear();
});

describe('the switch between admin view and visitor view', () => {
  it('says which view you are in', () => {
    render(<ViewSwitch asVisitor={false} />);
    expect(screen.getByRole('radio', { name: 'Admin view' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'Visitor view' }).getAttribute('aria-checked')).toBe('false');
  });

  it('switches to the visitor view and renders the page again', async () => {
    render(<ViewSwitch asVisitor={false} />);
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Visitor view' }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(setVisitorView).toHaveBeenCalledWith(true);
  });

  it('switches back', async () => {
    render(<ViewSwitch asVisitor />);
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Admin view' }));
    await waitFor(() => expect(setVisitorView).toHaveBeenCalledWith(false));
  });

  it('does nothing when you choose the view you are already in', async () => {
    render(<ViewSwitch asVisitor />);
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Visitor view' }));
    expect(setVisitorView).not.toHaveBeenCalled();
  });
});
