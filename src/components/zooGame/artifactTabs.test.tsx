import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooShell } from './ZooShell';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// The navigation IS the three artifacts.
//
// A learner who can name the tabs can name the artifacts, which is most of what this game is for.
// So: Product Backlog, Sprint Backlog, Increment - and no tab called Build or Sprint, because
// building is the Sprint Backlog in use and Sprint Planning is the first thing IN a Sprint.
//
// Events are not tabs. They are moments, and each one fills the screen over the artifact it is
// about: Planning and the Retrospective over the Sprint Backlog, the Review over the Increment.

const shell = (state: ZooGameState, child = <div>the screen</div>) =>
  render(<MemoryRouter><ZooShell state={state}>{child}</ZooShell></MemoryRouter>);

/** The tabs, by the name each one carries. The label sits after an icon, so it is read trimmed. */
const tabs = (c: HTMLElement) => [...c.querySelectorAll('button')]
  .map((b) => ({ label: (b.textContent ?? '').replace(/\s+/g, ' ').trim(), locked: b.disabled }))
  .filter((t) => /^(Product Backlog|Sprint Backlog|Increment)/.test(t.label));

const at = (phase: ZooGameState['phase'], over: Partial<ZooGameState> = {}): ZooGameState =>
  ({ ...initialZooState(3), phase, ...over }) as ZooGameState;

describe('the three artifact tabs', () => {
  it('names the three artifacts, and nothing else', () => {
    const { container } = shell(at('sprint'));
    expect(tabs(container).map((t) => t.label.split(' ').slice(0, 2).join(' ')))
      .toEqual(['Product Backlog', 'Sprint Backlog', 'Increment']);
    const all = [...container.querySelectorAll('button')].map((b) => b.textContent ?? '');
    expect(all.some((t) => /^Build$|^Sprint$|^Park/.test(t.trim())), 'a tab named for something that is not an artifact').toBe(false);
  });

  it('locks the Sprint Backlog until there is one, and says why on the tab', () => {
    // An empty artifact and an artifact that does not exist yet are different things.
    const before = tabs(shell(at('refine')).container).find((t) => t.label.startsWith('Sprint Backlog'))!;
    expect(before.locked, 'the Sprint Backlog was offered before Planning made one').toBe(true);
    expect(before.label, 'the tab is dead with no reason given').toMatch(/made at Planning/i);

    const during = tabs(shell(at('sprint')).container).find((t) => t.label.startsWith('Sprint Backlog'))!;
    expect(during.locked, 'the Sprint Backlog stayed locked during the Sprint').toBe(false);
  });

  it('shows the screen behind the tab it belongs to', () => {
    // Refinement is the Product Backlog; a Sprint is the Sprint Backlog. The screen is not floating
    // free of the artifact it acts on.
    const refine = shell(at('refine'), <div>REFINEMENT SCREEN</div>);
    expect(refine.container.textContent).toContain('REFINEMENT SCREEN');
    const sprint = shell(at('sprint'), <div>THE BOARD</div>);
    expect(sprint.container.textContent).toContain('THE BOARD');
  });

  it('reads the artifact you are not working on, without leaving what you were doing', () => {
    // The Product Backlog can be read at any time. Read-only: ordering and refining cost time and
    // belong to a screen that can say so.
    const { container } = shell(at('sprint'));
    expect(container.textContent, 'the Product Backlog cannot be read from a Sprint').toMatch(/Product Backlog/);
    expect(container.textContent).toMatch(/costs the Developers build time/i);
  });

  it('runs an event over its artifact, not as a tab of its own', () => {
    for (const [phase, artifact] of [['planning', 'Sprint Backlog'], ['retro', 'Sprint Backlog'], ['review', 'Increment']] as const) {
      const { container } = shell(at(phase), <div>THE EVENT</div>);
      expect(container.textContent, `${phase} did not run`).toContain('THE EVENT');
      expect(tabs(container).map((t) => t.label.split(' ').slice(0, 2).join(' ')),
        `${phase} became a tab`).toEqual(['Product Backlog', 'Sprint Backlog', 'Increment']);
      // ...and the artifact it is about is the one showing behind it.
      const active = [...container.querySelectorAll('button')]
        .find((b) => (b.className ?? '').includes('border-primary'));
      expect((active?.textContent ?? '').trim(), `${phase} took over the wrong artifact`).toContain(artifact);
    }
  });
});
