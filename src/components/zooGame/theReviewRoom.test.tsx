import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { initialZooState } from './config';
import {
  reviewSprint, openReview, openGround, drawStakeholders, lineFor, yourReviewTurn,
  openRetro, STAKEHOLDERS_AT_A_REVIEW,
} from './engine';
import { reducer } from './useZooGame';
import { plotOrder } from './parkZones';
import { STAKEHOLDERS, STAKEHOLDER_LINES } from './stakeholders';
import { SprintReview } from './SprintReview';
import type { ZooGameState, ChatKind } from './types';

// The people the Sprint Review is held for.
//
// "The Scrum Team presents the results of their work to key stakeholders and progress toward the
// Product Goal is discussed." The game had the results and it had the progress; what it never had
// was anybody in the room with an opinion about either - so attendance and happiness were two
// numbers on a card, and the event taught that a Review is a report.
//
// The rule that makes them worth having is in `when`: a line only exists when the number behind it
// crossed its threshold. A stakeholder who would say the same thing whatever the zoo was like is
// scenery, and scenery is what makes a Review feel like theatre.

/** A Sprint finished, with work open to visitors, at its Review. */
const reviewed = (seed = 3, over: Partial<ZooGameState> = {}): ZooGameState => {
  let s = initialZooState(seed) as ZooGameState;
  for (const zone of plotOrder(s)) s = openGround({ ...s, value: 99_999 } as ZooGameState, zone);
  const take = s.backlog.filter((it) => !it.unsized && it.category !== 'epic').slice(0, 6);
  s = {
    ...s, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 3, sprintDays: 3,
    daySecondsLeft: 4, forecastPoints: take.reduce((n, it) => n + it.estimate, 0),
    sprintGoal: 'Open the first area with something worth walking to.',
    committedIds: take.map((it) => it.id),
    backlog: s.backlog.map((it) => (take.some((t) => t.id === it.id)
      ? { ...it, status: 'open' as const, sprintNumber: 1, started: true, signedOff: true,
        design: { parts: {}, colors: {} } as never } : it)),
    ...over,
  } as ZooGameState;
  return openReview(reviewSprint(s));
};

const room = (s: ZooGameState) => (s.chat ?? []).filter((m) => m.kind === 'review');

describe('the room at the Review', () => {
  it('fills as the Sprint ends, whichever way it ends', () => {
    // Every door: the button, and the last day simply running out.
    const pressed = reducer(reviewed().phase === 'review' ? reviewed() : reviewed(),
      { type: 'REVIEW_SPRINT' });
    expect(room(reviewed()).length, 'nobody is in the room at the Review').toBeGreaterThan(1);
    expect(pressed.phase).toBe('review');
  });

  it('opens with the Product Owner, on the Sprint Goal', () => {
    // The Goal is the thing being inspected and it is hers to judge. The stakeholders answer the
    // Increment, not her.
    const first = room(reviewed())[0];
    expect(first.who, 'somebody other than the Product Owner opened it').toBe('product_owner');
    expect(first.text, 'she says nothing about the Sprint Goal').toMatch(/Sprint Goal/);
  });

  it('and says, out loud, that nothing here is a sign-off', () => {
    // The commonest thing a Sprint Review turns into. Said by the person who would be asked.
    expect(room(reviewed())[0].text, 'nothing says this is not an approval meeting')
      .toMatch(/Nothing is being signed off/);
  });

  it('gives the verdict the game already reached, rather than a new one', () => {
    const met = reviewed(3);
    expect(room(met)[0].text).toMatch(met.sprintGoalMet === true ? /We met the Sprint Goal/
      : met.sprintGoalMet === false ? /We did not meet the Sprint Goal/ : /no Sprint Goal/);
  });

  it('does not fill up twice when you come back to it', () => {
    const once = reviewed();
    expect(room(openReview(once)).length).toBe(room(once).length);
  });
});

