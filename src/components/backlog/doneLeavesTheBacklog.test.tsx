import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocalBacklogList } from './LocalBacklogList';
import type { LocalBacklogItem } from '@/hooks/useLocalBacklogItems';

// In the zoo game a Done item leaves the Product Backlog and turns up in the zoo; the tool kept
// it in the list, between the items still to order. Now it is hidden until asked for, never deleted.

vi.mock('./LocalBacklogItemCard', () => ({
  LocalBacklogItemCard: ({ item }: { item: LocalBacklogItem }) => <p>{item.title}</p>,
}));

const item = (id: string, at: number, more: Partial<LocalBacklogItem> = {}): LocalBacklogItem => ({
  id, title: `Item ${id}`, description: null, acceptance_criteria: null, priority: 'medium',
  status: 'idea', source: null, estimated_value: null, estimated_effort: null, tags: null,
  target_release: null, backlog_position: at, item_type: 'story', parent_item_id: null, ...more,
});

const show = (items: LocalBacklogItem[]) =>
  render(<LocalBacklogList items={items} onUpdateItem={vi.fn()} onDeleteItem={vi.fn()} onReorderItems={vi.fn()} />);

describe('done leaves the backlog', () => {
  it('hides Done items and says how many there are', () => {
    show([item('a', 0), item('b', 1, { status: 'done' }), item('c', 2, { status: 'done' })]);
    expect(screen.getByText('Item a')).toBeTruthy();
    expect(screen.queryByText('Item b')).toBeNull();
    expect(screen.getByRole('button', { name: 'Show done (2)' })).toBeTruthy();
  });

  it('brings them back on request, and puts them away again', () => {
    show([item('a', 0), item('b', 1, { status: 'done' })]);
    fireEvent.click(screen.getByRole('button', { name: 'Show done (1)' }));
    expect(screen.getByText('Item b')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Hide done' }));
    expect(screen.queryByText('Item b')).toBeNull();
  });

  it('offers no link when nothing is Done', () => {
    show([item('a', 0)]);
    expect(screen.queryByRole('button', { name: /Show done/ })).toBeNull();
  });

  it('says so when everything is Done, rather than blaming the filters', () => {
    show([item('a', 0, { status: 'done' })]);
    expect(screen.getByText('Everything on this backlog is Done.')).toBeTruthy();
  });

  it('keeps an unfinished child of a Done epic in view', () => {
    show([item('e', 0, { item_type: 'epic', status: 'done' }), item('c', 1, { parent_item_id: 'e' })]);
    expect(screen.getByText('Item c')).toBeTruthy();
  });
});
