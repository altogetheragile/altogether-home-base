import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooShell } from './ZooShell';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// "These tabs do not do anything when I am in Sprint planning" (Al, 25 November 2026). The event
// filled the screen over whichever tab was chosen, so pressing one only moved its highlight. Now it
// sets the event aside to show that artifact, with a way back.

const planning = { ...initialZooState(3), phase: 'planning', planningTopic: 'what', sprintNumber: 1 } as ZooGameState;
const shell = () => render(<MemoryRouter><ZooShell state={planning}><div data-testid="event">the planning screen</div></ZooShell></MemoryRouter>);
const tab = (name: RegExp) => [...document.querySelectorAll('[data-part="tab-row"] button')].find((b) => name.test(b.textContent ?? '')) as HTMLButtonElement;

describe('the artifact tabs during Sprint Planning', () => {
  it('opens on the event, over the Sprint Backlog', () => {
    shell();
    expect(document.querySelector('[data-part="takeover"]')).toBeTruthy();
    expect(document.querySelector('[data-part="event-aside"]')).toBeNull();
  });

  it('shows the Product Backlog when it is pressed, and says Planning is still open', () => {
    shell();
    fireEvent.click(tab(/Product Backlog/));
    expect(document.querySelector('[data-part="takeover"]'), 'the event still covers the tab that was pressed').toBeNull();
    const aside = document.querySelector('[data-part="event-aside"]')!;
    expect(aside.textContent).toMatch(/Sprint Planning is still open\. You are looking at the Product Backlog\./);
  });

  it('goes back to the event from the bar, or from its own tab', () => {
    shell();
    fireEvent.click(tab(/Increment/));
    fireEvent.click([...document.querySelectorAll('[data-part="event-aside"] button')][0] as HTMLButtonElement);
    expect(document.querySelector('[data-part="takeover"]')).toBeTruthy();
    fireEvent.click(tab(/Product Backlog/));
    fireEvent.click(tab(/Sprint Backlog/));
    expect(document.querySelector('[data-part="takeover"]'), 'its own tab did not take you back to it').toBeTruthy();
  });
});
