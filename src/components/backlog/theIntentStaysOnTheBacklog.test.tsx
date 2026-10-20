import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UpstreamIntentPrompt } from './UpstreamIntentPrompt';

// The backlog asked "in a sentence, why does this work exist?", saved the answer, and then never
// showed it again anywhere. Found dogfooding the Product Owner route on 20 October 2026.

const db = vi.hoisted(() => ({ intent: null as string | null, updates: [] as string[] }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'projects') {
        return {
          select: () => ({ eq: () => ({ single: async () => ({ data: { intent_statement: db.intent } }) }) }),
          update: (row: { intent_statement: string }) => ({
            eq: async () => { db.updates.push(row.intent_statement); return { error: null }; },
          }),
        };
      }
      return { select: () => ({ eq: () => ({ eq: () => ({ order: async () => ({ data: [] }) }) }) }) };
    },
  },
}));

describe('the intent stays on the backlog', () => {
  beforeEach(() => {
    db.intent = null;
    db.updates = [];
  });

  it('shows what was saved, instead of disappearing', async () => {
    render(<UpstreamIntentPrompt projectId="p1" />);
    const input = await screen.findByPlaceholderText(/why this work exists/i);
    fireEvent.change(input, { target: { value: 'Run the PO route end to end.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByText('Run the PO route end to end.')).toBeTruthy());
    expect(screen.getByText('Why this work exists')).toBeTruthy();
    expect(db.updates).toEqual(['Run the PO route end to end.']);
  });

  it('shows an intent saved earlier', async () => {
    db.intent = 'Saved last week.';
    render(<UpstreamIntentPrompt projectId="p1" />);
    expect(await screen.findByText('Saved last week.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  });

  it('can be edited, and cancelling keeps the old one', async () => {
    db.intent = 'Old.';
    render(<UpstreamIntentPrompt projectId="p1" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByDisplayValue('Old.'), { target: { value: 'New.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('Old.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByDisplayValue('Old.'), { target: { value: 'New.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByText('New.')).toBeTruthy());
    expect(db.updates).toEqual(['New.']);
  });

  it('can still be skipped, and then asks nothing', async () => {
    render(<UpstreamIntentPrompt projectId="p1" />);
    await screen.findByPlaceholderText(/why this work exists/i);
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(screen.queryByPlaceholderText(/why this work exists/i)).toBeNull();
    expect(db.updates).toEqual([]);
  });
});
