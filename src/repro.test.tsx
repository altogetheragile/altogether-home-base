import { it } from 'vitest';
import { render } from '@testing-library/react';
import { IsoZoo } from './components/zooGame/IsoZoo';
import { initialZooState } from './components/zooGame/config';
import type { ZooGameState, BacklogItem } from './components/zooGame/types';

const it_ = (over: Partial<BacklogItem>): BacklogItem => ({
  id: 'x', name: 'Thing', zone: 'Big Cats', category: 'enclosure',
  acceptance: [], acConfirmed: [], tasks: [], ...over,
} as BacklogItem);

it('the state on the screen', () => {
  // Enclosure: Done, not open. Lion: in Doing, a family, Black chosen - so it is a DRAFT design.
  const s = {
    ...initialZooState(), zones: ['Big Cats'],
    backlog: [
      it_({ id: 'enc', name: 'Lion Enclosure', status: 'done', started: true, sprintNumber: 1,
        enclosureSize: 'large', pos: { x: 400, y: 800 },
        design: { parts: {}, colors: { ground: '#c9a86a', fence: '#8fa3b0' } } }),
      it_({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc',
        status: 'committed', started: true, sprintNumber: 1,
        draftDesign: { parts: {}, colors: { coat: '#2a2622' }, group: { males: 1, females: 2, juveniles: 1, cubs: 2 } } }),
    ],
  } as unknown as ZooGameState;
  const svg = render(<IsoZoo state={s} height={520} />).container.querySelector('svg[role="img"]')!;
  const lions = [...svg.querySelectorAll('[data-spot^="lion:"]')];
  console.log('lions drawn:', lions.length);
  console.log('filters:', lions.map((g) => (g.querySelector('svg') as SVGElement | null)?.style.filter || '(none)').join(' | '));
});
