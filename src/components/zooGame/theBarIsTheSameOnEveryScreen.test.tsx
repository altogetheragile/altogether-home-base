import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BackButton } from './ActionBar';

// The bar at the foot of every screen says the same things in the same way: Back, naming where it
// goes, and the one button that moves the game on. Asked for while playing it: "make sure there is
// uniformity across screens, e.g. removing text from the navigation and relabelling the back
// button." Each screen had grown its own sentence beside the button - "Pick at least one item to
// continue", "4 without steps yet. Fine to start." - which the screen's own "Your move" already said.

const dir = __dirname;
const screens = readdirSync(dir).filter((f) => f.endsWith('.tsx') && !f.includes('.test.'));
const source = (f: string) => readFileSync(join(dir, f), 'utf8');

describe('the bar at the foot of every screen', () => {
  it('says where Back goes', () => {
    const { container } = render(<BackButton to="Topic 2" onClick={() => {}} />);
    expect(container.textContent).toBe('← Back to Topic 2');
  });

  it('has no bare Back on any screen', () => {
    const bare = screens.filter((f) => /&larr;\s*Back<\/Button>/.test(source(f)));
    expect(bare, 'a screen draws its own Back that says nowhere').toEqual([]);
  });

  it('carries no sentence of its own on any screen', () => {
    // Text spans written inside the bar, beside the button.
    const chatty = screens.filter((f) => {
      const s = source(f);
      const at = s.indexOf('<ActionBar');
      if (at < 0) return false;
      // One exception, and only in a shared game: who the forecast is waiting on, beside the "I
      // agree" button that answers it. That is the state of the button, not advice about it.
      const bar = s.slice(at, s.indexOf('</ActionBar>', at)).replace(/<span data-part="forecast-agreement"[^>]*>/g, '');
      return /<span[^>]*text-\[11px\][^>]*text-muted-foreground/.test(bar);
    });
    expect(chatty, 'a screen writes an explanation into the bar').toEqual([]);
  });
});
