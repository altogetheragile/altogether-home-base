import * as React from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';

/**
 * Shared, config-driven admin table. Replaces the hand-rolled `<Table>` blocks
 * scattered across the admin pages: define columns once and get client-side
 * sorting, search, pagination, loading skeletons, an empty state, row clicks
 * and optional row selection for free.
 *
 * It is deliberately a thin wrapper over the shadcn `Table` primitives (not a
 * TanStack adoption): same look, no new dependency, and each page keeps owning
 * its own data fetching and mutations. Columns describe presentation only.
 */

export type SortDirection = 'asc' | 'desc';

export interface DataTableColumn<T> {
  /** Stable identifier; also the React key for the header and its cells. */
  id: string;
  /** Column header content. */
  header: React.ReactNode;
  /** Renders the cell for a row. */
  cell: (row: T) => React.ReactNode;
  /**
   * Makes the header a sort toggle. Provide `sortValue` when the cell is not a
   * plain string/number so sorting has something comparable to work with.
   */
  sortable?: boolean;
  /** Comparable value for sorting (and search fallback) for this column. */
  sortValue?: (row: T) => string | number | null | undefined;
  align?: 'left' | 'center' | 'right';
  /** Extra classes for the `<th>`. */
  headClassName?: string;
  /** Extra classes for the `<td>`. */
  cellClassName?: string;
}

export interface DataTableSelection {
  /** Ids of the currently selected rows. */
  selectedIds: Set<string>;
  /** Called with the next selection whenever it changes. */
  onChange: (next: Set<string>) => void;
}

export interface DataTableProps<T> {
  data: T[] | undefined;
  columns: DataTableColumn<T>[];
  /** Stable id for a row; used as React key and for selection. */
  rowKey: (row: T) => string;
  isLoading?: boolean;
  /** Shown when there are no rows (after filtering). */
  emptyMessage?: React.ReactNode;
  /** Enables the search box. Searches `getSearchText`, or every column's `sortValue`. */
  searchable?: boolean;
  searchPlaceholder?: string;
  getSearchText?: (row: T) => string;
  /** Rows per page. Omit to show everything on one page. */
  pageSize?: number;
  /** Default sort applied on mount. */
  defaultSort?: { columnId: string; direction: SortDirection };
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  /** Optional checkbox column + select-all wired to caller-owned state. */
  selection?: DataTableSelection;
  /** Extra controls (filter dropdowns, create button) rendered beside search. */
  toolbar?: React.ReactNode;
  /** Number of skeleton rows to show while loading. */
  skeletonRows?: number;
  className?: string;
}

const alignClass: Record<NonNullable<DataTableColumn<unknown>['align']>, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function defaultSortValue<T>(col: DataTableColumn<T>, row: T): string | number | null | undefined {
  if (col.sortValue) return col.sortValue(row);
  const rendered = col.cell(row);
  return typeof rendered === 'string' || typeof rendered === 'number' ? rendered : undefined;
}

function compareValues(a: unknown, b: unknown): number {
  const aNil = a === null || a === undefined || a === '';
  const bNil = b === null || b === undefined || b === '';
  if (aNil && bNil) return 0;
  if (aNil) return 1; // nulls sort last regardless of direction flip below
  if (bNil) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  isLoading = false,
  emptyMessage = 'No records found',
  searchable = false,
  searchPlaceholder = 'Search...',
  getSearchText,
  pageSize,
  defaultSort,
  onRowClick,
  rowClassName,
  selection,
  toolbar,
  skeletonRows = 5,
  className,
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState<{ columnId: string; direction: SortDirection } | null>(
    defaultSort ?? null,
  );
  const [page, setPage] = React.useState(0);

  const rows = React.useMemo(() => data ?? [], [data]);

  const searched = React.useMemo(() => {
    if (!searchable || !query.trim()) return rows;
    const needle = query.trim().toLowerCase();
    const textOf = getSearchText
      ? getSearchText
      : (row: T) => columns.map((c) => defaultSortValue(c, row) ?? '').join(' ');
    return rows.filter((row) => textOf(row).toLowerCase().includes(needle));
  }, [rows, searchable, query, getSearchText, columns]);

  const sorted = React.useMemo(() => {
    if (!sort) return searched;
    const col = columns.find((c) => c.id === sort.columnId);
    if (!col) return searched;
    const dir = sort.direction === 'asc' ? 1 : -1;
    // Copy before sorting so we never mutate the caller's array/query cache.
    return [...searched].sort((a, b) => {
      const cmp = compareValues(defaultSortValue(col, a), defaultSortValue(col, b));
      // Keep nulls last in both directions by not flipping a pure-null compare.
      return cmp === 0 ? 0 : cmp * dir;
    });
  }, [searched, sort, columns]);

  const totalPages = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages - 1);
  const paged = React.useMemo(() => {
    if (!pageSize) return sorted;
    const start = safePage * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageSize, safePage]);

  // Reset to the first page whenever the visible set shrinks under us.
  React.useEffect(() => {
    if (page > totalPages - 1) setPage(0);
  }, [page, totalPages]);

  const toggleSort = (col: DataTableColumn<T>) => {
    if (!col.sortable) return;
    setSort((prev) => {
      if (prev?.columnId !== col.id) return { columnId: col.id, direction: 'asc' };
      return { columnId: col.id, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
    });
  };

  const pageRowIds = paged.map(rowKey);
  const allOnPageSelected =
    !!selection && pageRowIds.length > 0 && pageRowIds.every((id) => selection.selectedIds.has(id));
  const someOnPageSelected =
    !!selection && !allOnPageSelected && pageRowIds.some((id) => selection.selectedIds.has(id));

  const toggleSelectAll = () => {
    if (!selection) return;
    const next = new Set(selection.selectedIds);
    if (allOnPageSelected) pageRowIds.forEach((id) => next.delete(id));
    else pageRowIds.forEach((id) => next.add(id));
    selection.onChange(next);
  };

  const toggleRow = (id: string) => {
    if (!selection) return;
    const next = new Set(selection.selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selection.onChange(next);
  };

  const colSpan = columns.length + (selection ? 1 : 0);

  return (
    <div className={cn('space-y-4', className)}>
      {(searchable || toolbar) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8"
                aria-label="Search table"
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selection && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allOnPageSelected ? true : someOnPageSelected ? 'indeterminate' : false}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all rows on this page"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(col.align && alignClass[col.align], col.headClassName)}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col)}
                      className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                    >
                      {col.header}
                      {sort?.columnId === col.id ? (
                        sort.direction === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(skeletonRows)].map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {selection && (
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.id}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row) => {
                const id = rowKey(row);
                return (
                  <TableRow
                    key={id}
                    data-state={selection?.selectedIds.has(id) ? 'selected' : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(onRowClick && 'cursor-pointer', rowClassName?.(row))}
                  >
                    {selection && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selection.selectedIds.has(id)}
                          onCheckedChange={() => toggleRow(id)}
                          aria-label="Select row"
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell
                        key={col.id}
                        className={cn(col.align && alignClass[col.align], col.cellClassName)}
                      >
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pageSize && !isLoading && sorted.length > pageSize && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {safePage * pageSize + 1}-{Math.min((safePage + 1) * pageSize, sorted.length)} of{' '}
            {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
            >
              Previous
            </Button>
            <span>
              Page {safePage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
