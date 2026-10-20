import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocalBacklogList } from './LocalBacklogList';
import type { LocalBacklogItem } from '@/hooks/useLocalBacklogItems';

// The card's menu is Radix; stand in a plain card that exposes its Move Up / Move Down
vi.mock('./LocalBacklogItemCard', () => ({
  LocalBacklogItemCard: ({ item, onMoveUp, onMoveDown }: {
    item: LocalBacklogItem; onMoveUp?: () => void; onMoveDown?: () => void;
  }) => (
    <div>
      <p>{item.title}</p>
      {onMoveUp && <button onClick={onMoveUp}>Up {item.id}</button>}
      {onMoveDown && <button onClick={onMoveDown}>Down {item.id}</button>}
    </div>
  ),
}));

// Every row showed a grip, but dragging only worked in the flat view and the backlog opens
// grouped, so on the live Build A Zoo backlog no row could be dragged. The arrows used a row's
// number in the grouped list as its place in the whole backlog, which is wrong once an item has
// children.

const item = (id: string, at: number, more: Partial<LocalBacklogItem> = {}): LocalBacklogItem => ({
  id, title: `Item ${id}`, description: null, acceptance_criteria: null, priority: 'medium',
  status: 'idea', source: null, estimated_value: null, estimated_effort: null, tags: null,
  target_release: null, backlog_position: at, item_type: 'story', parent_item_id: null, ...more,
});

// An epic with a child sits between the top-level items, as on a real backlog
const ITEMS = [
  item('a', 0),
  item('e', 1, { item_type: 'epic' }),
  item('c', 2, { parent_item_id: 'e' }),
  item('b', 3),
];

const show = () => {
  const onReorderItems = vi.fn();
  render(
    <LocalBacklogList items={ITEMS} onUpdateItem={vi.fn()} onDeleteItem={vi.fn()} onReorderItems={onReorderItems} />,
  );
  return onReorderItems;
};

const row = (title: string) => screen.getByText(title).closest('[draggable]') as HTMLElement;
const order = (fn: ReturnType<typeof vi.fn>) =>
  [...fn.mock.calls.at(-1)![0]].sort((x, y) => x.backlog_position - y.backlog_position).map((u) => u.id);

const dataTransfer = () => {
  const data: Record<string, string> = {};
  return { setData: (k: string, v: string) => { data[k] = v; }, getData: (k: string) => data[k], effectAllowed: '', dropEffect: '' };
};

describe('the backlog reorders by dragging', () => {
  it('lets a row be dragged in the view the backlog opens in', () => {
    show();
    expect(row('Item a').getAttribute('draggable')).toBe('true');
  });

  it('drops a top-level item in place of another', () => {
    const reorder = show();
    const dt = dataTransfer();
    fireEvent.dragStart(row('Item b'), { dataTransfer: dt });
    fireEvent.dragOver(row('Item a'), { dataTransfer: dt });
    fireEvent.drop(row('Item a'), { dataTransfer: dt });
    expect(order(reorder)).toEqual(['b', 'a', 'e', 'c']);
  });

  it('moves down past an item with children, not into them', () => {
    const reorder = show();
    fireEvent.click(screen.getByText('Down a'));
    expect(order(reorder)).toEqual(['e', 'a', 'c', 'b']);
  });

  it('moves an item with children past the next top-level item, not past its own child', () => {
    const reorder = show();
    fireEvent.click(screen.getByText('Down e'));
    expect(order(reorder).filter((id) => id !== 'c')).toEqual(['a', 'b', 'e']);
  });

  it('offers no Move Down on the last top-level item', () => {
    show();
    expect(screen.queryByText('Down b')).toBeNull();
    expect(screen.getByText('Up b')).toBeTruthy();
  });

  it('does nothing when a row is dropped on itself', () => {
    const reorder = show();
    const dt = dataTransfer();
    fireEvent.dragStart(row('Item a'), { dataTransfer: dt });
    fireEvent.drop(row('Item a'), { dataTransfer: dt });
    expect(reorder).not.toHaveBeenCalled();
  });
});
