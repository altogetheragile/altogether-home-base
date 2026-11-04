import { describe, it, expect, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SplitPanes } from './SplitPanes';

// The panes beside each other have a bar between them that drags (asked for from Refinement, where
// the Definition of Done was too narrow to read). Stacked on a narrow screen, there is no bar.

const wide = (on: boolean) => vi.stubGlobal('matchMedia', (q: string) => ({
  matches: on, media: q, addEventListener: () => {}, removeEventListener: () => {},
}));

afterEach(() => vi.unstubAllGlobals());

describe('panes you can resize', () => {
  it('have a bar to drag between them on a wide screen', () => {
    wide(true);
    const c = render(<SplitPanes id="t" sizes={[60, 40]} first={<p>list</p>} second={<p>done</p>} />).container;
    const bar = c.querySelector('[data-part="split-bar"]');
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute('aria-label')).toBe('Drag to resize');
    expect(c.textContent).toBe('listdone');
  });

  it('stack with no bar on a narrow screen, as the screen was before', () => {
    wide(false);
    const c = render(<SplitPanes id="t" sizes={[60, 40]} stackedClassName="grid gap-3" first={<p>list</p>} second={<p>done</p>} />).container;
    expect(c.querySelector('[data-part="split-bar"]')).toBeNull();
    expect((c.firstChild as HTMLElement).className).toBe('grid gap-3');
  });

  it('have no bar when there is only one pane', () => {
    wide(true);
    const c = render(<SplitPanes id="t" sizes={[60, 40]} first={<p>board</p>} second={false} />).container;
    expect(c.querySelector('[data-part="split-bar"]')).toBeNull();
  });
});
