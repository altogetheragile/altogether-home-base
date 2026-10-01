import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooIntro } from './ZooIntro';
import { rewordProductGoal } from './engine';
import { reducer } from './useZooGame';
import { initialZooState, PRODUCT_GOAL } from './config';
import type { ZooGameState, GoalShape, GoalMeasure } from './types';

// The wand asks a coach over the network before falling back to the mechanical reword. A unit
// test of this screen has no business making that call: left real it reached for Supabase, which
// fails instantly on a developer's machine and hangs in CI until waitFor gives up at one second -
// green here, red there, for a reason that has nothing to do with the wand.
//
// Refused outright, so every test below exercises the fallback, which is what a signed-out player
// gets and what these tests were always about.
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: { message: 'Unauthorized' } }) } },
}));

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
  <MemoryRouter><ZooIntro productGoal={goal} onSetGoal={() => {}} onStart={() => {}} onStartFromTheBrief={() => {}}
    onSetGoalShape={() => {}} /></MemoryRouter>,
);
const wand = (c: HTMLElement) => c.querySelector('[data-part="goal-wand"]') as HTMLButtonElement;
const field = (c: HTMLElement) => c.querySelector('[aria-label="Product Goal"]') as HTMLTextAreaElement;
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

  it('rewords what is in the field, in place', async () => {
    // Asynchronous now: the wand asks a coach, and falls back to the mechanical reword when it
    // cannot - which is what happens here, with no network and nobody signed in. That fallback is
    // the thing being tested, and it is the thing a signed-out player actually gets.
    const { container } = intro();
    fireEvent.change(field(container), { target: { value: 'lions' } });
    fireEvent.click(wand(container));
    await waitFor(() => expect(field(container).value).not.toBe('lions'));
    expect(field(container).value, 'it left their words alone').not.toBe('lions');
    expect(field(container).value, 'their idea did not survive').toMatch(/lions/i);
    expect(note(container), 'it reworded and said nothing about why').toMatch(/\w/);
  });

  it('drops the note the moment they type again', async () => {
    // The note was about the sentence that was there. Left up, it reads as a verdict on the one
    // they are typing now.
    const { container } = intro();
    fireEvent.change(field(container), { target: { value: 'lions' } });
    fireEvent.click(wand(container));
    await waitFor(() => expect(note(container)).toMatch(/\w/));
    fireEvent.change(field(container), { target: { value: 'lions and tigers' } });
    expect(note(container), 'the old note is still up').toBe('');
  });
});

describe('and there is only one place to write it', () => {
  // A newcomer played the live game cold and said the same thing at every step for fourteen steps:
  // "there are two fields - 'Product Goal' and 'One clear outcome' - and I am not sure which one I
  // am supposed to type my goal into." They never got in.
  //
  // The panel's own box was the louder of the two: full width, with a full-width orange "Use this
  // as the Product Goal" under it, while the real field's button said "Reword mine". It also had to
  // be kept in step with the field above, and when it drifted it wrote the stale sentence back over
  // the new one - a fault this file used to carry two tests for. Both go: there is nothing to keep
  // in step with any more.
  const boxes = (c: HTMLElement) => [...c.querySelectorAll('textarea')];

  it('has one box for the goal, not two', () => {
    const { container } = intro();
    expect(boxes(container).length, 'there is more than one place to write the Product Goal').toBe(1);
    expect(boxes(container)[0].getAttribute('aria-label')).toBe('Product Goal');
  });

  it('has no second button offering to set the goal', () => {
    const { container } = intro('lions');
    const labels = [...container.querySelectorAll('button')].map((b) => b.textContent ?? '');
    expect(labels.filter((t) => /Use this as the Product Goal/i.test(t)),
      'the decoy that wrote the old goal back over the new one is still there').toEqual([]);
  });

  it('points at the field above instead', () => {
    const { container } = intro();
    expect(container.querySelector('[data-part="write-it-above"]')?.textContent ?? '',
      'the panel offers shapes and never says where to write one').toMatch(/Product Goal box above/i);
  });

  it('applies a shape the moment it is picked, with the words they already wrote', () => {
    // No "use this" step, because there is nothing separate to use. Picking "an epic user story"
    // IS the decision, and the goal goes through untouched: the panel never edits their words.
    const onSetGoalShape = vi.fn();
    const { container } = render(
      <MemoryRouter><ZooIntro productGoal="lions" onSetGoal={() => {}} onStart={() => {}}
        onStartFromTheBrief={() => {}} onSetGoalShape={onSetGoalShape} /></MemoryRouter>,
    );
    const chip = [...container.querySelectorAll('button')].find((b) => /An epic user story/.test(b.textContent ?? ''))!;
    expect(chip, 'the shapes cannot be picked at all').toBeTruthy();
    fireEvent.click(chip);
    expect(onSetGoalShape, 'picking a shape did nothing until some other button was pressed').toHaveBeenCalled();
    const calls = onSetGoalShape.mock.calls;
    const [shape, text] = calls[calls.length - 1];
    expect(shape).toBe('epic');
    expect(text, 'the panel rewrote what they had written').toBe('lions');
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
