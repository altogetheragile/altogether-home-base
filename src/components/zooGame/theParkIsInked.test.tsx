import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { IsoZoo } from './IsoZoo';
import { initialZooState } from './config';
import type { BacklogItem, ZooGameState } from './types';

// Style C (26 Oct 2026): the park is drawn in ink. Shapes drawn in code get an inked edge laid
// over them; licensed artwork gets an outline from a filter. Either can be lost by a refactor that
// goes back to a bare <polygon> or a bare nested <svg>, and nothing else would notice.

const item = (o: Partial<BacklogItem>): BacklogItem => ({
  id: 'x', name: 'Thing', zone: 'Big Cats', category: 'enclosure', status: 'open',
  points: 3, acceptance: [], acConfirmed: [], tasks: [], ...o,
} as BacklogItem);

const zoo = (): ZooGameState => ({
  ...initialZooState(), zones: ['Big Cats'],
  backlog: [
    item({ id: 'enc', name: 'Lion Enclosure', enclosureSize: 'large', pos: { x: 300, y: 240 } }),
    item({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc' }),
    item({ id: 'shop', name: 'Gift Shop', category: 'amenity', template: 'shop', pos: { x: 600, y: 300 },
      design: { parts: { type: 'shop' }, colors: { walls: '#dfe6ea', roof: '#4d7ea8' } } }),
  ],
} as unknown as ZooGameState);

describe('the park is inked', () => {
  it('lays an ink line over what it draws, the same width at every zoom', () => {
    const { container } = render(<IsoZoo state={zoo()} height={460} />);
    const ink = [...container.querySelectorAll('path[data-ink]')];
    expect(ink.length, 'nothing drawn in code has an inked edge').toBeGreaterThan(10);
    for (const p of ink) expect(p.getAttribute('vector-effect')).toBe('non-scaling-stroke');
  });

  it('outlines the licensed artwork, the animals included', () => {
    const { container } = render(<IsoZoo state={zoo()} height={460} />);
    expect(container.querySelector('filter#zoo-ink-art'), 'the ink filter is not in the scene').toBeTruthy();
    const art = [...container.querySelectorAll('svg[role="img"] svg[viewBox]')];
    expect(art.length).toBeGreaterThan(0);
    const bare = art.filter((el) => !el.closest('g[filter="url(#zoo-ink-art)"]'));
    expect(bare.length, `${bare.length} drawings have no ink outline`).toBe(0);
  });
});
