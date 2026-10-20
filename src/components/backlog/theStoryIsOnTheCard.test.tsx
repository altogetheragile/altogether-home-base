import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocalBacklogItemCard } from './LocalBacklogItemCard';
import type { LocalBacklogItem } from '@/hooks/useLocalBacklogItems';

// The zoo's card opens to show its story and each acceptance criterion; the tool's card only
// said how many criteria there were. Third increment of One Item, One Look (docs/ZOO_PO_ROUTE.md).

const item = (more: Partial<LocalBacklogItem> = {}): LocalBacklogItem => ({
  id: 'a', title: 'Somewhere to eat', description: null, acceptance_criteria: null, priority: 'medium',
  status: 'idea', source: null, estimated_value: null, estimated_effort: null, tags: null,
  target_release: null, backlog_position: 0, item_type: 'story', parent_item_id: null, ...more,
});

const show = (it: LocalBacklogItem, onEdit = vi.fn()) => {
  render(<LocalBacklogItemCard item={it} index={0} onUpdate={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />);
  return onEdit;
};

const CRITERIA = ['A cafe within 100m of the Savanna', 'Seats for 40'];

describe('the story is on the card', () => {
  it('opens to show each acceptance criterion, and closes again', () => {
    show(item({ acceptance_criteria: CRITERIA }));
    expect(screen.queryByText('Seats for 40')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /2 acceptance criteria/ }));
    expect(screen.getByText('A cafe within 100m of the Savanna')).toBeTruthy();
    expect(screen.getByText('Seats for 40')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /2 acceptance criteria/ }));
    expect(screen.queryByText('Seats for 40')).toBeNull();
  });

  it('reads a description written as a story in italics, as the zoo does', () => {
    show(item({ description: 'As a family I want somewhere to eat so that we stay longer' }));
    expect(screen.getByText(/As a family/).className).toContain('italic');
  });

  it('leaves a plain description plain', () => {
    show(item({ description: 'Found while dogfooding.' }));
    expect(screen.getByText('Found while dogfooding.').className).not.toContain('italic');
  });

  it('does not open the editor when the criteria are opened', () => {
    const onEdit = show(item({ acceptance_criteria: CRITERIA }));
    fireEvent.doubleClick(screen.getByRole('button', { name: /2 acceptance criteria/ }));
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('offers no criteria button when there are none', () => {
    show(item());
    expect(screen.queryByRole('button', { name: /acceptance criteria/ })).toBeNull();
  });
});
