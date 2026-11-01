import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ActionRail } from './ActionRail';
import { TeamChat } from './TeamChat';
import { YouContext } from './you';
import { initialZooState } from './config';
import type { ZooGameState } from './types';
import type { SeatName } from './useZooSessions';

// "The message board is all messed up and unreadable. It is also hard to know there is an action
// required. Can messages of different types be distinct?" Three kinds now, drawn three ways: what
// needs you, what is waiting on somebody else, and nothing asked at all.

const asked = (): ZooGameState => {
  const s = initialZooState(3);
  const item = s.backlog.find((it) => !it.unsized && it.category === 'enclosure')!;
  return {
    ...s, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1, daySecondsLeft: 80,
    questions: [{ id: 'q1', of: 'product_owner', from: 'Ada', itemId: item.id, text: 'Rounded or square?',
      askedAt: 80, choices: [{ key: 'rounded', label: 'Rounded' }, { key: 'theirs', label: 'Your call' }], day: 1 }],
  } as unknown as ZooGameState;
};
const rail = (state: ZooGameState, seat: SeatName | null = null) => render(
  <MemoryRouter><YouContext.Provider value={seat ? 'p-me' : null}>
    <ActionRail state={state} seat={seat} onAnswerQuestion={() => {}} />
  </YouContext.Provider></MemoryRouter>).container.querySelector('[data-part="action-rail"]')!;

describe('what needs you', () => {
  it('says so, in a solid card with the answers on it', () => {
    const r = rail(asked());
    expect(r.getAttribute('data-kind')).toBe('yours');
    expect(r.querySelector('[data-part="rail-yours"]')?.textContent).toBe('Your move');
    expect([...r.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Rounded', 'Your call']);
  });

  it('names who is asking, in the colour they wear', () => {
    const chip = rail(asked()).querySelector('[data-part="rail-actor"]')!;
    expect(chip.textContent).toBe('Product Owner');
    expect(chip.className).toMatch(/bg-primary\/15/);
  });
});

describe('what is waiting on somebody else', () => {
  it('is quiet, says who, and offers no buttons to answer for them', () => {
    const r = rail(asked(), 'developer');
    expect(r.getAttribute('data-kind')).toBe('waiting');
    expect(r.querySelector('[data-part="rail-waiting"]')?.textContent).toBe('Waiting on Product Owner');
    expect(r.querySelectorAll('button')).toHaveLength(0);
  });

  it('is the Product Owner’s own move when they are the one sitting there', () => {
    expect(rail(asked(), 'product_owner').getAttribute('data-kind')).toBe('yours');
  });
});

describe('nothing asked', () => {
  it('is one muted line', () => {
    const s = { ...asked(), questions: [] } as unknown as ZooGameState;
    expect(rail(s).getAttribute('data-kind')).toBe('quiet');
  });
});

describe('the team chat', () => {
  it('puts what needs answering above the conversation, not under it', () => {
    const c = render(<TeamChat state={asked()} rail={<div data-part="pinned" />} />).container;
    const chat = c.querySelector('[data-part="team-chat"]')!;
    expect(chat.firstElementChild?.getAttribute('data-part')).toBe('pinned');
  });
});
