import { describe, it, expect } from 'vitest';
import { suggestTasks } from './engine';
import { CRITERIA } from './parkChecks';
import { presetFor } from './design';
import { initialZooState } from './config';
import type { ZooGameState, BacklogItem } from './types';

// The name board, and the step that could not be taken.
//
// A newcomer played the live game cold and said the same thing six times, which made it the single
// most repeated complaint of the run:
//
//   "I keep clicking 'Colour it' and 'Put up a sign' but the acceptance criteria still says no
//    name board and no colour."
//
// It was right and the game was wrong. A building is born with its board already hanging - blank,
// drawn in the placeholder - so there is no sign to put up and never was. What the criterion wants
// is a COLOUR on it, from a swatch row called "Sign" inside a tab called "Look". The step named an
// action that does not exist in the game, and the criterion described two when there is one.

const state = (): ZooGameState => initialZooState(3) as ZooGameState;
const amenity = (): BacklogItem => state().backlog.find((b) => b.category === 'amenity')!;

describe('the steps on a building', () => {
  const labels = () => suggestTasks(amenity()).map((t) => t.label);

  it('do not offer to put up a sign that is already up', () => {
    expect(labels().some((l) => /put up a sign/i.test(l)),
      'the game still asks for a thing it does not let anybody do').toBe(false);
  });

  it('ask for the thing that actually moves the criterion', () => {
    expect(labels().some((l) => /colour.*name board/i.test(l)),
      'nothing in the steps mentions colouring the board, which is the whole of it').toBe(true);
  });
});

describe('a building as it is born', () => {
  it('has its board hanging, and blank', () => {
    const d = presetFor(amenity());
    expect(d.parts.sign, 'the board is not there at all, so "colour it" means nothing').not.toBe('off');
    expect(d.colors?.sign, 'it arrives already coloured, which makes the decision for the player')
      .toBeFalsy();
  });
});

describe('what the criterion says while the board is blank', () => {
  // The criterion itself, asked the question it exists to answer.
  const saysWhatItIs = (item: BacklogItem) => {
    const def = CRITERIA.find((c) => c.id === 'says-what-it-is');
    expect(def, 'a building no longer has to say what it is').toBeTruthy();
    const s = state();
    return def!.answer!({ ...s, backlog: [item, ...s.backlog.filter((b) => b.id !== item.id)] } as ZooGameState, item);
  };

  it('points at the control rather than naming an action', () => {
    const c = saysWhatItIs(amenity());
    expect(c.met, 'an untouched building already passes, so the criterion teaches nothing').toBe(false);
    expect(c.evidence, 'it still says to put a sign on it, which cannot be done')
      .not.toMatch(/put a sign on it/i);
    expect(c.evidence, 'it does not say where to go').toMatch(/Look/);
  });

  it('is met once the board has a colour, and by that alone', () => {
    const it0 = amenity();
    const d = presetFor(it0);
    const coloured = { ...it0, design: { ...d, colors: { ...d.colors, sign: '#c0392b' } } } as BacklogItem;
    expect(saysWhatItIs(coloured).met, 'colouring the board did not satisfy the thing it is for').toBe(true);
  });
});

// ---- and the two buttons called Lion ----

describe('the item being built, and the same item on the board', () => {
  // "There are two Lion buttons - 'Lion 2 Next: accept 1 more criterion' and 'Lion 3 of 4 Ask
  // Priya' - I am not sure which is which or why there are two." Said three times in one run.
  //
  // The third time this game has named two things the same way: the example zoom's two "Closer"
  // buttons, the Review's two "Walk it", and now the chip at the top of the builder wearing the
  // same name as the card on the Sprint Backlog. Two controls, one name, no way to tell them apart
  // by ear - which is also exactly what a screen reader gets.
  it('do not answer to the same name', async () => {
    const { render } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');
    const { ParkOptions } = await import('./ParkOptions');
    const { SprintBoard } = await import('./SprintBoard');
    const { startOnTheBoard } = await import('./engine');
    const { reducer } = await import('./useZooGame');

    let s = startOnTheBoard(initialZooState(1) as ZooGameState);
    const first = s.backlog.find((b) => b.status === 'committed')!;
    s = reducer(s, { type: 'START_ITEM', id: first.id });
    const item = s.backlog.find((b) => b.id === first.id)!;

    // The two controls, side by side on the real screen: the chip at the top of the builder, and
    // the item's card on the Sprint Backlog. Rendered apart here because that is the pair, and a
    // whole board renders one of them only under conditions this test is not about.
    const panel = render(
      <MemoryRouter>
        <ParkOptions state={s} item={item}
          api={{ onDesign: () => {}, onSetEnclosure: () => {}, onOpenCard: () => {} }} />
      </MemoryRouter>,
    ).container;
    const noop = () => {};
    const board = render(
      <MemoryRouter>
        <SprintBoard state={{ ...s, dayStage: 'building' } as ZooGameState}
          onEstimate={noop} onToggleTask={noop} onFinishItem={noop} onStartItem={noop}
          onPull={noop} onSplitEpic={noop} onAssignDev={noop} onOpen={noop} onEndDay={noop}
          onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop} onBuilding={noop} />
      </MemoryRouter>,
    ).container;

    const chip = panel.querySelector('[data-part="pbi-chip"]') as HTMLElement | null;
    const card = board.querySelector('[data-part="board-card"]') as HTMLElement | null;
    expect(chip, 'the builder has nothing naming what is open in it').toBeTruthy();
    expect(card, 'there is no card on the board to be confused with').toBeTruthy();

    const name = (el: HTMLElement) => (el.getAttribute('aria-label') || el.textContent || '')
      .replace(/\s+/g, ' ').trim();

    // Both carry the item's name, which is right: they are both about that item. What neither had
    // was anything saying WHICH of the two it is, so the name came back twice with only a count
    // between them - and a count is not a difference anybody can hear.
    expect(name(chip!), 'the chip does not name its item at all').toMatch(new RegExp(item.name));
    expect(name(chip!), 'nothing on the chip says it is the one open in the builder')
      .toMatch(/being built/i);
    expect(name(card!), 'the card has started claiming to be the builder').not.toMatch(/being built/i);
  });
});
