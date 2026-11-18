import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { initialZooState } from './config';
import { answerImpediment, endDay } from './engine';
import { DailyScrum } from './DailyScrum';
import { DodEditor } from './DodEditor';
import { DEFAULT_DOD } from './config';
import type { ZooGameState, Impediment } from './types';

// Escalated, and still waited on - not asked about again as though it were new.
//
// The scrum-master playtest escalated a sick keeper at one Daily Scrum and was asked about a sick
// keeper, with the same four answers, at the next: "I already chose 'Escalate it' ... It is not
// clear whether this is a new occurrence ... or the same one repeating because escalation did not
// resolve it." The daily roll is independent and had landed on the same thing.

const sick = (): Impediment => ({ id: 'imp-1-1', title: 'A keeper called in sick', detail: 'short handed', kind: 'impediment' });

const escalatedYesterday = (): ZooGameState => {
  const base = initialZooState(3);
  const items = base.backlog.filter((it) => !it.unsized && !['epic', 'exhibit'].includes(it.category)).slice(0, 2);
  const atScrum = {
    ...base, phase: 'sprint', dayStage: 'dailyScrum', sprintNumber: 1, dayNumber: 1, sprintDays: 3,
    dailyScrumAt: 'start', daySecondsLeft: 90, scrumSecondsLeft: 20, pendingImpediment: sick(),
    backlog: base.backlog.map((it) => (items.some((x) => x.id === it.id)
      ? { ...it, status: 'committed' as const, sprintNumber: 1, started: it.id === items[0].id } : it)),
  } as ZooGameState;
  return { ...answerImpediment(atScrum, 'escalate'), dayStage: 'building' } as ZooGameState;
};

describe('something escalated and still being waited on', () => {
  it('is not put to the team again when the day brings the same thing', () => {
    const s = escalatedYesterday();
    expect(s.carriedImpediment?.waitDays, 'escalating started no wait, so this proves nothing').toBeTruthy();
    // The trainer's hand stands in for the roll, so the same thing surfacing is certain.
    const next = endDay({ ...s, trainerLed: true, trainerCard: sick() } as ZooGameState);
    expect(next.dayStage).toBe('dailyScrum');
    expect(next.pendingImpediment, 'the escalated keeper was put to the team again as new').toBeNull();
  });

  it('still surfaces something different', () => {
    const s = escalatedYesterday();
    const paint: Impediment = { id: 'imp-1-2', title: 'The paint delivery is late', detail: 'no colours', kind: 'impediment' };
    const next = endDay({ ...s, trainerLed: true, trainerCard: paint } as ZooGameState);
    expect(next.pendingImpediment?.title).toBe(paint.title);
  });

  it('says, at the Daily Scrum, what is still being waited on', () => {
    const s = endDay({ ...escalatedYesterday(), trainerLed: true, trainerCard: sick() } as ZooGameState);
    const noop = () => {};
    const c = render(<MemoryRouter><DailyScrum state={s} onHold={noop} onSkip={noop} onDrop={noop} /></MemoryRouter>).container;
    const line = c.querySelector('[data-part="still-waiting"]')?.textContent ?? '';
    expect(line).toMatch(/Still waiting: A keeper called in sick/);
    expect(line).toMatch(/out of the team.s hands/);
  });
});

describe('the Definition of Done, where the Product Owner is in it', () => {
  // "the Product Owner is not the one who confirms DoD criteria" - scrum-master playtest. It is this
  // zoo's line, and the panel now says so beside it.
  it('says whose rule that is', () => {
    const c = render(<DodEditor dod={DEFAULT_DOD} onSave={() => {}} />).container;
    expect(c.querySelector('[data-part="dod-whose-rule"]')?.textContent).toMatch(/this zoo.s rule, not the Scrum Guide.s/);
  });
  it('says nothing when no line puts the Product Owner in it', () => {
    const c = render(<DodEditor dod={['Peer-reviewed by another Developer']} onSave={() => {}} />).container;
    expect(c.querySelector('[data-part="dod-whose-rule"]')).toBeNull();
  });
});
