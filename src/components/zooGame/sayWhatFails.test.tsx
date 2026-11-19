import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { aiTurn } from './aiSeats';
import { initialZooState } from './config';
import { planSprint, startItem, availableItems, askToCheck, setDraftDesign, whatIsLeft, chooseStructure, setEnclosureSize } from './engine';
import { nextStep, whatToFix, takeWanted } from './nextFix';
import { CardDialog } from './CardDialog';
import { applyParkChecks } from './parkChecks';
import type { ZooGameState } from './types';

// From the scrum-master playtest sm6: seventy steps on "Next: accept 2 more criteria" while the park
// said a lion would be over the 2m fence. "Accept" read as a click; the fix was on the build strip,
// under Perimeter, and nothing said so. And when asked, game-Priya signed the enclosure off anyway.

const HELD = 'Is it bordered safely, with no way out of it?';

/** The Lion Enclosure built behind a 2m fence, with a lion in it, in Doing. */
function behindAFence(): ZooGameState {
  const base = initialZooState(1);
  const habitat = availableItems(base).find((it) => it.category === 'enclosure')!;
  let s = { ...planSprint(base, [habitat.id]), phase: 'sprint', dayStage: 'building', dayNumber: 1 } as ZooGameState;
  s = startItem(s, habitat.id);
  // Built as the playtest built it: everything chosen, and a fence a lion gets over.
  s = chooseStructure(s, habitat.id, 'paddock');
  s = setEnclosureSize(s, habitat.id, 'large');
  s = setDraftDesign(s, habitat.id, {
    parts: { barrier: 'fence', structure: 'paddock' }, colors: { ground: '#c8a06a', fence: '#8a6a3b' },
    water: [{ x: 0.2, y: 0.2, w: 0.3, h: 0.2 }], flora: [{ type: 'rock', x: 0.6, y: 0.6, s: 1 }],
  } as never);
  const lion = s.backlog.find((it) => it.category === 'exhibit' && it.enclosureId === habitat.id)
    ?? s.backlog.find((it) => it.category === 'exhibit')!;
  return applyParkChecks({ ...s, backlog: s.backlog.map((it) => {
    if (it.id === habitat.id) return { ...it, pos: { x: 600, y: 400 }, acceptance: [HELD], acConfirmed: [] };
    if (it.id === lion.id) return { ...it, enclosureId: habitat.id, template: 'lion' };
    return it;
  }) });
}
const habitatOf = (s: ZooGameState) => s.backlog.find((it) => it.acceptance?.[0] === HELD)!;

describe('the card says what fails and where to fix it', () => {
  it('names the fence and the Perimeter control, not "accept"', () => {
    const s = behindAFence();
    expect(whatIsLeft(s, habitatOf(s)), 'the old wording this replaces').toMatch(/^Next: accept 1 more criterion/);
    expect(nextStep(s, habitatOf(s))).toMatch(/^Next: a 2m fence - .* would be over it\. Change it under Perimeter$/);
    expect(whatToFix(s, habitatOf(s))).toMatchObject({ group: 'barrier', where: 'Perimeter' });
  });

  it('reads the build in progress: a failing build is never committed', () => {
    // Found in the browser: the card said "ask Priya" because the helper only looked at the
    // committed design, and a build the park says fails is never committed.
    const s = behindAFence();
    const uncommitted = { ...s, backlog: s.backlog.map((it) => (it.id === habitatOf(s).id
      ? { ...it, draftDesign: it.draftDesign ?? it.design, design: undefined } : it)) } as ZooGameState;
    expect(nextStep(uncommitted, habitatOf(uncommitted))).toMatch(/Change it under Perimeter$/);
  });

  it('says to ask the Product Owner once only judgement is left', () => {
    const s = behindAFence();
    const fenced = { ...s, backlog: s.backlog.map((it) => (it.id === habitatOf(s).id
      ? { ...it, design: { ...it.design!, parts: { ...it.design!.parts, barrier: 'high' } }, acceptance: [HELD, 'Can I walk right round it?'] } : it)) } as ZooGameState;
    expect(whatToFix(fenced, habitatOf(fenced))).toBeNull();
    expect(nextStep(fenced, habitatOf(fenced))).toBe('Next: ask Priya to check it');
  });

  it('offers "Fix it under Perimeter", which asks the build strip to open there', () => {
    const s = behindAFence();
    const item = habitatOf(s);
    let built: string | null = null;
    render(<CardDialog state={s} item={item} onClose={() => {}} onStart={() => {}} onBuilding={(id) => { built = id; }} onFinish={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Fix it under Perimeter/ }));
    expect(built).toBe(item.id);
    expect(takeWanted(item.id)).toBe('barrier');
    expect(takeWanted(item.id), 'taken once').toBeNull();
  });
});

describe('Priya does not sign off what the park says fails', () => {
  it('sends it back, saying what the park found', () => {
    const s = askToCheck(behindAFence(), habitatOf(behindAFence()).id);
    const move = aiTurn(s, 'product_owner');
    expect(move?.action).toMatchObject({ type: 'ANSWER_QUESTION', choice: 'back' });
    expect(move?.says).toMatch(/^Not yet\. I went to look at the .*, and the park says a 2m fence - .* would be over it\. It is under Perimeter\. Fix that, then ask me again\.$/);
  });
});
