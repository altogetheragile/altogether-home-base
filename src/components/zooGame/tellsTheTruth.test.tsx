import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ParkInspector } from './ParkInspector';
import { ZooIntro } from './ZooIntro';
import { initialZooState, PRODUCT_GOAL } from './config';
import { startOnTheBoard, askToCheck, answerQuestion, acWaived, acTally, decisionsIn } from './engine';
import { amenityAcceptance } from './design';
import { answerable } from './parkChecks';
import type { ZooGameState, BacklogItem } from './types';

// The record has to be able to be pointed at.
//
// Three findings from a play-through, all of the same kind: the game writing down something other
// than what happened. "Attributing the game's own forecast to the player weakens the Retro, which is
// the one screen that must be trustworthy."

const sprint = (): ZooGameState => startOnTheBoard(initialZooState(1) as ZooGameState);

describe('the Decision Log', () => {
  it('does not put the game’s own forecast in the player’s name', () => {
    // "You chose the Sprint Backlog: 6 items, 19 points against a forecast of 21." They pressed
    // Start building. The first Sprint arrives planned - that is the design - so the log says so.
    const s = sprint();
    const said = decisionsIn(s, 1).filter((d) => d.kind === 'forecast').map((d) => d.what).join(' ');
    expect(said, 'the log credits the player with a Sprint Backlog they were handed')
      .not.toMatch(/^You chose/);
    expect(said, 'the log does not say where the Sprint Backlog came from')
      .toMatch(/arrived chosen.*Nobody here picked it/i);
  });
});

describe('a criterion the Product Owner waived', () => {
  const waived = (): { s: ZooGameState; item: BacklogItem } => {
    const s = sprint();
    const it0 = s.backlog.find((x) => x.status === 'committed' && x.category === 'enclosure')!;
    // The park has looked and refused the first one. Without that this is not a waiver at all: a
    // criterion nobody has judged is accepted by judging it, and recording THAT as "shipped
    // knowing" is the lie this whole file is about.
    const refused = { ...s, backlog: s.backlog.map((x) => (x.id === it0.id
      ? { ...x, acConfirmed: x.acceptance.map((_, i) => (i === 0 ? false : undefined)) } : x)) } as unknown as ZooGameState;
    const after = answerQuestion(askToCheck(refused, it0.id), `check-${it0.id}`, 'accept-as-is', 'product_owner');
    return { s: after, item: after.backlog.find((x) => x.id === it0.id)! };
  };

  it('is recorded as waived rather than as met', () => {
    // Accepting with one criterion unmet turned "4 of 5" into "5 of 5", which is the record agreeing
    // with the decision instead of recording it.
    const { item } = waived();
    const tally = acTally(item);
    expect(tally.waived, 'nothing was written down as shipped knowing').toBeGreaterThan(0);
    expect(tally.met, 'the waived criteria were counted as met').toBeLessThan(tally.of);
    expect(tally.met + tally.waived, 'the numbers do not add up to the criteria').toBeLessThanOrEqual(tally.of);
  });

  it('says so on the park, where the work is', () => {
    const { s, item } = waived();
    const { container } = render(<ParkInspector state={s} item={item} />);
    const pill = container.querySelector('[data-part="park-inspector"]')!;
    expect(pill.textContent, 'the count reads as though everything was met').toMatch(/waived/i);
  });

  it('is still settled, so nobody is asked about it again', () => {
    // Settled and met are different things, and the record needs both.
    const { item } = waived();
    const i = item.acceptance.findIndex((_, k) => acWaived(item, k));
    expect(i, 'this test needs a waived criterion').toBeGreaterThanOrEqual(0);
    expect(item.acConfirmed?.[i], 'a waived criterion was ticked as met').toBeFalsy();
  });
});

describe('a facility a player can actually finish', () => {
  it('has something the park answers, not three things only the Product Owner can', () => {
    // Reported from a play-through: "all three Gift Shop criteria are 'Priya judges this'. There is
    // no control that satisfies them, so the only route to Done is the Product Owner waiving all
    // three. That teaches that Done is whatever the Product Owner says."
    const acs = amenityAcceptance('Gift Shop', 'food');
    const facts = acs.filter(answerable);
    expect(facts.length, `nothing on a Gift Shop can be answered by the park: ${acs.join(' / ')}`)
      .toBeGreaterThanOrEqual(2);
    expect(acs.length - facts.length, 'there is nothing left for the Product Owner to judge')
      .toBeGreaterThanOrEqual(1);
  });

  it('asks about finding it in the same words a habitat does', () => {
    // It asked "can I find it from the entrance?", which is the habitat's question in different
    // words - so the park recognised one and not the other.
    expect(amenityAcceptance('Gift Shop', 'food')).toContain('Can I walk to it from the way in?');
  });
});

describe('the Product Goal field', () => {
  it('opens empty, so what you type is what the game runs on', () => {
    // It held the default AS TEXT, identical to the placeholder behind it, so a first attempt
    // appended to a Goal nobody had written.
    const { container } = render(
      <ZooIntro productGoal={PRODUCT_GOAL} goalShape="outcome" goalMeasures={[]}
        onSetGoal={() => {}} onStart={() => {}} onStartFromTheBrief={() => {}} />,
    );
    const field = container.querySelector('input[aria-label="Product Goal"]') as HTMLInputElement;
    expect(field.value, 'the field is pre-filled, so typing appends to it').toBe('');
    expect(field.placeholder, 'and nothing suggests what a Product Goal looks like').toBeTruthy();
  });

  it('runs on the suggestion when nobody writes their own', () => {
    let got = '';
    const { container } = render(
      <ZooIntro productGoal={PRODUCT_GOAL} goalShape="outcome" goalMeasures={[]}
        onSetGoal={(g) => { got = g; }} onStart={() => {}} onStartFromTheBrief={() => {}} />,
    );
    (container.querySelector('button[data-part="start"]') as HTMLButtonElement | null)?.click();
    expect(got === '' || got === PRODUCT_GOAL, `an empty field started a game with no Goal: "${got}"`).toBe(true);
  });
});