describe('who turns up', () => {
  it('is two or three of them, never the whole town', () => {
    // The number written down, not the number the code happens to use: asking
    // `<= STAKEHOLDERS_AT_A_REVIEW` is the constant checking itself. The spec says two or three -
    // enough that they can disagree, few enough that the Scrum Team can still hear each one.
    expect(STAKEHOLDERS_AT_A_REVIEW, 'a Review has become a public meeting').toBeLessThanOrEqual(3);
    expect(STAKEHOLDERS_AT_A_REVIEW, 'one voice cannot disagree with itself').toBeGreaterThanOrEqual(2);
    const them = room(reviewed()).filter((m) => m.who === 'stakeholder');
    expect(them.length, 'nobody from outside the team came').toBeGreaterThan(0);
    expect(them.length, 'the whole deck turned up').toBeLessThanOrEqual(3);
  });

  it('is the same people on the same seed, so a trainer can replay it', () => {
    expect(drawStakeholders(reviewed(7)).drawn).toEqual(drawStakeholders(reviewed(7)).drawn);
  });

  it('is different people on a different seed', () => {
    const a = drawStakeholders(reviewed(1)).drawn;
    const b = drawStakeholders(reviewed(9)).drawn;
    expect(a.join() === b.join() && a.length === STAKEHOLDERS.length, 'every seed draws the same room')
      .toBe(false);
  });

  it('never twice in one Review', () => {
    const { drawn } = drawStakeholders(reviewed());
    expect(new Set(drawn).size, 'somebody came to the same Review twice').toBe(drawn.length);
  });

  it('and nobody is drawn twice even as the bag runs out', () => {
    // The bag holds six and a Review takes three, so it empties every other Sprint and is
    // refilled mid-draw. That is the moment somebody could be handed out twice.
    const s = reviewed();
    const nearlyEmpty = { ...s, stakeholderBag: [STAKEHOLDERS[0].id] } as ZooGameState;
    const { drawn } = drawStakeholders(nearlyEmpty);
    expect(drawn.length, 'the draw gave up when the bag ran out').toBe(STAKEHOLDERS_AT_A_REVIEW);
    expect(new Set(drawn).size, 'the bag refilled and handed out the same person again')
      .toBe(drawn.length);
  });

  it('and the bag empties before it refills', () => {
    // Without replacement, so over a few Sprints everybody gets a turn rather than the same two
    // arriving every time.
    const s = reviewed();
    const { drawn, bag } = drawStakeholders(s);
    expect(bag.length + drawn.length, 'the bag is not being drawn from')
      .toBeLessThanOrEqual(STAKEHOLDERS.length);
    for (const id of drawn) expect(bag, `${id} is still in the bag after being drawn`).not.toContain(id);
  });

  it('is somebody the game actually has', () => {
    for (const id of drawStakeholders(reviewed()).drawn) {
      expect(STAKEHOLDERS.map((p) => p.id), `${id} is nobody`).toContain(id);
    }
  });
});

describe('what they say', () => {
  it('is only ever true of this zoo', () => {
    // The whole of it. A stakeholder who would say the same thing whatever the zoo was like is
    // scenery, and scenery is what makes a Review feel like theatre.
    const s = reviewed();
    for (const m of room(s).filter((x) => x.who === 'stakeholder')) {
      const who = STAKEHOLDERS.find((p) => m.from.startsWith(p.name))!;
      const line = lineFor(s, who.id)!;
      expect(line, `${who.name} spoke with nothing to say`).toBeTruthy();
      expect(line.when(s, s.lastReview!), `${who.name}'s line is not true of this zoo`).toBe(true);
      expect(m.text).toBe(line.says(s, s.lastReview!));
    }
  });

  it('says nothing at all when the numbers give them no reason to', () => {
    const s = reviewed();
    // A zoo with nothing open: the keeper has no animals to be happy about.
    const empty = { ...s, backlog: s.backlog.map((it) => ({ ...it, status: 'backlog' as const })) } as ZooGameState;
    expect(lineFor(empty, 'keeper')?.id, 'the keeper praised animals that are not there')
      .not.toBe('keeper-happy');
  });

  it('carries a learning point, every one of them', () => {
    // So a trainer can see what the deck covers across a game rather than guessing from the
    // wording.
    for (const l of STAKEHOLDER_LINES) {
      expect(l.learningPoint, `${l.id} teaches nothing in particular`).toBeTruthy();
      expect(STAKEHOLDERS.map((p) => p.id), `${l.id} belongs to nobody`).toContain(l.who);
    }
  });

  it('and answers the Increment rather than the Product Owner', () => {
    const s = reviewed();
    for (const m of room(s).filter((x) => x.who === 'stakeholder')) {
      expect(m.text, `${m.from} is talking about Priya rather than the zoo`)
        .not.toContain(s.team.productOwner.name);
    }
  });
});

