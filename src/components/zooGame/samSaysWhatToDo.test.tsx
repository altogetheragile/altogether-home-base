import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { SamSays } from './SamSays';
import { SAM_SAYS, samScreen, readQuiet, forgetQuiet, type SamScreen } from './samLines';
import { copyEntries } from './copy';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// "Can we add prompts to each screen ... These should give guidance on what to do ... it would be
// better if they were from the Scrum Master. They should explain what a user needs to do and have a
// don't show again checkbox." (19 Nov 2026)

beforeEach(() => { forgetQuiet(); });

const at = (over: Partial<ZooGameState>): ZooGameState => ({ ...initialZooState(1), ...over } as ZooGameState);
const ui = { beforeStart: false, building: null, metTeam: false };

describe('which screen Sam is speaking about', () => {
  it('names every screen a solo game meets, in order', () => {
    const seen: (SamScreen | null)[] = [
      samScreen(at({ phase: 'intro' }), { ...ui, beforeStart: true }),
      samScreen(at({ phase: 'intro' }), ui),
      samScreen(at({ phase: 'brief' }), ui),
      samScreen(at({ phase: 'refine' }), ui),
      samScreen(at({ phase: 'planning', planningTopic: 'why' }), ui),
      samScreen(at({ phase: 'planning', planningTopic: 'what' }), ui),
      samScreen(at({ phase: 'planning', planningTopic: 'how' }), ui),
      samScreen(at({ phase: 'sprint', dayStage: 'building' }), ui),
      samScreen(at({ phase: 'sprint', dayStage: 'building' }), { ...ui, building: 'x' }),
      samScreen(at({ phase: 'sprint', dayStage: 'dailyScrum' }), ui),
      samScreen(at({ phase: 'review' }), ui),
      samScreen(at({ phase: 'retro' }), ui),
    ];
    expect(seen).toEqual(Object.keys(SAM_SAYS));
  });

  it('says nothing over Priya writing the Backlog, which is not a screen anybody acts on', () => {
    expect(samScreen(at({ phase: 'brief' }), { ...ui, metTeam: true })).toBeNull();
  });
});

describe('what Sam says', () => {
  it('is in the house style: no em dashes', () => {
    for (const [k, line] of Object.entries(SAM_SAYS)) expect(line.text, k).not.toMatch(/—/);
  });

  it('can be reworded in the copy editor, like the rest of the teaching', () => {
    const keys = copyEntries().filter((e) => e.group === "Sam's prompts").map((e) => e.key);
    expect(keys).toEqual(Object.keys(SAM_SAYS).map((k) => `sam.${k}`));
  });
});

describe('the prompt', () => {
  it('opens on arriving, as a dialog from the Scrum Master', () => {
    render(<SamSays screen="refine" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain('Sam (Scrum Master)');
    expect(dialog.textContent).toContain(SAM_SAYS.refine.text);
  });

  it('goes on "Got it", and does not come back this visit', () => {
    // Once a visit, not once an arrival: the board is reached every day and the Daily Scrum every
    // morning, and saying the same thing each time is nagging.
    const { rerender } = render(<SamSays screen="daily-scrum" />);
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(<SamSays screen="sprint" />);
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    rerender(<SamSays screen="daily-scrum" />);
    expect(screen.queryByRole('dialog'), 'the next Daily Scrum said it all again').toBeNull();
  });

  it('comes back on the next visit, unless told not to', () => {
    const first = render(<SamSays screen="review" />);
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    first.unmount();
    render(<SamSays screen="review" />);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('stays away from a screen once told, and remembers it for the next game', () => {
    const { unmount } = render(<SamSays screen="retro" />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Don.t show this again/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    expect(readQuiet()).toEqual(['retro']);
    unmount();
    render(<SamSays screen="retro" />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('only for that screen', () => {
    const { rerender } = render(<SamSays screen="retro" />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Don.t show this again/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    rerender(<SamSays screen="review" />);
    expect(screen.getByRole('dialog').textContent).toContain(SAM_SAYS.review.text);
  });

  it('holds the clock while it is being read', () => {
    const reading: boolean[] = [];
    render(<SamSays screen="sprint" onReading={(r) => reading.push(r)} />);
    expect(reading).toEqual([true]);
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    expect(reading).toEqual([true, false]);
  });
});
