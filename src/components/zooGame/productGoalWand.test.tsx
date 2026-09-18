import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ZooIntro } from './ZooIntro';
import { rewordProductGoal } from './engine';
import { reducer } from './useZooGame';
import { initialZooState, PRODUCT_GOAL } from './config';
import type { ZooGameState, GoalShape, GoalMeasure } from './types';

// A wand on the Product Goal field, and only the half of it that teaches.
//
// Asked for while playing it: "add a wizard to the Product Goal field, please."
//
// The Sprint Goal's wand does two things: with an empty box it WRITES one from the forecast, and
// with something in the box it REWORDS what you wrote. The first of those only works there because
// by Sprint Planning there is a forecast to write a goal from. On the first screen there is nothing
// but the player, and the repo's own rule about wands is the reason this one is half a wand:
//
//   "an AI wand only helps after the learner has tried. A button that breaks the work down for
//    somebody who has written nothing does the one piece of thinking that topic three of Sprint
//    Planning exists for."
//
// The same is true here, more so: the Product Goal is the one thing the first screen asks the
// player to write, and they are the Product Owner while they write it.

const intro = (goal = '') => render(
  <ZooIntro productGoal={goal} onSetGoal={() => {}} onStart={() => {}} onStartFromTheBrief={() => {}}
    onSetGoalShape={() => {}} />,
);
const wand = (c: HTMLElement) => c.querySelector('[data-part="goal-wand"]') as HTMLButtonElement;
const field = (c: HTMLElement) => c.querySelector('input[aria-label="Product Goal"]') as HTMLInputElement;
const note = (c: HTMLElement) => c.querySelector('[data-part="goal-reworded"]')?.textContent ?? '';

describe('the wand on the Product Goal field', () => {
  it('is there', () => {
    expect(wand(intro().container), 'the field has no wand on it').toBeTruthy();
  });

  it('waits until they have written something', () => {
    const { container } = intro();
    expect(wand(container).disabled, 'it would write their Product Goal for them').toBe(true);
    fireEvent.change(field(container), { target: { value: 'lions' } });
    expect(wand(container).disabled, 'they had a go and it still will not help').toBe(false);
  });

  it('says why it is waiting, rather than just being grey', () => {
    const { container } = intro();
    expect(wand(container).getAttribute('title') ?? '').toMatch(/write a rough one first/i);
  });

  it('rewords what is in the field, in place', () => {
    const { container } = intro();
    fireEvent.change(field(container), { target: { value: 'lions' } });
    fireEvent.click(wand(container));
    expect(field(container).value, 'it left their words alone').not.toBe('lions');
    expect(field(container).value, 'their idea did not survive').toMatch(/lions/i);
    expect(note(container), 'it reworded and said nothing about why').toMatch(/\w/);
  });

  it('drops the note the moment they type again', () => {
    // The note was about the sentence that was there. Left up, it reads as a verdict on the one
    // they are typing now.
    const { container } = intro();
    fireEvent.change(field(container), { target: { value: 'lions' } });
    fireEvent.click(wand(container));
    expect(note(container)).toMatch(/\w/);
    fireEvent.change(field(container), { target: { value: 'lions and tigers' } });
    expect(note(container), 'the old note is still up').toBe('');
  });
});

describe('and the panel under it keeps up', () => {
  // "Other ways to write a Product Goal" holds its own copy of the sentence, and it was seeded once
  // at mount. Reword the goal in the field and that copy still held what was there before - so the
  // orange "Use this as the Product Goal" wrote the old one back over the new one.
  //
  // This is the same fault the field above already carries a comment about ("the Product Goal I
  // wrote was thrown away"), one component down, and the wand is what makes it easy to reach.
  const panelBox = (c: HTMLElement) => [...c.querySelectorAll('textarea')]
    .find((t) => /outcome/i.test(t.getAttribute('placeholder') ?? '')) as HTMLTextAreaElement;

  it('shows what the wand wrote, not what was there before it', () => {
    const { container } = intro();
    fireEvent.change(field(container), { target: { value: 'lions' } });
    fireEvent.click(wand(container));
    expect(panelBox(container), 'the panel is not open').toBeTruthy();
    expect(panelBox(container).value, 'the panel would write the old goal back over the new one')
      .toBe(field(container).value);
  });

  it('still lets them write their own in there', () => {
    const { container } = intro();
    fireEvent.change(panelBox(container), { target: { value: 'a zoo worth the train fare' } });
    expect(panelBox(container).value).toBe('a zoo worth the train fare');
  });
});

