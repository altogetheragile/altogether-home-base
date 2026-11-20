import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useAiSeats } from './useZooSession';
import { aiTurn, SOLO_AI_SEATS } from './aiSeats';
import { initialZooState, starterBacklog } from './config';
import { planSprint, startItem, availableItems, askToCheck, setDraftDesign } from './engine';
import { reducer } from './useZooGame';
import { handover } from './handover';
import type { SeatName } from './useZooSessions';
import type { ZooAction, ZooGameState } from './types';

// Alone, the game plays Priya, and every Product Owner decision is hers.
//
// It used to be the other way round: accepting work and calling the Sprint Goal were left to the
// player ("The PO automatically approved a built card. I'd prefer to keep the decision action using
// the message centre"), so a solo player, who is the Scrum Master and the Developers, kept being
// asked "Your move - Product Owner". Reversed on 18 Nov 2026: "Let the game act as Priya on all PO
// decisions - it gets confusing. Priya should suggest Sprint Goals but the team (me) need to agree."

const sprint = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(1);
  const picks = availableItems(base).slice(0, 4).map((it) => it.id);
  return { ...planSprint(base, picks), phase: 'sprint', dayStage: 'building', dayNumber: 1, ...over } as ZooGameState;
};
/** Work built and offered to the Product Owner. */
const offered = (): ZooGameState => {
  const s = sprint();
  const item = s.backlog.find((it) => it.status === 'committed' && it.sprintNumber === s.sprintNumber)!;
  // Built, with nothing the park says fails: only a judgement left, which is what she is asked for.
  // (She sends back work the park says fails - see sayWhatFails.test.tsx.)
  const built = setDraftDesign(startItem(s, item.id), item.id, { parts: {}, colors: {} } as never);
  const judged = { ...built, backlog: built.backlog.map((it) => (it.id === item.id ? { ...it, design: it.draftDesign, acceptance: ['Can I get what I came for?'], acConfirmed: [] } : it)) };
  return askToCheck(judged, item.id);
};

/** The solo game's AI beat: Priya's seat, with nothing held back for the player. (ZooGame holds
 *  only her starter Backlog, until the team has met - see meetTheTeam.test.tsx.) */
const run = (state: ZooGameState) => {
  vi.useFakeTimers();
  const sent: ZooAction[] = [];
  const session = { state, drivesClock: true, sendAs: (_seat: SeatName, action: ZooAction) => { sent.push(action); } };
  renderHook(() => useAiSeats(session, SOLO_AI_SEATS));
  act(() => { vi.advanceTimersByTime(20000); });
  vi.useRealTimers();
  return sent.filter((a) => a.type !== 'SAY');
};

describe('Priya decides, when you play alone', () => {
  afterEach(() => vi.useRealTimers());

  it('accepts work she has been asked to check', () => {
    expect(run(offered()).some((a) => a.type === 'ANSWER_QUESTION' && 'choice' in a && a.choice === 'accept'),
      'a built card waits on a Product Owner decision the player is no longer asked to make').toBe(true);
  });

  it('hands a question about how it gets built straight back', () => {
    // The one answer in that seat that teaches by being on the receiving end of it.
    const q = { id: 'fence-x', of: 'product_owner' as const, text: 'Rounded or square?', from: 'Ada', askedAt: 0,
      choices: [{ key: 'theirs', label: 'Your call' }, { key: 'round', label: 'Rounded' }] };
    const move = aiTurn(sprint({ questions: [q] } as never), 'product_owner');
    expect(move?.action).toMatchObject({ type: 'ANSWER_QUESTION', id: 'fence-x', choice: 'theirs' });
  });

  it('opens Done work herself', () => {
    const s = sprint();
    const it = s.backlog.find((x) => x.status === 'committed')!;
    const done = { ...s, backlog: s.backlog.map((x) => (x.id === it.id ? { ...x, status: 'done' as const, acceptance: ['Can I see it?'], acConfirmed: [true], signedOff: true, tasks: [] } : x)) };
    expect(aiTurn(done, 'product_owner')?.action).toEqual({ type: 'OPEN_ITEM', id: it.id, by: 'product_owner' });
  });
});

describe('the Sprint Goal: Priya suggests it, the team agrees it', () => {
  const planning = (over: Partial<ZooGameState> = {}): ZooGameState =>
    ({ ...initialZooState(1), backlog: starterBacklog(), phase: 'planning', planningTopic: 'why', sprintGoal: '', sprintGoalAgreed: [], sprintNumber: 1, ...over } as ZooGameState);

  it('offers words to start from', () => {
    const move = aiTurn(planning(), 'product_owner');
    expect(move?.action).toMatchObject({ type: 'SET_SPRINT_GOAL', suggested: true });
    expect((move?.action as { goal: string }).goal.trim()).not.toBe('');
  });

  it('agrees her own suggestion, and leaves the team to agree it', () => {
    const suggested = reducer(planning(), aiTurn(planning(), 'product_owner')!.action);
    expect(suggested.sprintGoalSuggestedIn).toBe(1);
    expect(aiTurn(suggested, 'product_owner')?.action).toEqual({ type: 'AGREE_SPRINT_GOAL', seat: 'product_owner' });
    // Nothing in Priya's seat agrees for the Developers.
    const agreed = reducer(suggested, { type: 'AGREE_SPRINT_GOAL', seat: 'product_owner' });
    expect(agreed.sprintGoalAgreed).toEqual(['product_owner']);
  });

  it('says she has put one in the box, rather than asking what the Sprint is for', () => {
    const suggested = reducer(planning(), aiTurn(planning(), 'product_owner')!.action);
    expect(handover(suggested)?.says).toMatch(/put a Sprint Goal in the box/);
    expect(handover(suggested)?.says).not.toMatch(/What should this Sprint be for/);
  });

  it('does not fill the box again once the team has cleared it to write its own', () => {
    expect(aiTurn(planning({ sprintGoalSuggestedIn: 1 }), 'product_owner')?.action.type).not.toBe('SET_SPRINT_GOAL');
  });
});
