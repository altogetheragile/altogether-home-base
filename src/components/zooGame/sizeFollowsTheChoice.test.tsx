import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ItemBench } from './BacklogBench';
import { CardDialog } from './CardDialog';
import { chooseSolution, estimateItem, outgrown, acceptSignal, setEnclosureSize } from './engine';
import { effortOf } from './config';
import { SIGNAL_NEEDS } from './signalNeeds';
import { initialZooState } from './config';
import type { ZooGameState, BacklogItem } from './types';

// You size the work you intend to do.
//
// Step 6 of the needs model. The first half shipped with the choice itself: an unchosen need has no
// size, and choosing is what makes one possible - a Kiosk and a Cafe are different amounts of work
// and the estimate follows which one the Developers picked.
//
// What was left was the two places a number could still contradict the choice behind it. A need
// carried a size of its own before anybody had decided anything, which the choice then overwrote
// with a different one. And an item could be sized as a small habitat and then made a large one,
// leaving five points standing as a claim about work nobody is doing any more.

const seeded = (): ZooGameState => initialZooState(1) as ZooGameState;
const theNeed = (s: ZooGameState) => s.backlog.find((it) => it.category === 'need')!;
const adopting = (s: ZooGameState) => ({ ...s, adopted: ['refinement'] } as unknown as ZooGameState);

describe('a need has no size, because nobody has decided what the work is', () => {
  it('is not given one when it is written', () => {
    expect(theNeed(seeded()).trueSize,
      'a need arrived carrying a size for work nobody had chosen').toBeUndefined();
  });

  it('is not given one when the visitors raise it either', () => {
    for (const need of Object.values(SIGNAL_NEEDS)) {
      expect('trueSize' in need, `${need.name} arrives pre-sized`).toBe(false);
    }
  });

  it('gets one from what the Developers choose, and a different one for a different choice', () => {
    const s = adopting(seeded());
    const id = theNeed(s).id;
    const sizeAfter = (pick: string) =>
      chooseSolution(s, id, pick).backlog.find((it) => it.id === id)!.trueSize;
    expect(sizeAfter('Kiosk'), 'choosing settled nothing about the size').toBeGreaterThan(0);
    // A picnic area is a bench and a cafe is a building you go inside. If both come out the same,
    // the choice is a formality.
    expect(sizeAfter('Picnic Area')).not.toBe(sizeAfter('Cafe'));
  });

  it('is sized by the Developers even once it can be, not by the game', () => {
    const s = adopting(seeded());
    const id = theNeed(s).id;
    const after = chooseSolution(s, id, 'Cafe').backlog.find((it) => it.id === id)!;
    expect(after.unsized, 'choosing sized it, without anybody being asked').toBe(true);
    expect(after.estimate).toBe(0);
  });
});

describe('when the work stops being what was sized', () => {
  const sized = (): { s: ZooGameState; pen: BacklogItem; bigger: 'small' | 'medium' | 'large' } => {
    const base = adopting(seeded());
    const found = base.backlog.find((it) => it.category === 'enclosure')!;
    const s = estimateItem(base, found.id, 5);
    const pen = s.backlog.find((it) => it.id === found.id)!;
    // Whatever it is not, so the fixture cannot quietly change nothing.
    const bigger = (pen.enclosureSize === 'large' ? 'small' : 'large') as 'small' | 'large';
    return { s, pen, bigger };
  };

  it('says nothing while the item is still the thing they sized', () => {
    const { pen } = sized();
    expect(outgrown(pen), 'it complained about an item nobody had changed').toBeNull();
  });

  it('notices a habitat that was sized small and is now large', () => {
    const { s, pen, bigger } = sized();
    const grown = setEnclosureSize(s, pen.id, bigger).backlog.find((it) => it.id === pen.id)!;
    const said = outgrown(grown);
    expect(said, 'five points still stands for work nobody is doing').toBeTruthy();
    expect(said!.now, 'the new size is not the size of the new work')
      .toBe(effortOf({ category: 'enclosure', enclosureSize: bigger }));
    expect(said!.was).toBe(effortOf({ category: 'enclosure', enclosureSize: pen.enclosureSize ?? 'medium' }));
  });

  it('does not re-size it, because the estimate is the Developers', () => {
    // An estimate the game rewrites is not an estimate, it is a measurement wearing one's clothes -
    // and the Retro is explicit that nothing reads a cost back into a size.
    const { s, pen, bigger } = sized();
    const grown = setEnclosureSize(s, pen.id, bigger).backlog.find((it) => it.id === pen.id)!;
    expect(grown.estimate, 'the game re-sized the item on their behalf').toBe(5);
    expect(grown.unsized, 'it quietly un-sized their work').toBe(false);
  });

  it('says so on the card, which is where a mid-Sprint change is seen', () => {
    // The control that changes the work is the footprint on the build strip, and by then the item
    // is in the Sprint - so the bench, which serves the Product Backlog, is not where anybody is
    // standing when this happens.
    const { s, pen, bigger } = sized();
    const grown = setEnclosureSize(s, pen.id, bigger).backlog.find((it) => it.id === pen.id)!;
    render(<CardDialog state={s} item={grown} onClose={() => {}} onBuilding={() => {}} />);
    const note = document.querySelector('[data-part="outgrown"]');
    expect(note, 'the card says nothing about the size being about different work').toBeTruthy();
    expect(note!.textContent).toMatch(/Daily Scrum/);
    expect(note!.textContent!.length, 'a banner nobody reads is a banner').toBeLessThan(110);
  });

  it('says so on the bench, where sizing it again is one press away', () => {
    const { s, pen, bigger } = sized();
    const grown = setEnclosureSize(s, pen.id, bigger).backlog.find((it) => it.id === pen.id)!;
    const { container } = render(
      <ItemBench state={s} item={grown} onEstimate={() => {}} onRefinePbi={() => {}}
        onSplitEpic={() => {}} onSetUseStories={() => {}} />,
    );
    const note = container.querySelector('[data-part="outgrown"]');
    expect(note, 'nothing says the estimate is about different work now').toBeTruthy();
    expect(note!.textContent).toMatch(/sized/i);
  });
});

describe('the Product Backlog a player actually meets', () => {
  it('notices a seeded item outgrowing its size, though nobody sized it in front of us', () => {
    // Most of the Backlog arrives already sized - seeded, or sized off-screen by a team that has
    // not taken refinement on. Reading only what was sized in front of the player meant this said
    // nothing about any of the items in a new game.
    const s = seeded();
    const pen = s.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
    expect(outgrown(pen), 'it complained about an item nobody had touched').toBeNull();
    const bigger = pen.enclosureSize === 'large' ? 'small' : 'large';
    const grown = setEnclosureSize(s, pen.id, bigger).backlog.find((it) => it.id === pen.id)!;
    expect(outgrown(grown), 'a seeded habitat changed size and nothing said so').toBeTruthy();
  });
});

describe('a need the visitors raised', () => {
  it('is sized from what was chosen, not from what the complaint guessed', () => {
    // The table used to carry a size per signal, and the choice then overwrote it with a different
    // one: "somewhere to eat" was five points until somebody picked a kiosk, which is three.
    const s = { ...seeded(), sprintNumber: 1, signals: [{ drivenBy: 'unmet:food', suggestion: 'x', estimatedValue: 'high' as const }] } as ZooGameState;
    const after = acceptSignal(s, 0);
    const made = after.backlog.find((it) => !s.backlog.some((b) => b.id === it.id))!;
    // This team has not adopted refinement, so the Developers chose off-screen - and the size that
    // came out is the size of what they chose.
    expect(made.estimate).toBe(effortOf(made));
  });
});
