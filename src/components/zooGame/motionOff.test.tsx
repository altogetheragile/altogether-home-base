import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ParkView } from './ParkView';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// The game saying what it knows.
//
// Somebody with motion turned down on their machine gets a zoo where nothing moves: the visitors
// stand where they had got to and the animals stand on their marks. That is the right thing to do
// with the setting and the wrong thing to do silently - the first person to notice asked "can the
// people and animals on the isometric view be animated at all?", and the answer was yes, and they
// were switched off, and nothing on the screen said so.

const park = (): ZooGameState => ({ ...initialZooState(3), phase: 'sprint' } as ZooGameState);

const withMotion = (reduce: boolean, fn: () => void) => {
  const was = window.matchMedia;
  window.matchMedia = ((q: string) => ({ matches: reduce && /reduce/.test(q), media: q,
    addEventListener: () => {}, removeEventListener: () => {} })) as unknown as typeof window.matchMedia;
  try { fn(); } finally { window.matchMedia = was; }
};

describe('a zoo that is standing still', () => {
  it('says why', () => {
    withMotion(true, () => {
      const { container } = render(<ParkView state={park()} large focus increment />);
      const said = container.querySelector('[data-part="motion-off"]');
      expect(said, 'nothing moves and nothing says why').toBeTruthy();
      expect(said!.textContent, 'it does not say what would move, or what stopped it')
        .toMatch(/reduce motion/i);
    });
  });

  it('says nothing when everything is moving, because then there is nothing to say', () => {
    withMotion(false, () => {
      const { container } = render(<ParkView state={park()} large focus increment />);
      expect(container.querySelector('[data-part="motion-off"]'),
        'a zoo full of people walking about apologised for standing still').toBeNull();
    });
  });
});
