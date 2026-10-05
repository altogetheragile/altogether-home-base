import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { initialZooState, DAY_SECONDS } from './config';
import { startItem, endDay, standUp, standUpLines, yourStandUp, otherDevs, yourDev, askIfDue } from './engine';
import { DailyScrum } from './DailyScrum';
import { cardFor } from './scrumContent';
import type { ZooGameState, Impediment } from './types';

// The Daily Scrum, out loud.
//
// The event was a dashboard. Three numbers, a burndown, a decision and whatever had surfaced
// overnight - everything a Daily Scrum is FOR, and nobody in the room saying a word. The player
// read it, pressed a button, and the day went on.
//
// A Daily Scrum is the Developers talking to each other. So now they do, and you take your turn.
//
// The three questions are not the Guide's. The 2020 Guide dropped them: "The Developers can
// select whatever structure and techniques they want, as long as their Daily Scrum focuses on
// progress toward the Sprint Goal and produces an actionable plan for the next day of work." The
// game uses them because they are what most teams meet, and says on the card that they are a
// format rather than a rule.

const sprint = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const ready = base.backlog
    .filter((it) => !it.unsized && !['epic', 'exhibit'].includes(it.category)).slice(0, 4);
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1, sprintDays: 3,
    daySecondsLeft: DAY_SECONDS, wipLimit: 0, dailyScrumAt: 'start',
    committedIds: ready.map((it) => it.id),
    backlog: base.backlog.map((it) => (ready.some((r) => r.id === it.id)
      ? { ...it, status: 'committed' as const, sprintNumber: 1, pos: { x: 200, y: 300 } } : it)),
    ...over,
  } as ZooGameState;
};

/** Ben on the Lion Enclosure, Cara on the next thing, you on the one after. */
const theTeamIsWorking = (over: Partial<ZooGameState> = {}): ZooGameState => {
  let s = sprint(over);
  const [ben, cara] = otherDevs(s);
  const take = s.backlog.filter((it) => it.status === 'committed');
  s = startItem(s, take[0].id, 'developer', ben.id);
  s = startItem(s, take[1].id, 'developer', cara.id);
  s = startItem(s, take[2].id);
  return s;
};

const linesOf = (s: ZooGameState, from: string) =>
  (s.chat ?? []).filter((m) => m.from === from && m.text.includes('In my way:')).map((m) => m.text);

describe('the room is talking when you walk in', () => {
  it('has everybody’s piece said by the time the event opens', () => {
    // Posted by the reducer rather than by the AI beat. An event whose first six seconds are spent
    // watching people arrive has spent a fifth of its timebox on nothing.
    const after = endDay(theTeamIsWorking());
    expect(after.dayStage, 'the day did not end at the Daily Scrum').toBe('dailyScrum');
    for (const dev of otherDevs(after)) {
      expect(linesOf(after, dev.name).length, `${dev.name} said nothing at the Daily Scrum`).toBe(1);
    }
  });

  it('says where they got to, what they are on and what is in the way', () => {
    const s = theTeamIsWorking();
    const [ben] = otherDevs(s);
    const his = s.backlog.find((it) => it.pulledBy === ben.id)!;
    const said = standUpLines(s, ben);
    expect(said, 'nothing about yesterday').toMatch(/Yesterday, toward the goal:/);
    expect(said, 'nothing about today').toMatch(/Today, toward the goal:/);
    expect(said, 'nothing about what is in the way').toMatch(/In my way:/);
    expect(said, 'the card they are actually holding is not in it').toContain(his.name);
  });

  it('is about the Sprint Goal, which is the one thing the Guide insists on', () => {
    // "as long as their Daily Scrum focuses on progress toward the Sprint Goal". Three status
    // updates in a row is what this event turns into when nobody says why they are here.
    const s = theTeamIsWorking();
    expect(standUpLines(s, otherDevs(s)[0]).match(/toward the goal/g) ?? [],
      'nothing in the stand-up mentions the Goal it is supposed to be about').toHaveLength(2);
  });

  it('names what somebody finished, rather than claiming nothing was', () => {
    const s = theTeamIsWorking();
    const [ben] = otherDevs(s);
    const his = s.backlog.find((it) => it.pulledBy === ben.id)!;
    const done = { ...s, backlog: s.backlog.map((it) => (it.id === his.id
      ? { ...it, status: 'done' as const } : it)) } as ZooGameState;
    expect(standUpLines(done, ben), 'a finished card is not reported as finished')
      .toContain(`finished ${his.name}`);
  });
});

