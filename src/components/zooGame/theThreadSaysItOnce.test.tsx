import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TeamChat } from './TeamChat';
import { SprintBoard } from './SprintBoard';
import { initialZooState } from './config';
import { lendAHand, startItem } from './engine';
import { NARRATED, aboutCard } from './useZooSession';
import type { ZooGameState, ChatMessage } from './types';

// The thread says each thing once, and the board and it are the same size.
//
// Reported from playing it, with a screenshot of four lines from two people:
//
//   BEN   Giving Ada a hand with Lion.
//   CARA  Nothing I can start, so I will give Ada a hand with Lion. Two of us finishes it sooner.
//   CARA  Giving Ada a hand with Lion.
//
// "Can the messaging be combined? Can the spaces be better used?" - and, asked after: "I want the
// message window and the board to be similar in height and width."
//
// Three faults, one screenshot. The Developer played by the game said why it was helping and then
// the reducer said that it was, so every lend-a-hand was two lines in two voices. `say` already
// collapses two lines in a row from one person about one card, and it never fired here: the beat
// looks for the card under `action.id`, and this action calls it `itemId` - so the first line was
// attached to nothing and the second could not be matched to it. And the name and the figure were
// drawn over again for a second line from the same person, which is a row of furniture per message.

const sprint = (): ZooGameState => {
  const s0 = initialZooState(3) as ZooGameState;
  const pen = s0.backlog.find((it) => it.category === 'enclosure')!;
  return startItem({ ...s0, phase: 'sprint', dayStage: 'building', sprintNumber: 1,
    dayNumber: 1, daySecondsLeft: 180, sprintDays: 3, committedIds: [pen.id],
    backlog: s0.backlog.map((it) => (it.id === pen.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)) } as ZooGameState, pen.id);
};
const held = (s: ZooGameState) => s.backlog.find((it) => it.started && it.status === 'committed')!;

describe('lending a hand', () => {
  it('is one line, and it says why', () => {
    const s = sprint();
    const before = (s.chat ?? []).length;
    const after = lendAHand(s, held(s).id, s.team.developers[1].id);
    const added = (after.chat ?? []).slice(before);
    expect(added.length, 'a second pair of hands wrote more than one line').toBe(1);
    expect(added[0].text, 'the line does not say what helping buys').toMatch(/finishes it sooner/i);
    expect(added[0].from, 'the line is not in the helper’s name').toBe(s.team.developers[1].name);
  });

  it('says the truth when a third pair of hands buys nothing', () => {
    // The reason is not decoration: it is different, and it is the thing being taught.
    const one = sprint();
    const s = lendAHand(one, held(one).id, one.team.developers[1].id);
    const two = lendAHand(s, held(s).id, s.team.developers[2].id);
    const last = (two.chat ?? [])[(two.chat ?? []).length - 1];
    expect(last.text, 'a third helper is promised the same gain as the second').toMatch(/buys nothing/i);
  });

  it('is attached to the card it is about, so a run can be collapsed', () => {
    // `say` matches two lines in a row by person AND card. A line about no card matches nothing.
    const s = sprint();
    const after = lendAHand(s, held(s).id, s.team.developers[1].id);
    const last = (after.chat ?? [])[(after.chat ?? []).length - 1];
    expect(last.itemId, 'the line belongs to no card').toBe(held(s).id);
  });
});

