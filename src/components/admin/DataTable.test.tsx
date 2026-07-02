import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DataTable, type DataTableColumn } from './DataTable';

interface Widget {
  id: string;
  name: string;
  qty: number;
}

const widgets: Widget[] = [
  { id: 'a', name: 'Banana', qty: 3 },
  { id: 'b', name: 'Apple', qty: 10 },
  { id: 'c', name: 'Cherry', qty: 1 },
];

const columns: DataTableColumn<Widget>[] = [
  { id: 'name', header: 'Name', cell: (w) => w.name, sortable: true },
  { id: 'qty', header: 'Qty', cell: (w) => w.qty, sortable: true, sortValue: (w) => w.qty },
];

const bodyNames = () => {
  const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1); // drop header
  return rows.map((r) => within(r).getAllByRole('cell')[0].textContent);
};

describe('DataTable', () => {
  it('renders one row per record', () => {
    render(<DataTable data={widgets} columns={columns} rowKey={(w) => w.id} />);
    expect(bodyNames()).toEqual(['Banana', 'Apple', 'Cherry']);
  });

  it('shows the empty message when there are no rows', () => {
    render(<DataTable data={[]} columns={columns} rowKey={(w) => w.id} emptyMessage="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('shows skeletons while loading and no data', () => {
    const { container } = render(
      <DataTable data={undefined} columns={columns} rowKey={(w) => w.id} isLoading skeletonRows={3} />,
    );
    // 3 skeleton rows x 2 columns = 6 skeleton placeholders
    expect(container.querySelectorAll('.animate-pulse').length).toBe(6);
  });

  it('sorts ascending then descending on header click', async () => {
    const user = userEvent.setup();
    render(<DataTable data={widgets} columns={columns} rowKey={(w) => w.id} />);
    await user.click(screen.getByRole('button', { name: /Name/ }));
    expect(bodyNames()).toEqual(['Apple', 'Banana', 'Cherry']);
    await user.click(screen.getByRole('button', { name: /Name/ }));
    expect(bodyNames()).toEqual(['Cherry', 'Banana', 'Apple']);
  });

  it('sorts numerically by sortValue, not lexically', async () => {
    const user = userEvent.setup();
    render(<DataTable data={widgets} columns={columns} rowKey={(w) => w.id} />);
    await user.click(screen.getByRole('button', { name: /Qty/ }));
    expect(bodyNames()).toEqual(['Cherry', 'Banana', 'Apple']); // 1, 3, 10
  });

  it('does not mutate the source data array when sorting', async () => {
    const user = userEvent.setup();
    const source = [...widgets];
    render(<DataTable data={source} columns={columns} rowKey={(w) => w.id} />);
    await user.click(screen.getByRole('button', { name: /Name/ }));
    expect(source.map((w) => w.name)).toEqual(['Banana', 'Apple', 'Cherry']);
  });

  it('filters rows via the search box', async () => {
    const user = userEvent.setup();
    render(<DataTable data={widgets} columns={columns} rowKey={(w) => w.id} searchable />);
    await user.type(screen.getByRole('textbox', { name: /search table/i }), 'err');
    expect(bodyNames()).toEqual(['Cherry']);
  });

  it('paginates and steps through pages', async () => {
    const user = userEvent.setup();
    render(<DataTable data={widgets} columns={columns} rowKey={(w) => w.id} pageSize={2} />);
    expect(bodyNames()).toEqual(['Banana', 'Apple']);
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(bodyNames()).toEqual(['Cherry']);
  });

  it('supports row selection with select-all', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DataTable
        data={widgets}
        columns={columns}
        rowKey={(w) => w.id}
        selection={{ selectedIds: new Set(), onChange }}
      />,
    );
    await user.click(screen.getByRole('checkbox', { name: /select all rows/i }));
    expect(onChange).toHaveBeenCalledWith(new Set(['a', 'b', 'c']));
  });

  it('fires onRowClick with the clicked row', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<DataTable data={widgets} columns={columns} rowKey={(w) => w.id} onRowClick={onRowClick} />);
    await user.click(screen.getByText('Apple'));
    expect(onRowClick).toHaveBeenCalledWith(widgets[1]);
  });
});
