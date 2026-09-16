import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChooseSolutionPanel, ProductBacklogSidebar } from './Board';
import { BacklogTab } from './BacklogBench';
import { initialZooState } from './config';
import { chooseSolution, notReady, adopted } from './engine';
import { checkCriterion } from './parkChecks';
import type { ZooGameState } from './types';

// The Product Owner captures what is needed. The Developers decide how.
//
// The game used to make that decision for you: an item arrived called "Gift Shop, 5 points" and
// there was nothing left to decide. Somewhere to eat is met by a kiosk, a cafe, a stall or a shop,
// and which one is a decision about cost, room and how long people stay - which is the Developers'.
//
// Only one item on the Backlog is written this way, on purpose. A Product Backlog with nothing but
// needs on it teaches that a Product Owner never specifies anything, which is not true either, and
// a bridge over the river is a bridge.

const seeded = (): ZooGameState => initialZooState(1) as ZooGameState;
const theNeed = (s: ZooGameState) => s.backlog.find((it) => it.category === 'need')!;

describe('a need on the Product Backlog', () => {
  it('says what is wanted and not what to build', () => {
    const need = theNeed(seeded());
    expect(need, 'nothing is written as a need').toBeTruthy();
    expect(need.name).toBe('Somewhere to eat');
    expect(need.story, 'a need with no story is a title').toMatch(/^As a visitor I want .* so that /);
    expect(need.template, 'the need already decided what to build').toBeUndefined();
    expect(need.services, 'the need already decided what it offers').toBeUndefined();
  });

  it('cannot be forecast, because nobody has decided what the work is', () => {
    const s = seeded();
    const need = theNeed(s);
    expect(need.unsized).toBe(true);
    const why = notReady(need, s);
    expect(why, 'a need with no decision behind it was ready to forecast').toBeTruthy();
    // ...and for the right reason. "Not sized yet" would send the Developers to the planning poker,
    // which is the wrong conversation: what is missing is the decision, and sizing follows it.
    expect(why, 'it reads as neglect rather than as an undecided how').toMatch(/decided what will meet this/i);
  });

  it('is ready once they have decided', () => {
    const s = seeded();
    const after = chooseSolution(s, theNeed(s).id, 'Kiosk');
    const item = after.backlog.find((it) => it.id === theNeed(s).id)!;
    // Sized is a separate question, and the Developers answer it next - so it is still not ready,
    // for the honest reason now rather than the one about the decision.
    expect(notReady(item, after) ?? '', 'the choice did not settle what the choice was about')
      .not.toMatch(/decided what will meet this/i);
    expect(notReady(item, after), 'it went straight to ready without anybody sizing it')
      .toMatch(/Not sized yet/i);
  });

  it('asks for the same things the building it becomes would be asked', () => {
    // The criteria are the Product Owner's. They are what the item is FOR, and they do not change
    // when the Developers decide how.
    const need = theNeed(seeded());
    expect(need.acceptance).toContain('Can I buy food and a drink here?');
    expect(need.acceptance).toContain('Can I walk to it from the way in?');
  });
});

describe('the Developers choosing', () => {
  const chosen = (pick: string) => {
    const s = seeded();
    const need = theNeed(s);
    const after = chooseSolution(s, need.id, pick);
    return { before: need, after, item: after.backlog.find((it) => it.id === need.id)! };
  };

  it('turns it into the thing they chose', () => {
    const { item } = chosen('Cafe');
    expect(item.category).toBe('amenity');
    expect(item.template).toBe('cafe');
    expect(item.name).toBe('Cafe');
  });

  it('does not touch what was asked for', () => {
    // A solution that rewrites the need is not a solution, it is a different item.
    const { before, item } = chosen('Kiosk');
    expect(item.acceptance).toEqual(before.acceptance);
    expect(item.story, 'the story the Product Owner wrote was thrown away').toBe(before.story);
    expect(item.needName, 'what was asked for is not kept anywhere').toBe('Somewhere to eat');
  });

  it('makes it sizable, which is not the same as sized', () => {
    // The choice is what makes an estimate possible: there is work to look at now. The Developers
    // still have to make one. Marking it sized here put a Cafe on the board reading "Ready, 0
    // points" - sized at nothing, and claiming to be ready to forecast on the strength of it.
    const { before, item } = chosen('Kiosk');
    expect(before.unsized).toBe(true);
    expect(item.unsized, 'choosing sized it, at nothing').toBe(true);
    expect(item.estimate).toBe(0);
    expect(item.trueSize, 'there is nothing for the cards to cluster around').toBeGreaterThan(0);
  });

  it('lets a different choice make a different amount of work', () => {
    // This is what makes it a decision rather than a formality.
    const kiosk = chosen('Kiosk').item;
    const stall = chosen('Picnic Area').item;
    expect(kiosk.services).toBe('food');
    expect(stall.services).toBe('rest');
  });

  it('writes down who chose and what, because it is a decision', () => {
    const { after } = chosen('Cafe');
    const said = (after.decisions ?? []).map((d) => d.what).join(' ');
    expect(said, 'the choice is not in the log').toMatch(/Developers chose Cafe to meet "Somewhere to eat"/);
  });

  it('makes the criteria answerable, which they were not before', () => {
    // Before the choice there is nothing to look at: no services, no sign, nowhere. After it, the
    // park can start settling them - and says what is still missing.
    const s = seeded();
    const need = theNeed(s);
    const before = checkCriterion(s, need, 'Can I buy food and a drink here?')!;
    expect(before.met).toBe(false);
    const after = chooseSolution(s, need.id, 'Cafe');
    const item = after.backlog.find((it) => it.id === need.id)!;
    expect(checkCriterion(after, item, 'Can I buy food and a drink here?')!.met,
      'choosing a cafe did not make it somewhere you can eat').toBe(true);
  });

  it('refuses to choose for anything that is not a need', () => {
    const s = seeded();
    const pen = s.backlog.find((it) => it.category === 'enclosure')!;
    expect(chooseSolution(s, pen.id, 'Cafe')).toBe(s);
    expect(chooseSolution(s, theNeed(s).id, 'Nothing In The Toolbox')).toBe(s);
  });
});

