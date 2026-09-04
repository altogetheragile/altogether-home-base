import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { IsoZoo } from './IsoZoo';
import { initialZooState } from './config';
import type { BacklogItem, ZooGameState } from './types';

// Done work is real. A site is a promise.
//
// They stand on the same ground, which is honest and, when the question is "what have we actually
// delivered", unhelpful. So a site says what it is and says it is not Done; the Increment is
// counted without it; and the Review, which exists to inspect the Increment, hides the promises.

const DONE = 'e-done';
const SITE = 'e-site';

function park(): ZooGameState {
  const base = initialZooState(3);
  const enc = (over: Partial<BacklogItem>): BacklogItem => ({
    id: 'x', name: 'Habitat', zone: 'Big Cats', category: 'enclosure', status: 'open',
    points: 3, acceptance: [], acConfirmed: [], tasks: [], enclosureSize: 'medium', ...over,
  } as BacklogItem);
  return {
    ...base,
    backlog: [
      enc({ id: DONE, name: 'Lion Enclosure', status: 'open', pos: { x: 220, y: 220 } }),
      // Started, not finished: a building site.
      enc({ id: SITE, name: 'Tiger Enclosure', status: 'committed', started: true,
        sprintNumber: base.sprintNumber, pos: { x: 520, y: 380 } }),
    ],
  } as ZooGameState;
}

const drawn = (state: ZooGameState, incrementOnly = false) =>
  render(<IsoZoo state={state} height={460} incrementOnly={incrementOnly} />).container;

describe('a site is not the Increment', () => {
  it('says what is being built there, and that it is not Done', () => {
    // Orange hoardings say "something is happening here". They do not say what, or that what is
    // standing there does not count yet.
    const text = [...drawn(park()).querySelectorAll('text')].map((t) => t.textContent);
    expect(text, 'the site does not say what is being built').toContain('Tiger Enclosure');
    expect(text.join(' '), 'the site does not say it is unfinished').toMatch(/built, not Done/);
  });

  it('says nothing of the sort over work that is Done', () => {
    const text = [...drawn(park()).querySelectorAll('text')].map((t) => t.textContent);
    expect(text, 'delivered work was labelled as a building site').not.toContain('Lion Enclosure');
  });

  it('takes the promises away when the Increment is what you asked for', () => {
    const only = [...drawn(park(), true).querySelectorAll('text')].map((t) => t.textContent).join(' ');
    expect(only, 'a site was still standing in the Increment').not.toMatch(/Tiger Enclosure|built, not Done/);
    // ...and what was delivered is still there.
    const before = drawn(park()).innerHTML.length;
    const after = drawn(park(), true).innerHTML.length;
    expect(after, 'hiding the sites emptied the park').toBeGreaterThan(before * 0.4);
  });

  it('draws nothing different when there is nothing being built', () => {
    // The switch is about sites. With none, both answers are the same park.
    const settled = { ...park(), backlog: park().backlog.filter((it) => it.id !== SITE) } as ZooGameState;
    expect(drawn(settled, true).innerHTML).toBe(drawn(settled, false).innerHTML);
  });
});