describe('who speaks for a move', () => {
  it('leaves to the reducer every move the reducer already narrates', () => {
    // Two halves of one fact, which is why they are asserted together: the reducer writes a line
    // for this move, and the beat knows not to write a second one. Either half alone is true and
    // useless - the bug was that the first was true and the second was not.
    const s = sprint();
    const before = (s.chat ?? []).length;
    expect((lendAHand(s, held(s).id, s.team.developers[1].id).chat ?? []).length,
      'the reducer no longer speaks for lending a hand').toBe(before + 1);
    expect([...NARRATED], 'the beat speaks for it as well, so it is said twice')
      .toContain('LEND_A_HAND');
    // The move it was written for, still there.
    expect([...NARRATED]).toContain('START_ITEM');
  });

  it('knows which card a move is about, whichever name the action gives it', () => {
    // `say` collapses two lines in a row from one person about one card. A line attached to no
    // card matches nothing, so it collapses nothing - which is how the thread kept both halves of
    // a pair that should have been one.
    const s = sprint();
    const card = held(s).id;
    expect(aboutCard({ type: 'FINISH_ITEM', id: card } as never), 'a move keyed by id').toBe(card);
    // The live one: the Developers put a second pair of eyes on a card.
    expect(aboutCard({ type: 'ASSIGN_DEV', itemId: card, devId: 'd2' } as never),
      'a move keyed by itemId reaches the thread attached to nothing').toBe(card);
    expect(aboutCard({ type: 'RUN_DAILY_SCRUM' } as never), 'a move about no card claimed one')
      .toBeUndefined();
  });
});

describe('a run of messages from one person', () => {
  const thread = (msgs: Partial<ChatMessage>[]) => {
    const s = { ...initialZooState(3), chat: msgs.map((m, i) => ({
      id: `m${i}`, day: 1, who: 'developer', from: 'Ben', text: 'something', ...m })) } as ZooGameState;
    return render(<MemoryRouter><TeamChat state={s} rail={<div />} /></MemoryRouter>);
  };

  it('introduces the first and not the rest', () => {
    const { container } = thread([{ text: 'One.' }, { text: 'Two.' }, { text: 'Three.' }]);
    const opens = [...container.querySelectorAll('[data-part="chat-message"]')]
      .map((el) => el.getAttribute('data-opens'));
    expect(opens, 'every line in a run is introduced all over again').toEqual(['yes', 'no', 'no']);
    expect(container.querySelectorAll('[data-part="chat-message"] svg').length,
      'the figure is drawn again for every line one person says').toBe(1);
  });

  it('introduces each new speaker', () => {
    const { container } = thread([{ from: 'Ben' }, { from: 'Cara' }, { from: 'Cara' }]);
    expect([...container.querySelectorAll('[data-part="chat-message"]')]
      .map((el) => el.getAttribute('data-opens')), 'a change of speaker went unannounced')
      .toEqual(['yes', 'yes', 'no']);
  });

  it('introduces the first line of a new day, whoever said the last one', () => {
    const { container } = thread([{ day: 1 }, { day: 2 }]);
    expect([...container.querySelectorAll('[data-part="chat-message"]')]
      .map((el) => el.getAttribute('data-opens')), 'a new day opened mid-run').toEqual(['yes', 'yes']);
  });
});

describe('the board and the message centre', () => {
  it('each get half the pane', () => {
    // Asked of the classes rather than of a layout, because a rendering with no viewport has no
    // layout to ask - the same reason the dock's width is asked this way. Measured in a browser
    // the two come out identical: 702x311 at 1440x900, 622x261 at 1280x800.
    //
    // The message centre used to take what it needed up to 40vh while the board took everything
    // left over, so they were never the same and usually not close: a board holding two cards had
    // 180px and the thread had 360.
    const noop = () => {};
    const s = sprint();
    const { container } = render(
      <MemoryRouter>
        <SprintBoard state={s} onEstimate={noop} onToggleTask={noop} onFinishItem={noop}
          onStartItem={noop} onPull={noop} onSplitEpic={noop} onAssignDev={noop} onOpen={noop}
          onEndDay={noop} onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop}
          onBuilding={noop} rail={<div data-part="the-rail" />} />
      </MemoryRouter>,
    );
    const centre = container.querySelector('[data-part="message-centre"]')!;
    expect(centre, 'the message centre is not a pane of its own').toBeTruthy();
    expect(centre.className, 'it is sized by its content rather than given half the pane')
      .toMatch(/flex-1/);
    expect(centre.className, 'it keeps its content’s height, so the board gets what is left')
      .toMatch(/basis-0/);
    // Its sibling above is the board pane, and it shares the rule.
    expect(centre.previousElementSibling?.className, 'the board does not share the pane evenly')
      .toMatch(/flex-1/);
  });
});
