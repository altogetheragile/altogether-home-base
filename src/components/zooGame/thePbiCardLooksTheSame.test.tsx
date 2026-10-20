import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PbiCard, type PbiState } from './PbiCard';
import { initialZooState } from './config';
import type { BacklogItem } from './types';

// The zoo's card is moving onto a shell the backlog tool shares (docs/ZOO_PO_ROUTE.md, One Item,
// One Look). The zoo must not change by a pixel in the move, so its markup is pinned here: every
// state, every density, an epic, a sized and an unsized item, with every slot filled. Same
// markup and classes, same look. A deliberate change to the card updates the snapshot.

const backlog = initialZooState(3).backlog as BacklogItem[];
const sized = backlog.find((i) => !i.unsized && i.category !== 'epic')!;
const epic = backlog.find((i) => i.category === 'epic') ?? backlog[0];
const unsized = { ...sized, id: 'unsized', unsized: true } as BacklogItem;

const STATES: PbiState[] = ['backlog', 'locked', 'forecast', 'doing', 'built', 'live'];
const DENSITIES = ['line', 'row', 'card'] as const;

describe('the PBI card looks the same', () => {
  for (const item of [sized, epic, unsized]) {
    for (const density of DENSITIES) {
      it(`${item.category} ${item.unsized ? 'unsized' : 'sized'}, ${density}`, () => {
        const html = STATES.map((state) => render(
          <PbiCard item={item} state={state} density={density}
            lead={<i>lead</i>} trailing={<b>trailing</b>} badges={<u>badge</u>}
            note="a note" detail={<p>detail</p>} onClick={() => {}} label="Open it" className="extra" />,
        ).container.innerHTML);
        expect(html).toMatchSnapshot();
      });
    }
  }

  it('bare, with nothing in its slots', () => {
    expect(render(<PbiCard item={sized} />).container.innerHTML).toMatchSnapshot();
  });
});
