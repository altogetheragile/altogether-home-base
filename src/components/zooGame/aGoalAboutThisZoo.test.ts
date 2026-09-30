import { describe, it, expect } from 'vitest';
import { rewordProductGoal } from './engine';
import { ZOO_VOCABULARY } from './config';

// An objective and key results, pasted in from work, came back as "Open the people who start
// BestU carry on after an initial two-week period ... so that visitors love it and come back."
// Nonsense, and confidently phrased nonsense. The wand had no idea what the game was about: it
// matched "people" in GOAL_THE_WHOLE, which counts words that appear in every goal ever written.

const THEIRS = 'People who start BestU carry on after an initial two-week period to maintain healthy eating and exercise habits';

describe('a Product Goal about this zoo', () => {
  it('hands back a goal from somewhere else exactly as it was written', () => {
    const out = rewordProductGoal(THEIRS);
    expect(out.goal, 'their own words were rewritten').toBe(THEIRS);
  });

  it('never dresses an off-theme goal in zoo clothing', () => {
    const out = rewordProductGoal(THEIRS);
    expect(out.goal).not.toMatch(/visitors love/i);
    expect(out.goal).not.toMatch(/^Open the people/i);
  });

  it('says why, rather than refusing silently', () => {
    const out = rewordProductGoal(THEIRS);
    expect(out.note).toMatch(/does not look like it is about this zoo/i);
    expect(out.note, 'a refusal with no way forward is worse than none').toMatch(/write the zoo one|would have to become/i);
  });

  it('is not fooled by the generic words every goal has', () => {
    // "people", "families" and "everyone" are not evidence of a zoo.
    for (const said of [
      'People renew their subscription after the first month',
      'Families choose us over the competition',
      'Everyone in the team ships weekly',
    ]) {
      expect(rewordProductGoal(said).goal, `${said} was reshaped`).toBe(said);
    }
  });

  it('still rewords a goal that is about the zoo', () => {
    const out = rewordProductGoal('build a lion enclosure');
    expect(out.goal).toMatch(/visitors love/i);
    expect(out.note).toMatch(/Sprint Goal/i);
  });

  it('takes the park itself as evidence, not just its furniture', () => {
    for (const said of ['open a zoo everyone talks about', 'a park families come back to', 'somewhere visitors love']) {
      expect(rewordProductGoal(said).goal, `${said} was treated as off-theme`).not.toBe(said);
    }
  });

  it('knows the animal the game opens with', () => {
    // A hand-written vocabulary had no lion in it, and the lion is the flagship of Big Cats - the
    // animal a first-time player is most likely to name. It comes from the catalogue now.
    expect(ZOO_VOCABULARY).toContain('lion');
    expect(rewordProductGoal('lions').goal).toMatch(/visitors love/i);
  });

  it('knows every species and area the game has, without being told twice', () => {
    for (const word of ['tiger', 'penguin', 'elephant', 'giraffe', 'zebra', 'rhino', 'monkey', 'bear', 'leopard']) {
      expect(ZOO_VOCABULARY, `${word} is not in the vocabulary`).toContain(word);
    }
    // And the facilities, which are as much the zoo as the animals are.
    for (const word of ['kiosk', 'cafe', 'toilet', 'picnic']) {
      expect(ZOO_VOCABULARY, `${word} is not in the vocabulary`).toContain(word);
    }
  });

  it('leaves an empty goal alone, as it always did', () => {
    expect(rewordProductGoal('   ')).toEqual({ goal: '', note: '' });
  });
});