describe('what is in my way', () => {
  const keeperOff: Impediment = { kind: 'impediment', title: 'A keeper called in sick',
    detail: 'Nobody is free to prep the new enclosure.' } as Impediment;

  it('is named once, not read out by everybody', () => {
    // An impediment slows the whole team, so everybody would say it - and three people reading
    // out the same sentence is how a stand-up sounds when nobody is listening to the one before.
    const s = standUp(theTeamIsWorking({ pendingImpediment: keeperOff }));
    const saidIt = (s.chat ?? []).filter((m) => m.text.includes('a keeper called in sick'));
    expect(saidIt.length, 'everybody in the room read out the same impediment').toBe(1);
  });

  it('is yours before it is the team’s, when somebody is waiting on an answer', () => {
    // A question nobody has answered is a person standing still, and that is the costliest thing
    // this event can surface.
    const s = askIfDue(theTeamIsWorking({ pendingImpediment: keeperOff }));
    const asker = (s.questions ?? [])[0];
    expect(asker, 'nobody is waiting on anything, so nothing is being tested').toBeTruthy();
    const dev = s.team.developers.find((d) => d.name === asker.from)!;
    expect(standUpLines(s, dev, false), 'the person who is stuck reported the team’s weather instead')
      .toMatch(/In my way: waiting on an answer/);
  });

  it('is a card that has sat there for days, where one has', () => {
    const s = theTeamIsWorking({ dayNumber: 4 });
    const [ben] = otherDevs(s);
    const his = s.backlog.find((it) => it.pulledBy === ben.id)!;
    const stale = { ...s, backlog: s.backlog.map((it) => (it.id === his.id
      ? { ...it, startedDay: 1 } : it)) } as ZooGameState;
    expect(standUpLines(stale, ben, true), 'a card four days old is not worth mentioning')
      .toMatch(new RegExp(`${his.name} has been with me 4 days`));
  });

  it('is nothing, when it is nothing', () => {
    const s = theTeamIsWorking({ pendingImpediment: null });
    expect(standUpLines(s, otherDevs(s)[0], false)).toMatch(/In my way: nothing\.$/);
  });
});

describe('your turn', () => {
  it('is three things your own cards make true', () => {
    const s = theTeamIsWorking();
    const you = yourDev(s)!;
    const mine = s.backlog.find((it) => it.pulledBy === you.id)!;
    const options = yourStandUp(s);
    expect(options.length, 'there is nothing to say').toBe(3);
    for (const o of options) {
      expect(o.text, `"${o.label}" does not answer what is in your way`).toMatch(/In my way:/);
    }
    expect(options[0].text, 'the one about the Goal does not mention your own card').toContain(mine.name);
  });

  it('offers a way to focus on the Goal, and the two ways this event goes wrong', () => {
    // Nothing scores them. The Retrospective reads back what was said.
    const labels = yourStandUp(theTeamIsWorking()).map((o) => o.label);
    expect(labels[0], 'the option about the Sprint Goal is not offered').toMatch(/Goal/);
    expect(labels.join(' '), 'the status-report answer is not on offer').toMatch(/busy with/i);
    expect(labels.join(' '), 'the promise-instead-of-a-plan answer is not on offer').toMatch(/finished by tonight/i);
  });

  it('does not repeat what the room has already heard', () => {
    const s = theTeamIsWorking({
      pendingImpediment: { kind: 'impediment', title: 'A keeper called in sick', detail: '' } as Impediment,
    });
    expect(yourStandUp(s)[0].text, 'you read the team’s impediment out again after somebody else did')
      .not.toContain('keeper');
  });
});

describe('the screen', () => {
  const scrum = (s: ZooGameState, onSay: (t: string) => void = () => {}) => render(
    <MemoryRouter><DailyScrum state={s} onHold={() => {}} onSkip={() => {}} onSay={onSay} /></MemoryRouter>,
  ).container;

  it('draws the room, and says whose format the three questions are', () => {
    const c = scrum(endDay(theTeamIsWorking()));
    const room = c.querySelector('[data-part="stand-up"]');
    expect(room, 'the Daily Scrum is a dashboard again: nobody in the room says anything').toBeTruthy();
    expect(room!.textContent, 'the three questions are presented as though they were the Guide’s')
      .toMatch(/not the Guide/i);
    expect(c.querySelectorAll('[data-part="chat-message"]').length,
      'the Developers are not drawn as people saying things').toBeGreaterThan(1);
  });

  it('gives you your turn, and takes it away once you have spoken', () => {
    const said: string[] = [];
    const open = endDay(theTeamIsWorking());
    const c = scrum(open, (t: string) => { said.push(t); });
    const turn = c.querySelector('[data-part="your-turn"]')!;
    expect(turn, 'everybody speaks but you').toBeTruthy();
    const pick = [...turn.querySelectorAll('button')][0];
    fireEvent.click(pick);
    expect(said.length, 'choosing a line said nothing').toBe(1);
    expect(said[0]).toMatch(/In my way:/);

    const after = { ...open, chat: [...(open.chat ?? []),
      { id: 'yours', who: 'you' as const, from: 'You', text: said[0], day: open.dayNumber }] };
    expect(scrum(after as ZooGameState).querySelector('[data-part="your-turn"]'),
      'you are asked to speak again after you have spoken').toBeNull();
  });
});

describe('the teaching card', () => {
  it('says the three questions are a format rather than a rule', () => {
    const card = cardFor('daily-scrum')!;
    expect(card.notScrum, 'the game teaches a 2017 format as though it were the Guide’s').toBeTruthy();
    expect(card.notScrum, 'it does not say the 2020 Guide dropped them').toMatch(/2020 Guide removed them/);
    expect(card.notScrum, 'it does not say whose choice the structure is')
      .toMatch(/Developers select whatever structure/);
  });
});
