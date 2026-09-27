import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PictureBox } from '@altogether/ui/editor/PictureBox';

// The site has had an asset library in Admin for a long time, and no way to reach it from the
// page. This box could only ever add: reusing last week's picture meant finding the file again
// and uploading a second copy, and anything uploaded here never appeared in the library at all.

const LIBRARY = [
  { url: 'https://example.com/a.png', title: 'Dandelions', description: 'Seed heads on a pale ground' },
  { url: 'https://example.com/b.png', title: 'Harbour', description: null },
];

const box = (props: Partial<React.ComponentProps<typeof PictureBox>> = {}) => {
  const onChange = vi.fn();
  render(
    <PictureBox
      value=""
      onChange={onChange}
      upload={vi.fn(async () => 'https://example.com/new.png')}
      pictures={vi.fn(async () => LIBRARY)}
      {...props}
    />,
  );
  return onChange;
};

describe('the picture box knows what you have', () => {
  it('offers to choose, as well as to upload', () => {
    box();
    expect(screen.getByRole('button', { name: /Choose/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Upload/ })).toBeTruthy();
  });

  it('does not offer it in a host that cannot list them', () => {
    // Better than a button that opens an empty panel and looks broken.
    box({ pictures: undefined });
    expect(screen.queryByRole('button', { name: /Choose/ })).toBeNull();
  });

  it('asks for the list only when somebody opens it', async () => {
    // Most fields are words. Listing the library on every drawer opening fetches it to draw nothing.
    const pictures = vi.fn(async () => LIBRARY);
    render(<PictureBox value="" onChange={vi.fn()} upload={vi.fn()} pictures={pictures} />);
    expect(pictures).not.toHaveBeenCalled();
    await userEvent.setup().click(screen.getByRole('button', { name: /Choose/ }));
    await waitFor(() => expect(pictures).toHaveBeenCalledTimes(1));
  });

  it('puts a chosen picture in the field', async () => {
    const onChange = box();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Choose/ }));
    await waitFor(() => expect(screen.getByTitle('Dandelions')).toBeTruthy());
    await user.click(screen.getByTitle('Dandelions'));
    expect(JSON.parse(onChange.mock.calls[0][0])).toEqual({
      src: 'https://example.com/a.png',
      // The library's description becomes the alt text when the field has none of its own.
      alt: 'Seed heads on a pale ground',
    });
  });

  it('keeps alt text already written here, which is about this picture in this place', async () => {
    const onChange = box({ value: JSON.stringify({ src: 'https://example.com/old.png', alt: 'Fiona at work' }) });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Choose/ }));
    await waitFor(() => expect(screen.getByTitle('Dandelions')).toBeTruthy());
    await user.click(screen.getByTitle('Dandelions'));
    expect(JSON.parse(onChange.mock.calls[0][0]).alt).toBe('Fiona at work');
  });

  it('says so plainly when there is nothing to choose from', async () => {
    render(<PictureBox value="" onChange={vi.fn()} upload={vi.fn()} pictures={vi.fn(async () => [])} />);
    await userEvent.setup().click(screen.getByRole('button', { name: /Choose/ }));
    await waitFor(() => expect(screen.getByText(/Nothing uploaded yet/)).toBeTruthy());
  });
});

describe('an upload joins the library', () => {
  it('is recorded by both hosts, not just put in the bucket', async () => {
    // A picture added from the drawer used to leave nothing behind but a URL in one field, so it
    // never appeared in Admin and could never be found again.
    const { readFileSync } = await import('node:fs');
    for (const host of ['apps/web/src/components/edit/EditThisPage.tsx', 'src/components/edit/EditThisSite.tsx']) {
      const src = readFileSync(host, 'utf8');
      expect(src, `${host} uploads without recording it`).toContain("from('media_assets').insert");
      expect(src, `${host} cannot list what this site has`).toContain('pictures:');
    }
  });
});
