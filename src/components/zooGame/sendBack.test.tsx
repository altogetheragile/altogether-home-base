import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CardDetail } from './Board';
import { sendItemBack, asksNow, buildItem, askToCheck } from './engine';
import { mayTake } from './seatRules';
import { reducer } from './useZooGame';
import { initialZooState } from './config';
import type { ZooGameState, BacklogItem } from './types';

// The Product Owner's other answer.
//
// "How does the PO reject a PBI and not sign it off? There is no point adding a bridge that doesn't
// cross the river." Until now there was no way to say no. Leaving a criterion unticked said nothing
// to anybody: the card sat in Doing, the Developers were not told, nothing was recorded, and the
// Sprint carried on as though the work were merely unfinished rather than wrong.
//
// Saying no is a decision. The criteria it did not meet are the reason - that is what acceptance
// criteria are for - and finishing it again costs the Sprint the time it takes.

const design = { parts: {}, colors: {} } as unknown as BacklogItem['design'];

const built = (over: Partial<BacklogItem> = {}): ZooGameState => {
  const base = initialZooState(3);
  const held = base.backlog.find((it) => !it.unsized && it.category === 'enclosure')!;
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 2, daySecondsLeft: 80,
    committedIds: [held.id],
    backlog: base.backlog.map((it) => (it.id === held.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true, design,
        assignedDevs: ['dev1'], acConfirmed: it.acceptance.map(() => false), ...over }
      : it)),
  } as ZooGameState;
};
const theItem = (s: ZooGameState): BacklogItem => s.backlog.find((it) => it.status !== 'backlog')!;

describe('not accepting the work', () => {
  it('sends it back to the Developers, with the criteria it missed as the reason', () => {
    const before = built();
    const item = theItem(before);
    const after = sendItemBack(before, item.id);
    const back = after.backlog.find((it) => it.id === item.id)!;

    expect(back.status, 'work nobody accepted was left sitting in Done').toBe('committed');
    expect(back.sentBack, 'nothing on the item says it came back').toBeTruthy();
    expect(back.sentBack!.criteria, 'the reason is not the criteria it missed').toEqual(item.acceptance);
    // Their work is not thrown away - but it is not built any more, so finishing it costs the time
    // it takes. Building the wrong thing is the expensive part, and the game should charge for it.
    expect(back.design, 'it was still built, so saying no cost the Sprint nothing').toBeUndefined();
    expect(back.draftDesign, 'the Developers’ work was thrown away rather than handed back').toBe(design);
  });

  it('writes it down for the Retrospective, with what it cost', () => {
    const before = built();
    const after = sendItemBack(before, theItem(before).id);
    const all = after.decisions ?? [];
    const noted = all[all.length - 1];
    expect(noted.kind).toBe('sent-back');
    expect(noted.by).toBe('product_owner');
    expect(noted.what, 'the record does not say what it did not meet').toMatch(/did not accept/);
    expect(noted.cost, 'the record does not say it cost anything').toMatch(/costs Sprint time/);
  });

  it('tells the Developers, where they are looking', () => {
    const after = sendItemBack(built(), theItem(built()).id);
    const ask = asksNow(after).find((a) => a.kind === 'rework')!;
    expect(ask, 'the work came back and nobody was told').toBeTruthy();
    expect(ask.of, 'finishing it again is not the Developers’ work?').toBe('developer');
    expect(ask.from).toMatch(/Product Owner/);
    expect(ask.text).toContain(theItem(after).acceptance[0]);
  });

  it('will not refuse work that meets every criterion - that is acceptance', () => {
    const s = built();
    const item = theItem(s);
    const allMet = {
      ...s,
      backlog: s.backlog.map((it) => (it.id === item.id ? { ...it, acConfirmed: it.acceptance.map(() => true) } : it)),
    } as ZooGameState;
    expect(sendItemBack(allMet, item.id), 'work that met what was asked for was sent back anyway').toBe(allMet);
  });

  it('has nothing to judge before anything is built', () => {
    const s = built({ design: undefined });
    expect(sendItemBack(s, theItem(s).id), 'work nobody has built yet was sent back').toBe(s);
  });

  it('clears when the Developers finish it again', () => {
    const s = sendItemBack(built(), theItem(built()).id);
    const again = buildItem(s, theItem(s).id, design);
    expect(theItem(again).sentBack, 'it was finished again and still says it came back').toBeUndefined();
  });

  it('is the Product Owner’s call, and the game says why', () => {
    const verdict = mayTake('SEND_BACK', { seat: 'developer' });
    expect(verdict.allowed, 'a Developer accepted or refused their own work').toBe(false);
    expect(verdict.because).toMatch(/Product Owner/);
  });
});