describe('and the goal they wrote reaches the game', () => {
  // The whole point of the screen. "Start building" sends SET_PRODUCT_GOAL and then START, and START
  // built a fresh state from the seed - so it ignored the goal that had arrived a moment earlier and
  // the game ran on the house default from the first board onwards.
  //
  // Older than the wand. What the wand did was make it visible: you shape a sentence, read what the
  // game says it changed, press the button, and the Product Backlog shows somebody else's.
  const started = (goal: string, shape: GoalShape = 'outcome', measures: GoalMeasure[] = []) => {
    const before = reducer(initialZooState(1) as ZooGameState, { type: 'SET_GOAL_FORM', shape, goal, measures });
    return reducer(before, { type: 'START' });
  };

  it('keeps it through Start building', () => {
    const mine = 'Open a zoo the whole family remembers so that visitors love it and come back.';
    expect(started(mine).productGoal, 'the game threw away the Product Goal and used its own').toBe(mine);
  });

  it('keeps it through writing the Product Backlog first', () => {
    const mine = 'A zoo worth the train fare.';
    const before = reducer(initialZooState(1) as ZooGameState, { type: 'SET_PRODUCT_GOAL', goal: mine });
    expect(reducer(before, { type: 'START_FROM_THE_BRIEF' }).productGoal).toBe(mine);
  });

  it('keeps the shape and the measures with it', () => {
    // Writing it as objectives and key results and then losing the key results is the same loss,
    // one field along.
    const out = started('People come back', 'okr', [{ metric: 'happiness', target: 80 }]);
    expect(out.productGoalShape).toBe('okr');
    expect(out.productGoalMeasures).toEqual([{ metric: 'happiness', target: 80 }]);
  });

  it('still wipes it when the game is reset, which is what reset means', () => {
    const playing = started('A zoo worth the train fare.');
    expect(reducer(playing, { type: 'RESET' }).productGoal).toBe(PRODUCT_GOAL);
  });
});

describe('what the rewording does', () => {
  it('keeps their words and adds what the park gives visitors', () => {
    const out = rewordProductGoal('build a zoo with lots to see');
    expect(out.goal, 'their words were thrown away').toMatch(/lots to see/i);
    expect(out.goal, 'it still names only the work').toMatch(/so that/i);
    expect(out.note).toMatch(/future state|what it gives visitors/i);
  });

  it('calls out a goal that is really a Sprint Goal', () => {
    // The mirror of the note the Sprint Goal's wand gives for one that is too big - and the
    // distinction the game is actually teaching. Reported the other way round while playing:
    // "that is more like a Product Goal. A Sprint Goal would better focus on getting lions open."
    const out = rewordProductGoal('build the lion enclosure');
    expect(out.note, 'a single enclosure passed as a long-term objective').toMatch(/Sprint Goal/);
    expect(out.note).toMatch(/too small/i);
    expect(out.goal, 'their words were thrown away').toMatch(/lion enclosure/i);
  });

  it('does not call a park-wide goal a Sprint Goal because it mentions a path', () => {
    const out = rewordProductGoal('a zoo where every path leads somewhere worth going');
    expect(out.note, 'the whole park was mistaken for one piece of work').not.toMatch(/too small/i);
  });

  it('keeps the first of two, because one objective is held until it is met', () => {
    const out = rewordProductGoal('Open the big cats. Then open the aquarium.');
    expect(out.goal, 'it committed to two objectives at once').not.toMatch(/aquarium/i);
    expect(out.goal).toMatch(/big cats/i);
    expect(out.note).toMatch(/one objective/i);
  });

  it('only tidies one that was already a Product Goal', () => {
    const out = rewordProductGoal('our goal is to open a zoo so that families have a day out worth paying for');
    expect(out.goal, 'a Product Goal reads as a state, not as a proposal to agree to')
      .not.toMatch(/our goal is to/i);
    expect(out.goal).toMatch(/families have a day out/i);
    expect(out.goal, 'it said "so that" twice').toBe('Open a zoo so that families have a day out worth paying for.');
    expect(out.note).toMatch(/already a Product Goal/i);
  });

  it('settles, however many times it is pressed', () => {
    // The first thing anybody does with a button like this is press it twice. It added a full stop
    // each time - "...and come back.." - while telling them it had only tidied the sentence, which
    // is how a button stops being trusted.
    const once = rewordProductGoal('lions');
    const twice = rewordProductGoal(once.goal);
    expect(twice.goal, 'pressing it again changed a sentence it had just called finished').toBe(once.goal);
    expect(rewordProductGoal(twice.goal).goal).toBe(once.goal);
    expect(once.goal).not.toMatch(/\.\./);
  });

  it('leaves SHOUTING alone rather than mangling it', () => {
    expect(rewordProductGoal('OPEN THE BEST ZOO IN WALES').goal).toMatch(/OPEN THE BEST ZOO IN WALES/);
  });

  it('has nothing to say about an empty field', () => {
    expect(rewordProductGoal('   ')).toEqual({ goal: '', note: '' });
  });

  it('gives the same answer twice, so a trainer replaying a seed sees the same words', () => {
    expect(rewordProductGoal('lions')).toEqual(rewordProductGoal('lions'));
  });
});
