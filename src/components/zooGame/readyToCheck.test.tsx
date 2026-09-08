import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ParkPlan } from './ParkPlan';
import { CardDialog } from './CardDialog';
import { checkCriterion } from './parkChecks';
import { initialZooState } from './config';
import { presetFor, addWaterTo, addFloraTo } from './design';
import type { ZooGameState, BacklogItem } from './types';

// Finished work can always be offered to the Product Owner.
//
// Reported from playing it: "I'm stuck - I can't complete the final task and get it to Done." The
// habitat was built, three of its four criteria were green, and the fourth was "can I walk right
// round it?" - a judgement, which the park has no answer for and never will. The pill waited for
// every criterion to go green, so it never offered the item to anybody, and a finished Sprint had
// no way to finish. Ready now means the facts are in; the judgement is what the asking is FOR.

const built = (): { s: ZooGameState; item: BacklogItem } => {
  const base = initialZooState(3);
  const h = base.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
  const preset = presetFor(h);
  const design = {
    ...preset,
    colors: { ...preset.colors, ground: '#c8a06a' },
    flora: addFloraTo({ ...preset, flora: [] }, 'rocks'),
    water: addWaterTo({ ...preset, water: [] }),
  };
  const item = {
    ...h, status: 'committed' as const, sprintNumber: 1, started: true, design,
    pos: { x: 300, y: 300 }, assignedDevs: [base.team.developers[0].id],
  } as BacklogItem;
  return {
    s: {
      ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
      committedIds: [h.id], backlog: base.backlog.map((it) => (it.id === h.id ? item : it)),
    } as ZooGameState,
    item,
  };
};

const plan = (s: ZooGameState, props: Record<string, unknown> = {}) => render(
  <ParkPlan state={s} {...props} />,
);

describe('a habitat with nothing left but somebody else’s judgement', () => {
  it('has a criterion the park will never answer', () => {
    const { s, item } = built();
    expect(checkCriterion(s, item, 'Can I walk right round it?'),
      'the park claimed to answer a judgement').toBeNull();
  });

  it('is offered to the Product Owner anyway', () => {
    const onAskToCheck = vi.fn();
    const { s, item } = built();
    const { container } = plan(s, { onAskToCheck });
    const pill = container.querySelector('[data-part="built-pill"]')!;
    expect(pill.getAttribute('data-ready'), 'finished work could not be offered to anybody').toBe('yes');
    expect(pill.textContent, 'the pill does not say who the last word belongs to').toMatch(/judges the rest/);
    fireEvent.pointerDown(pill);
    expect(onAskToCheck, 'pressing the pill asked nobody anything').toHaveBeenCalledWith(item.id);
  });

  it('still waits while a fact is missing, and says which', () => {
    const { s, item } = built();
    const bare = {
      ...s,
      backlog: s.backlog.map((it) => (it.id === item.id
        ? { ...it, design: { ...item.design!, water: [] } } : it)),
    } as ZooGameState;
    const { container } = plan(bare);
    const pill = container.querySelector('[data-part="built-pill"]')!;
    expect(pill.getAttribute('data-ready'), 'a habitat with no water was ready for sign-off').toBe('no');
    expect(pill.textContent).toMatch(/no water yet/);
  });
});

describe('asking from the card, not only from the park', () => {
  it('offers the ask where the learner is actually looking', () => {
    // Reported after the pill was fixed: "I still cannot complete the enclosure - how does Priya
    // approve the last AC?" The route existed, on a pill on the park, which is not where anybody is
    // when they are reading the card.
    const onAskToCheck = vi.fn();
    const { s, item } = built();
    render(<CardDialog state={s} item={item} onClose={() => {}} onBuilding={() => {}} onAskToCheck={onAskToCheck} />);
    const ask = document.querySelector('[data-part="ask-to-check"]') as HTMLButtonElement;
    expect(ask, 'built work could only be offered from the park').toBeTruthy();
    expect(ask.textContent).toMatch(/Ask Priya to check it/);
    fireEvent.click(ask);
    expect(onAskToCheck).toHaveBeenCalledWith(item.id);
  });

  it('says who it is waiting on once it has been asked', () => {
    const { s, item } = built();
    const asked = { ...s, questions: [{ id: `check-${item.id}` }] } as unknown as ZooGameState;
    render(<CardDialog state={asked} item={item} onClose={() => {}} onBuilding={() => {}} onAskToCheck={() => {}} />);
    expect(document.querySelector('[data-part="ask-to-check"]'), 'it could be asked twice').toBeNull();
    expect(document.body.textContent).toMatch(/Waiting on Priya to look at it/);
  });

  it('does not offer it while a fact is still missing', () => {
    const { s, item } = built();
    const bare = { ...item, design: { ...item.design!, water: [] } } as BacklogItem;
    render(<CardDialog state={s} item={bare} onClose={() => {}} onBuilding={() => {}} onAskToCheck={() => {}} />);
    expect(document.querySelector('[data-part="ask-to-check"]'),
      'half-built work was offered for sign-off').toBeNull();
  });
});
