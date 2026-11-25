import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { initialZooState, DEFAULT_BRIEF } from './config';
import { writeBacklog, splitEpic, estimateItem, setEnclosureSize, outgrown, refinePbi } from './engine';
import { checkCriterion } from './parkChecks';
import { typeLine } from './itemKinds';
import { ShapeChooser } from './ShapeChooser';
import type { ZooGameState, BacklogItem } from './types';

// "It seems unlikely after sizing the items that the enclosure size would be set. I would say this is
// an initial AC that help determine the story size" (Al, 25 November 2026).
//
// The size a habitat is asked to be is on it from the moment it is split out, shown on its card, and
// part of what "Can an animal move about in here?" checks. The Developers still build the footprint,
// and a different one does not meet the criterion. Topic three no longer asks for a size.

const asks = 'Can an animal move about in here?';
const split = (): ZooGameState => {
  const w = writeBacklog({ ...initialZooState(1), backlog: [] } as ZooGameState, DEFAULT_BRIEF);
  return splitEpic(w, 'bigcats', (w.backlog.find((it) => it.id === 'bigcats')?.epicMembers ?? []).map((m) => m.id));
};
const habitat = (s: ZooGameState): BacklogItem => s.backlog.find((it) => it.category === 'enclosure')!;

describe('the size asked for', () => {
  it('is on a habitat from the moment it is split out, before it is sized', () => {
    const h = habitat(split());
    expect(h.unsized).toBe(true);
    expect(h.askedSize, 'a habitat arrived with no size asked for').toMatch(/small|medium|large/);
    expect(h.enclosureSize, 'the footprint is still the Developers’ to build').toBeUndefined();
  });

  it('is on its card, where it is read when it is sized', () => {
    const h = habitat(split());
    expect(typeLine(h)).toMatch(new RegExp(`^${h.askedSize![0].toUpperCase()}${h.askedSize!.slice(1)} habitat`));
  });

  it('is what the work is reckoned against, so sizing it does not read as the item changing', () => {
    const s = split();
    const h = habitat(s);
    expect(outgrown(estimateItem(s, h.id, 5).backlog.find((it) => it.id === h.id)!)).toBeNull();
  });

  it('can be refined, and then the points no longer describe it', () => {
    const s0 = split();
    const h0 = habitat(s0);
    const s = estimateItem(s0, h0.id, 5);
    const other = h0.askedSize === 'small' ? 'large' : 'small';
    const refined = refinePbi(s, h0.id, { name: h0.name, category: 'enclosure', zone: h0.zone!, acceptance: h0.acceptance ?? [], enclosureSize: other });
    const h = habitat(refined);
    expect(h.askedSize).toBe(other);
    expect(outgrown(h), 'asked for a different size and the points stood').toBeTruthy();
  });
});

describe('"Can an animal move about in here?"', () => {
  const at = (built?: 'small' | 'medium' | 'large') => {
    let s = split();
    const h = habitat(s);
    if (built) s = setEnclosureSize(s, h.id, built);
    return { s, h: habitat(s), asked: h.askedSize! };
  };

  it('says what was asked for while nothing is built', () => {
    const { s, h, asked } = at();
    const v = checkCriterion(s, h, asks)!;
    expect(v.met).toBe(false);
    expect(v.evidence).toBe(`no footprint built yet - ${asked} was asked for, under Size`);
  });

  it('is not met by a footprint of a different size', () => {
    const { asked } = at();
    const other = asked === 'small' ? 'large' : 'small';
    const { s, h } = at(other);
    const v = checkCriterion(s, h, asks)!;
    expect(v.met).toBe(false);
    expect(v.evidence).toBe(`built ${other}, ${asked} was asked for - change it under Size, or refine the criteria with the Product Owner`);
  });

  it('goes on to the animals once the footprint is the size asked for', () => {
    const { asked } = at();
    const { s, h } = at(asked);
    expect(checkCriterion(s, h, asks)!.evidence).not.toMatch(/was asked for/);
  });
});

describe('topic three', () => {
  it('says the size asked for rather than asking for one', () => {
    const h = habitat(split());
    const c = render(<ShapeChooser item={h} enclosures={[]} onPlan={() => {}} />).container;
    expect(c.querySelector('[data-part="asked-size"]')?.textContent).toMatch(/was asked for, in its acceptance criteria/);
    expect(c.querySelectorAll('button'), 'a size picker is still offered after the item was sized').toHaveLength(0);
  });
});
