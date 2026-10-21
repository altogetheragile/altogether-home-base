import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { ItemRows } from '@altogether/ui/editor/ItemRows';

// Every picture on a page is one somebody can change from that page.
//
// The coaching page drew its illustration from a path written into the page, so every site had it
// and none could change it. The About badges were picture addresses typed into a line of text. And
// a service's own picture box was invisible until a service existed, so somebody looking for it
// concluded, reasonably, that there was no such thing.

const ROOT = join(__dirname, '..', '..');

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe('every picture can be changed', () => {
  it('no page or component names a picture file of its own', () => {
    // The hero's srcset is the one exception, and it only applies when the stored value is that
    // same file: it offers sizes of a picture somebody chose, rather than choosing one.
    const offenders = [...sources(join(ROOT, 'app')), ...sources(join(ROOT, 'components'))]
      .flatMap((file) =>
        readFileSync(file, 'utf8').split('\n')
          .map((line, i) => ({ line, at: `${file.slice(ROOT.length + 1)}:${i + 1}` }))
          .filter(({ line }) => /['"`(]\/images\/[^'"`)]+\.(webp|png|jpe?g|svg|gif)/.test(line))
          .filter(({ line }) => !/heroBg\.src === |hero-bg-\d+\.webp \d+w/.test(line)),
      )
      .map(({ at }) => at);
    expect(offenders).toEqual([]);
  });

  it('an empty list says what each row will hold, picture included', () => {
    render(
      <ItemRows
        value=""
        fields={[{ key: 'title', label: 'Service name' }, { key: 'image', label: 'Picture', type: 'image' }]}
        onChange={() => {}}
        upload={async () => ''}
      />,
    );
    expect(screen.getByText(/each one you add has service name and picture/i)).toBeTruthy();
  });
});
