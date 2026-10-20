import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocalBacklogItemCard } from './LocalBacklogItemCard';
import { LocalBacklogQuickAdd } from './LocalBacklogQuickAdd';
import { SchemeProvider } from './SchemeContext';
import { SCHEMES, compareByScheme, type SchemeId } from '@/config/prioritisationSchemes';
import type { LocalBacklogItem } from '@/hooks/useLocalBacklogItems';

// Al's decision, 20 Oct 2026: Simple means the order is the priority. Its Critical-to-Low levels
// gave every item a second priority that could disagree with its place in the list, and the zoo
// game, where the Product Owner orders by dragging, has no such badge. The quick-add form also
// offered Critical to Low under every scheme, MoSCoW included.

const item = (more: Partial<LocalBacklogItem> = {}): LocalBacklogItem => ({
  id: 'a', title: 'An item', description: null, acceptance_criteria: null, priority: 'high',
  status: 'idea', source: null, estimated_value: null, estimated_effort: null, tags: null,
  target_release: null, backlog_position: 0, item_type: 'story', parent_item_id: null, ...more,
});

const within = (scheme: SchemeId, ui: React.ReactElement) => render(<SchemeProvider scheme={scheme}>{ui}</SchemeProvider>);

describe('the order is the priority', () => {
  it('puts no priority badge on a card under Simple', () => {
    within('simple', <LocalBacklogItemCard item={item()} index={0} onUpdate={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.queryByText(/^(high|High|Critical|Medium|Low)$/)).toBeNull();
  });

  it('leaves the backlog in its own order when sorting or exporting under Simple', () => {
    const rows = [item({ id: 'x', priority: 'low' }), item({ id: 'y', priority: 'critical' })];
    expect([...rows].sort((a, b) => compareByScheme(SCHEMES.simple, a, b)).map((r) => r.id)).toEqual(['x', 'y']);
  });

  it('still ranks by level under MoSCoW', () => {
    const rows = [item({ id: 'x', priority: 'could' }), item({ id: 'y', priority: 'must' })];
    expect([...rows].sort((a, b) => compareByScheme(SCHEMES.moscow, a, b)).map((r) => r.id)).toEqual(['y', 'x']);
  });

  it('asks no priority when adding under Simple', () => {
    within('simple', <LocalBacklogQuickAdd onAddItem={vi.fn()} />);
    fireEvent.click(screen.getByText('Add backlog item'));
    expect(screen.getByText(/^Source/)).toBeTruthy();
    expect(screen.queryByText(/^Priority/)).toBeNull();
  });

  it('asks in MoSCoW words when adding under MoSCoW', () => {
    within('moscow', <LocalBacklogQuickAdd onAddItem={vi.fn()} />);
    fireEvent.click(screen.getByText('Add backlog item'));
    expect(screen.getByText(/^Source/)).toBeTruthy();
    expect(screen.getByText(/^Priority/)).toBeTruthy();
    expect(screen.getAllByText('Could').length).toBeGreaterThan(0);
    expect(screen.queryByText('Medium')).toBeNull();
  });
});