describe('the way it is said no to', () => {
  const card = (state: ZooGameState, onSendBack = vi.fn()) => {
    const item = theItem(state);
    render(
      <MemoryRouter>
        <CardDetail item={item} state={state} interactive showAcceptance bare
          onToggleTask={() => {}} onConfirmAc={() => {}} onSendBack={onSendBack} />
      </MemoryRouter>,
    );
    return { item, onSendBack };
  };

  it('offers it on built work that does not meet its criteria - and asks before it does it', () => {
    // It used to refuse the work on one press, in the same small type as the acceptance ticks and
    // a thumb-width from them, with what it costs in a tooltip nobody sees on a tablet.
    const { item, onSendBack } = card(built());
    fireEvent.click(screen.getByRole('button', { name: /Send it back/ }));
    expect(onSendBack, 'one press refused the work').not.toHaveBeenCalled();
    expect(screen.getByText(/costs Sprint time/i), 'nothing said what sending it back does').toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Yes, send it back/ }));
    expect(onSendBack, 'the second press said nothing to the game').toHaveBeenCalledWith(item.id);
  });

  it('can be changed your mind about', () => {
    const { onSendBack } = card(built());
    fireEvent.click(screen.getByRole('button', { name: /Send it back/ }));
    fireEvent.click(screen.getByRole('button', { name: /Keep looking at it/ }));
    expect(onSendBack, 'backing out still refused the work').not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Send it back/ }), 'the way to refuse it was gone').toBeTruthy();
  });

  it('does not offer it once every criterion is ticked', () => {
    const s = built();
    const met = {
      ...s, backlog: s.backlog.map((it) => (it.status === 'committed' ? { ...it, acConfirmed: it.acceptance.map(() => true) } : it)),
    } as ZooGameState;
    card(met);
    expect(screen.queryByRole('button', { name: /Send it back/ }),
      'work that meets what was asked for can still be refused').toBeNull();
  });

  it('says on the card that it came back, and what it missed', () => {
    const s = sendItemBack(built(), theItem(built()).id);
    card(s);
    expect(screen.getByText(/Sent back by the Product Owner/), 'the card says nothing about it').toBeTruthy();
  });
});

describe('the moment there is something to judge', () => {
  it('marks the work built when the Developers tick the last step of the plan', () => {
    // Playing alone there was no such moment: the only thing that ever set an item built was the
    // move to Done, which took the build and the Product Owner's acceptance in one gesture. So a
    // Product Owner never saw built work waiting on them, and had nothing to accept or refuse.
    const s = built({ design: undefined, tasks: [
      { id: 't1', label: 'Set the footprint size', done: true },
      { id: 't2', label: 'Fence it securely', done: false },
      { id: 't3', label: 'Get the PO’s sign-off', done: false },
    ] });
    const item = theItem(s);
    expect(item.design, 'it was built before the plan was worked').toBeUndefined();

    const after = reducer(s, { type: 'TOGGLE_TASK', id: item.id, taskId: 't2' });
    const now = theItem(after);
    expect(now.design, 'the plan was worked through and nothing was ever built').toBeTruthy();
    expect(now.status, 'it went to Done with the criteria unticked').toBe('committed');
    expect(asksNow(after).some((a) => a.kind === 'accept' && a.of === 'product_owner'),
      'built work was not put in front of the Product Owner').toBe(true);
  });
});

describe('the two answers on the Developers’ question', () => {
  it('say what the destructive one does, on the question rather than in a tooltip', () => {
    // "Accept it" and "Send it back" sit a thumb-width apart and one of them undoes a piece of
    // finished work. What it costs was in a `title`, which does not exist on a tablet.
    const asked = askToCheck(built(), theItem(built()).id, 'developer');
    const q = (asked.questions ?? []).find((x) => x.id.startsWith('check-'))!;
    const back = q.choices.find((c) => c.key === 'back')!;
    expect(back.note, 'refusing the work says nothing about what it costs').toMatch(/costs Sprint time/i);
    expect(q.choices.find((c) => c.key === 'accept')?.note,
      'accepting was given a consequence it does not have').toBeFalsy();
  });

  it('is offered at the Review too, where the Increment is inspected', () => {
    const onSendBack = vi.fn();
    const s = built();
    const item = theItem(s);
    render(
      <MemoryRouter>
        <CardDetail item={item} state={s} interactive showAcceptance bare
          onToggleTask={() => {}} onConfirmAc={() => {}} onSendBack={onSendBack} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: /Send it back/ }),
      'the Product Owner could accept at the Review and never refuse').toBeTruthy();
  });
});
