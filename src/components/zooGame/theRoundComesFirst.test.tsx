import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { initialZooState } from './config';
import { yourStandUp } from './engine';
import { DailyScrum } from './DailyScrum';
import type { Impediment, ZooGameState } from './types';

// "The screen is simultaneously showing step 2 (my turn to speak) and step 3 (change today's plan /
// the blocker). It is not clear whether I need to pick one of the 'what do you say' options first"
// (sm23, sm24, sm26, sm27). The round comes first, so step three says so until you have spoken. It
// stays usable: it also holds ending the event, which is never locked behind speaking.

const supplier: Impediment = { id: 'imp-1', title: 'Supplier late', detail: 'The fencing has not arrived.', kind: 'impediment' };
const atTheDailyScrum = (): ZooGameState => ({ ...initialZooState(3), phase: 'sprint', dayStage: 'dailyScrum',
  sprintNumber: 1, dayNumber: 2, pendingImpediment: supplier } as ZooGameState);
const show = (s: ZooGameState) => render(
  <MemoryRouter><DailyScrum state={s} onHold={() => {}} onSkip={() => {}} onDrop={() => {}} onAnswer={() => {}} onSay={() => {}} /></MemoryRouter>,
).container;

describe('the Daily Scrum, in order', () => {
  it('says the plan changes after your turn, while your turn is still to come', () => {
    const s = atTheDailyScrum();
    expect(yourStandUp(s).length, 'this test needs a turn still to take').toBeGreaterThan(0);
    const c = show(s);
    const third = c.querySelector('[data-step="3"]')!;
    expect(third.textContent).toMatch(/After your turn round the room\./);
    expect(third.getAttribute('data-faded')).toBe('true');
    // ...and it is not locked: its answers are still there to press.
    expect(third.querySelectorAll('button').length).toBeGreaterThan(0);
  });

  it('stops saying so once you have spoken', () => {
    const s = atTheDailyScrum();
    const said = { ...s, chat: [...(s.chat ?? []), { id: 'm-you', who: 'you', from: 'You', text: 'Where I am', kind: 'stand-up', day: 2 }] } as unknown as ZooGameState;
    const third = show(said).querySelector('[data-step="3"]')!;
    expect(third.textContent).not.toMatch(/After your turn/);
    expect(third.getAttribute('data-faded')).toBeNull();
  });
});
