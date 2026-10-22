import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditDrawer, type EditorHost } from '@altogether/ui/editor/EditDrawer';
import type { CopyField } from '@altogether/ui/editor/store';

// "Can each text field, label and image have an ID? Can these be shown on the curtain?" Each had
// one already - its key, which the spreadsheet carried - and nothing showed it. The boxes inside a
// list had none; they are named by position, as the spreadsheet names them.

// One group, so the drawer shows them flat with nothing folded away.
const FIELDS: CopyField[] = [
  { key: 'coaching.hero.heading', label: 'Hero heading', hint: '', value: 'Find What People Think', shipped: '', group: 'Hero' },
  { key: 'coaching.hero.picture', label: 'Hero picture', hint: '', value: '', shipped: '', type: 'image', group: 'Hero' },
  {
    key: 'coaching.services', label: 'Service', hint: '', shipped: '', type: 'items', group: 'Hero',
    fields: [{ key: 'title', label: 'Title' }, { key: 'picture', label: 'Picture', type: 'image' }],
    value: JSON.stringify([{ title: 'Focus Groups', picture: '' }, { title: 'Depth Interviews', picture: '' }]),
  },
];

// Enough boxes, in two groups, for the drawer to offer its search.
const MANY: CopyField[] = [
  ...FIELDS.slice(0, 2),
  ...Array.from({ length: 7 }, (_, i) => ({ key: `coaching.hero.line${i}`, label: `Line ${i}`, hint: '', value: '', shipped: '', group: 'Hero' })),
  { ...FIELDS[2], group: 'Services' },
];

const host = (fields = FIELDS): EditorHost => ({
  pathname: '/coaching',
  pageForPath: () => 'coaching',
  alwaysOffered: [],
  openAt: 'coaching',
  load: vi.fn(async () => fields),
  save: vi.fn(async () => ({ ok: true as const })),
  reset: vi.fn(async () => ({ ok: true as const })),
  undo: vi.fn(async () => ({ ok: true as const })),
  refresh: vi.fn(),
  upload: vi.fn(async () => ''),
});

const ids = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-part="field-id"]')].map((n) => n.textContent);

describe('every box shows its ID', () => {
  it('shows the ID of each box, picture and list, and of every box inside the list', async () => {
    const { container } = render(<EditDrawer host={host()} />);
    await waitFor(() => expect(screen.getByLabelText('Hero heading')).toBeTruthy());
    expect(ids(container)).toEqual([
      'coaching.hero.heading',
      'coaching.hero.picture',
      'coaching.services',
      'coaching.services.1.title',
      'coaching.services.1.picture',
      'coaching.services.2.title',
      'coaching.services.2.picture',
    ]);
  });

  it('finds the list from the ID of something inside it', async () => {
    render(<EditDrawer host={host(MANY)} />);
    await waitFor(() => expect(screen.getByPlaceholderText(/Find among/)).toBeTruthy());
    await userEvent.setup().type(screen.getByPlaceholderText(/Find among/), 'coaching.services.2.picture');
    expect(screen.queryByLabelText('Hero heading')).toBeNull();
    expect(screen.getByText('coaching.services.2.picture')).toBeTruthy();
  });
});
