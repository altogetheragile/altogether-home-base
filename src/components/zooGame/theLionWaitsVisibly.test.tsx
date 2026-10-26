import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { reducer } from './useZooGame';
import { initialZooState } from './config';
import { waitingForHabitat, tickDay } from './engine';
import { ActionRail } from './ActionRail';
import { ParkPlan } from './ParkPlan';
import type { ZooAction, ZooGameState } from './types';

// Three faults from one game (Al, 26 Oct 2026), replayed from what was pressed:
//
//   "The lion enclosure is built. I cannot pull the lion PBI as the game thinks the enclosure is
//    not built. Also, the timer is not moving."   ...and a ghost of the habitat followed the pen.
//
// The trail is the game's own record of that session, kept as it was copied.
const TRAIL = {"seed":1,"actions":[{"type":"SET_PRODUCT_GOAL","goal":"Open a big cats zone so that visitors love the zoo and come back."},{"type":"START"},{"type":"START_ITEM","id":"lion-enc"},{"type":"SAY","who":"developer","from":"Ben","text":"Where do you want Seating Area? You know what the visitors are here for.","itemId":"benches"},{"type":"ASK_PLACEMENT","id":"benches"},{"type":"SAY","who":"product_owner","from":"Priya (PO)","text":"By the entrance for Seating Area - that is where I want people to meet it.","itemId":"benches"},{"type":"ANSWER_PLACEMENT","id":"benches","choice":"entrance"},{"type":"SAY","who":"product_owner","from":"Priya (PO)","text":"Your call. How it gets built is yours - I care what it has to do.","itemId":"fence-lion-enc"},{"type":"ANSWER_QUESTION","id":"fence-lion-enc","choice":"theirs","by":"product_owner"},{"type":"PROPOSE_MOVE","devId":"dev2","move":{"kind":"pull","itemId":"benches"},"says":"Taking Seating Area next."},{"type":"CHOOSE_STRUCTURE","id":"lion-enc","key":"paddock"},{"type":"SET_ENCLOSURE","id":"lion-enc","size":"large"},{"type":"SET_DRAFT_DESIGN","id":"lion-enc","design":{"parts":{"structure":"paddock","ground":"land","shape":"rounded","barrier":"high"},"colors":{"ground":"#43a047","fence":"#8fa3b0"}}},{"type":"ADD_INSIDE","id":"lion-enc","kind":"water"},{"type":"ADD_INSIDE","id":"lion-enc","kind":"rocks"},{"type":"ADD_INSIDE","id":"lion-enc","kind":"rocks"},{"type":"ADD_INSIDE","id":"lion-enc","kind":"rocks"},{"type":"ADD_INSIDE","id":"lion-enc","kind":"tree"},{"type":"ADD_INSIDE","id":"lion-enc","kind":"tree"},{"type":"SET_DRAFT_DESIGN","id":"lion-enc","design":{"parts":{"structure":"paddock","ground":"land","shape":"rounded","barrier":"high","thickness":"thick"},"colors":{"ground":"#43a047","fence":"#8fa3b0","path":"#8a7f74"},"water":[{"x":0.02,"y":0.15999999999999998,"w":0.32,"h":0.28}],"flora":[{"x":0.424,"y":0.3,"s":1,"type":"rocks","foliage":"#9aa1a8","trunk":"#6f757b"},{"x":0.652,"y":0.3,"s":1,"type":"rocks","foliage":"#9aa1a8","trunk":"#6f757b"},{"x":0.842,"y":0.42,"s":1,"type":"rocks","foliage":"#9aa1a8","trunk":"#6f757b"},{"x":0.12,"y":0.5,"s":1,"type":"tree","foliage":"#43a047","trunk":"#7a5230"},{"x":0.538,"y":0.5,"s":1,"type":"tree","foliage":"#43a047","trunk":"#7a5230"}]}},{"type":"ADD_CONNECTOR","connector":{"id":"run-242-333-888","itemId":"lion-enc","a":{"featureId":"lion-enc","x":241.7103660115526,"y":895.6133447149653},"b":{"featureId":"lion-enc","x":333.05306791389233,"y":888.3000544340382},"bends":[],"thickness":9,"color":"#c9a86a"}},{"type":"ADD_CONNECTOR","connector":{"id":"run-221-325-887","itemId":"lion-enc","a":{"featureId":"lion-enc","x":220.5844815798447,"y":900.153207069505},"b":{"featureId":"lion-enc","x":324.9173996094074,"y":886.869284505297},"bends":[],"thickness":14,"color":"#8a7f74"}},{"type":"END_DAY"},{"type":"ANSWER_HUDDLE","how":"skip"},{"type":"SAY","who":"developer","from":"Ben","text":"Took a look over Lion Enclosure with the second pair of eyes our Definition of Done asks for.","itemId":"lion-enc"},{"type":"ASSIGN_DEV","itemId":"lion-enc","devId":"dev2"}]} as { seed: number; actions: ZooAction[] };

const played = (upTo = TRAIL.actions.length): ZooGameState =>
  TRAIL.actions.slice(0, upTo).reduce((s, a) => reducer(s, a), initialZooState(TRAIL.seed));
const after = (type: string) => TRAIL.actions.findIndex((a) => a.type === type) + 1;

describe('the clock that stopped', () => {
  it('is held by a question nobody could see - which the rail now shows on the board too', () => {
    // Ben held a card up ("Taking Seating Area next.") and the day clock waits on an answer. The
    // Sprint board drew its own rail without the handlers to show it, so the clock stood still at
    // 3:00 with nothing on the screen to say why.
    const s = played(after('ADD_CONNECTOR'));
    expect(s.proposed, 'the trail no longer reaches the held question').toBeTruthy();
    expect(tickDay(s).daySecondsLeft, 'the clock is not held by the question').toBe(s.daySecondsLeft);

    const agree = vi.fn();
    render(<ActionRail state={s} onAgreeMove={agree} onDeclineMove={vi.fn()} />);
    expect(screen.getByText(/Taking Seating Area next/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, take it' }));
    expect(agree).toHaveBeenCalled();
  });

  it('runs again once the question is answered', () => {
    const s = reducer(played(after('ADD_CONNECTOR')), { type: 'AGREE_MOVE' });
    expect(s.proposed ?? null).toBeNull();
    expect(tickDay(s).daySecondsLeft).toBe(s.daySecondsLeft - 1);
  });
});

describe('the lion that could not be pulled', () => {
  it('says the habitat is not Done yet, and what it is waiting on, rather than "not built"', () => {
    const s = played();
    const lion = s.backlog.find((it) => it.category === 'exhibit' && it.enclosureId === 'lion-enc')!;
    const why = waitingForHabitat(s, lion) ?? '';
    expect(why).toMatch(/^Lion Enclosure is not Done yet \(accept 2 more criteria\)/);
    expect(why, 'it still says built, beside a habitat standing finished on the park').not.toMatch(/built first/);
  });
});

describe('the ghost that followed the pen', () => {
  it('stays away while a path is being drawn, even with something waiting to be put down', () => {
    const s = played(after('ADD_CONNECTOR'));
    const { container } = render(
      <ParkPlan state={s} placing={{ id: 'lion-enc', w: 120, h: 100 }} onPlace={vi.fn()} tool="path" />,
    );
    const svg = container.querySelector('[data-part="park-plan"]')!;
    const W = 820, H = 700;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: W, height: H, right: W, bottom: H, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    fireEvent.pointerMove(svg, { clientX: 400, clientY: 350 });
    expect(container.querySelector('[data-part="ghost"]'), 'the habitat followed the pen about').toBeNull();
  });
});