describe('the panel that offers the choice', () => {
  const panel = (onChoose = () => {}) => {
    const need = theNeed(seeded());
    return render(<ChooseSolutionPanel item={need} onChoose={onChoose} />);
  };

  it('offers what can settle what was asked, and says so', () => {
    const { container } = panel();
    const rows = [...container.querySelectorAll('[data-part="choose-solution"]')];
    const names = rows.map((r) => r.getAttribute('data-pick'));
    expect(names, 'nothing that sells food is offered for somewhere to eat').toEqual(
      expect.arrayContaining(['Kiosk', 'Cafe', 'Gift Shop']));
    expect(container.textContent).toMatch(/meets \d of the 3/);
    // Best answer first: unsorted, a Large Tank sat above the Kiosk because a tank is also
    // something you can walk to. True, and no help to somebody deciding where lunch comes from.
    expect(names[0], 'the list is in catalogue order, which puts a tank above a kiosk')
      .toMatch(/Kiosk|Cafe|Gift Shop/);
  });

  it('does not offer a lion as somewhere to eat', () => {
    const { container } = panel();
    const names = [...container.querySelectorAll('[data-part="choose-solution"]')].map((r) => r.getAttribute('data-pick'));
    expect(names, 'the list is the whole catalogue, which is no help at all').not.toContain('Lion');
  });

  it('will still show everything, because choosing badly is a decision too', () => {
    // Nothing is refused. A game that will not let the Developers be wrong cannot teach them
    // anything, and the park says what happened afterwards.
    const { container } = panel();
    fireEvent.click(screen.getByText(/Show everything/i));
    const names = [...container.querySelectorAll('[data-part="choose-solution"]')].map((r) => r.getAttribute('data-pick'));
    expect(names).toContain('Lion');
    expect(container.textContent).toMatch(/meets none of it/);
  });

  it('hands the choice back', () => {
    const onChoose = vi.fn();
    const { container } = panel(onChoose);
    fireEvent.click(container.querySelector('[data-part="choose-solution"][data-pick="Cafe"]')!);
    expect(onChoose).toHaveBeenCalledWith('Cafe');
  });
});

describe('the Product Backlog screen', () => {
  it('offers the decision on the tab as well as at the event', () => {
    // Refinement is ongoing work, and the game says so on this very screen: "it happens while the
    // Sprint runs". The tab already offered the other two acts - size it, split it up - and cost the
    // day's build time for them. The one act a need is waiting on was missing, so a need opened
    // during a Sprint said "nobody has decided what will meet this" and then offered no way to
    // decide it. A screen that names the blockage and withholds the remedy is worse than one that
    // says nothing.
    const s = { ...seeded(), phase: 'sprint', adopted: ['refinement'] } as unknown as ZooGameState;
    if (!adopted(s, 'refinement')) return;
    render(
      <MemoryRouter>
        <BacklogTab state={s} onEstimate={() => {}} onAddPbi={() => {}} onRefinePbi={() => {}}
          onReorder={() => {}} onMoveZone={() => {}} onMoveBefore={() => {}} onSetUseStories={() => {}}
          onSplitEpic={() => {}} onChooseSolution={() => {}} onDeletePbi={() => {}} onDuplicatePbi={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: /What will meet this/i }),
      'the Product Backlog tab names the undecided need and offers nothing to decide it with').toBeTruthy();
  });

  it('asks the Developers to decide, where an epic is asked to be split', () => {
    const s = { ...seeded(), adopted: ['refinement'] } as unknown as ZooGameState;
    if (!adopted(s, 'refinement')) return;   // the practice has to be in play for any of this to show
    render(
      <MemoryRouter>
        <ProductBacklogSidebar state={s} mode="refine" onChooseSolution={() => {}} onSplitEpic={() => {}}
          onAddPbi={() => {}} onRefinePbi={() => {}} onSetUseStories={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: /What will meet this/i }),
      'a need offers nothing to decide').toBeTruthy();
  });
});