describe('your turn', () => {
  const screen = (s: ZooGameState, onSay: (t: string, k?: ChatKind) => void = () => {}) => render(
    <MemoryRouter>
      <SprintReview state={s} onTakeSignal={() => {}} onContinue={() => {}} onWrapUp={() => {}}
        onOpen={() => {}} onConfirmAc={() => {}} onToggleTask={() => {}} onSay={onSay} />
    </MemoryRouter>,
  ).container;

  it('is two halves of the job and one anti-pattern', () => {
    const labels = yourReviewTurn(reviewed()).map((o) => o.label);
    expect(labels).toHaveLength(3);
    expect(labels.join(' '), 'there is no way to say what was built').toMatch(/built/i);
    expect(labels.join(' '), 'there is no way to raise a risk').toMatch(/worries/i);
    expect(labels.join(' '), 'the sign-off anti-pattern is not on offer').toMatch(/sign this off/i);
  });

  it('does not block asking for a sign-off - it answers it', () => {
    // A disabled button teaches less than a plain answer. Nothing stops you asking; what you get
    // back is what a Review is for.
    const ask = yourReviewTurn(reviewed()).find((o) => /sign this off/i.test(o.label))!;
    expect(ask.notScrum, 'asking for approval is blocked rather than answered').toBeTruthy();
    expect(ask.notScrum, 'it does not say what a Review is instead').toMatch(/not an approval gate/);
  });

  it('and the other two carry no telling-off', () => {
    for (const o of yourReviewTurn(reviewed()).filter((x) => !/sign this off/i.test(x.label))) {
      expect(o.notScrum, `"${o.label}" is answered as though it were a mistake`).toBeUndefined();
    }
  });

  it('is drawn, and says what it is when you press it', () => {
    const said: string[] = [];
    const s = reviewed();
    const c = screen(s, (t) => { said.push(t); });
    const turn = c.querySelector('[data-part="review-your-turn"]')!;
    expect(turn, 'everybody speaks but you').toBeTruthy();
    const ask = [...turn.querySelectorAll('button')].find((b) => /sign this off/i.test(b.textContent ?? ''))!;
    fireEvent.click(ask);
    expect(said, 'asking said nothing').toHaveLength(1);
    expect(c.querySelector('[data-part="review-not-a-gate"]')?.textContent,
      'you asked for a sign-off and the game let it pass').toMatch(/not an approval gate/);
  });

  it('shows the room, and says who is in it', () => {
    const c = screen(reviewed());
    const r = c.querySelector('[data-part="review-room"]')!;
    expect(r, 'the Review is a report again: nobody in the room says anything').toBeTruthy();
    expect(r.textContent, 'nothing says this is not a sign-off').toMatch(/nothing here is a sign-off/);
    expect(r.querySelectorAll('[data-part="chat-message"][data-who="stakeholder"]').length,
      'the people the zoo is for are not drawn as being there').toBeGreaterThan(0);
  });
});

describe('and the Retrospective is still the Scrum Team only', () => {
  it('whatever turned up to the Review', () => {
    // The one event the Guide fences. Now that stakeholders exist at all, this is worth holding.
    const s = openRetro({ ...reviewed(), phase: 'retro' } as ZooGameState);
    for (const m of (s.chat ?? []).filter((x) => x.kind === 'retro')) {
      expect(m.who, `a ${m.who} got into the Retrospective`).not.toBe('stakeholder');
    }
  });
});
