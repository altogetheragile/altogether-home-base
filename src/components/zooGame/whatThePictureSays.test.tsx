import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkPlan } from './ParkPlan';
import { StepTrack } from './StepTrack';
import { TurnControl } from './TurnControl';
import { initialZooState } from './config';
import { startOnTheBoard } from './engine';
import { standingOnPark } from './parkModel';
import { reducer } from './useZooGame';
import type { ZooGameState } from './types';

// What the game says about itself, to anything that reads rather than looks.
//
// All four of these came out of one run: a newcomer playing the live game from the first screen,
// 250 steps, four Sprints. It delivered nothing in any of them, and three of these four are why.

const playing = (): ZooGameState => startOnTheBoard(initialZooState(1) as ZooGameState);
const started = (): ZooGameState => {
  const s = playing();
  const first = s.backlog.find((it) => it.status === 'committed')!;
  return reducer(s, { type: 'START_ITEM', id: first.id });
};

const park = (state: ZooGameState, selected?: string) => render(
  <MemoryRouter><ParkPlan state={state} selected={selected} onPlaceItem={() => {}} /></MemoryRouter>,
).container;

describe('a thing standing on the park', () => {
  // The whole of the 250-step run, in one word. It said ", picked up", and what it meant was
  // "selected" - the thing is on the grass. The newcomer read it the only way it reads, nudged with
  // the arrows, pressed Enter to put it down, saw "picked up" again and decided it had failed.
  // Enter does not put anything down here: it OPENS the item, so nothing changed and it tried
  // again. Four Sprints, nothing ever finished, an empty park at every Review.
  const label = (c: HTMLElement, name: string) => [...c.querySelectorAll('[data-plan-item]')]
    .map((g) => g.getAttribute('aria-label') ?? '').find((l) => l.startsWith(name)) ?? '';

  it('is not described as being in anybody\'s hands', () => {
    const s = started();
    const it0 = s.backlog.find((b) => b.status === 'committed' && b.started !== undefined)
      ?? s.backlog.find((b) => b.status === 'committed')!;
    const said = label(park(s, it0.id), it0.name);
    expect(said, `nothing on the park is named "${it0.name}"`).toBeTruthy();
    expect(said, 'it still says it is being held, so Enter will be pressed until the day runs out')
      .not.toMatch(/picked up/i);
    expect(said, 'nothing says it is the one selected').toMatch(/selected/i);
  });

  it('says what the keys actually do, including the one that is not obvious', () => {
    const s = started();
    const it0 = s.backlog.find((b) => b.status === 'committed' && b.started !== undefined)
      ?? s.backlog.find((b) => b.status === 'committed')!;
    const said = label(park(s, it0.id), it0.name);
    expect(said, 'the arrows are not mentioned').toMatch(/arrow keys/i);
    expect(said, 'Enter opens it, and only the page knows that').toMatch(/Enter opens it/i);
  });

  it('counts one thing as one thing', () => {
    // The park's own accessible name, so it is what a screen reader announces on the main picture
    // of the game. Never visible, which is how "1 things standing on it" survived.
    //
    // Built so the park really does hold exactly one: asserting only that "1 things" is absent
    // passes on an empty park, where the sentence is "0 things" and correct, and the bug sails
    // through. The singular has to be demanded, not the plural forbidden.
    // Nothing stands on a park where nothing has been started: an item appears on the grass when
    // the Developers pick it up, which is the moment the newcomer reached and then never left.
    const base = started();
    const standing = standingOnPark(base);
    expect(standing.length, 'this test needs something on the park to count').toBeGreaterThan(0);
    const keep = standing[0].item.id;
    const one = {
      ...base,
      backlog: base.backlog.filter((b) => b.id === keep || !standing.some((st) => st.item.id === b.id)),
    } as ZooGameState;
    expect(standingOnPark(one).length, 'the park does not hold exactly one thing').toBe(1);

    const said = park(one).querySelector('[data-part="park-plan"]')?.getAttribute('aria-label') ?? '';
    expect(said, 'the park does not say what is on it').toMatch(/standing on it/);
    expect(said, 'it says "1 things"').toMatch(/\b1 thing standing on it\b/);
  });
});

describe('two pictures of the same zoo', () => {
  // Both are on screen at the Sprint Review - the Review's own Increment and the shell's park - and
  // each carries a walk and a turn. "There are two 'Walk it' buttons and two 'Turn the park a
  // quarter' buttons visible, which seems like duplication."
  it('do not hand out two controls with the same name', () => {
    const a = render(<TurnControl turn={0} onTurn={() => {}} of="the Increment" />)
      .container.querySelector('button')!.getAttribute('aria-label') ?? '';
    const b = render(<TurnControl turn={0} onTurn={() => {}} of="the zoo" />)
      .container.querySelector('button')!.getAttribute('aria-label') ?? '';
    expect(a, 'the turn does not say which picture it turns').toMatch(/the Increment/);
    expect(b).toMatch(/the zoo/);
    expect(a === b, 'both pictures claim the same control').toBe(false);
  });
});

describe('the step track', () => {
  // The number in its circle is a picture of where you are. Read out it added nothing and took
  // something away: "5 Adapt" as a button name, and a bare "5" to anything reading the page as
  // text. "The '5' sitting on its own just above the 'Next' button - I have no idea what that
  // refers to."
  const track = () => render(
    <StepTrack steps={[{ key: 'inspect', label: 'Inspect' }, { key: 'adapt', label: 'Adapt' }]}
      current="adapt" done={(k) => k === 'inspect'} onGo={() => {}} />,
  ).container;

  it('keeps its numbers out of what the buttons are called', () => {
    for (const b of track().querySelectorAll('button')) {
      const badge = b.querySelector('span');
      expect(badge, 'the step has no number on it at all').toBeTruthy();
      expect(badge!.getAttribute('aria-hidden'), 'the number is read out as part of the step name')
        .toBeTruthy();
    }
  });

  it('says which step you are on, rather than only colouring it', () => {
    const here = [...track().querySelectorAll('button')].filter((b) => b.getAttribute('aria-current') === 'step');
    expect(here.length, 'nothing says which step is the current one').toBe(1);
    expect(here[0].textContent).toMatch(/Adapt/);
  });
});
