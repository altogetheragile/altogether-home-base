import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooShell } from './ZooShell';
import { ActionBar } from './ActionBar';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// One floating thing, in one corner.
//
// Reported from playing it: "I'm looking for the button press next", and "the messages popping up
// underneath are not readable". Both were the same fault - the primary action moved from screen to
// screen (centred here, docked to the foot of a pane there) and the game's notes floated separately
// in the corner it had just left, half off the bottom of the window.
//
// So: bottom right, always, and whatever the game has to say rides in the same pill.

const at = (phase: ZooGameState['phase'], over: Partial<ZooGameState> = {}): ZooGameState =>
  ({ ...initialZooState(3), phase, ...over }) as ZooGameState;

const shell = (props: Partial<Parameters<typeof ZooShell>[0]> = {}, child: React.ReactNode = <div>the screen</div>) =>
  render(<MemoryRouter><ZooShell state={at('sprint')} {...props}>{child}</ZooShell></MemoryRouter>);

/** The dock, wherever it was portalled to. */
const dock = () => document.querySelector('.fixed.bottom-4.right-4');

describe('the action dock', () => {
  it('stands in the bottom right corner, on every screen', () => {
    shell({}, <ActionBar><button type="button">End Day 1</button></ActionBar>);
    const at = dock();
    expect(at, 'no dock on screen at all').toBeTruthy();
    // Not centred, and not the foot of a pane: the same corner whichever screen you are on.
    expect(at!.className).toContain('bottom-4');
    expect(at!.className).toContain('right-4');
    expect(at!.className, 'the dock is centred over the window again').not.toContain('justify-center');
    expect(at!.textContent).toContain('End Day 1');
  });

  it('says what the game is saying in the same pill as the button', () => {
    shell({ refused: 'How the work gets done is the Developers’ to plan.', onDismissRefused: () => {} },
      <ActionBar><button type="button">End Day 1</button></ActionBar>);
    const pill = dock()!.firstElementChild!;
    // One pill: the note and the action are in it together, so there is nothing else floating.
    expect(pill.textContent, 'the note is not in the action pill').toContain('Whose call it is');
    expect(pill.textContent).toContain('End Day 1');
    expect(document.querySelectorAll('.fixed.bottom-4.right-4').length, 'two floating docks').toBe(1);
  });

  it('opens the whole of a note, and closes it again', () => {
    shell({ poNote: 'A long account of what the Scrum Team refined, in several paragraphs.' },
      <ActionBar><button type="button">End Day 1</button></ActionBar>);
    // In the pill it is one line; the rest is a click away rather than a card over the park.
    fireEvent.click(screen.getByText(/Refinement session/i));
    expect(document.body.textContent).toContain('A long account of what the Scrum Team refined');
  });

  it('keeps its corner on a screen with no action of its own', () => {
    // A note must not move to a different place depending on which screen it lands on.
    shell({ refused: 'That is the Product Owner’s call.', onDismissRefused: () => {} });
    const at = dock();
    expect(at, 'the note went somewhere else entirely').toBeTruthy();
    expect(at!.textContent).toContain('Whose call it is');
  });

  it('says nothing at all when there is nothing to say', () => {
    shell({}, <ActionBar><button type="button">End Day 1</button></ActionBar>);
    expect(dock()!.textContent).not.toMatch(/Whose call it is|dismiss/);
  });
});
