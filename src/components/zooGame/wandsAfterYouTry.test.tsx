import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PbiEditor } from './PbiEditor';
import { initialZooState } from './config';
import { fillTheGaps, suggestTasks } from './engine';
import type { BacklogItem, SprintTask } from './types';

// A wand helps after the learner has tried, not instead of them.
//
// From the design note, and the last of the five pieces in the flow rewrite. A button that breaks
// the work down for somebody who has written nothing does the one piece of thinking topic three of
// Sprint Planning exists for - and does it faster than they can read it, so what they learn is that
// the button knows how to break work down.
//
// Given something to work with, a wand does the opposite job: it fills the gaps in THEIR plan and
// leaves their wording alone. That is what a Developer who has done this before does for one who
// has not, and it is the shape the Sprint Goal wand already had (#599).

const item = (tasks: string[] = []): BacklogItem => ({
  id: 'enc', name: 'Lion Enclosure', category: 'enclosure', zone: 'Big Cats', status: 'committed',
  started: true, sprintNumber: 1, estimate: 5, acceptance: [], acConfirmed: [],
  tasks: tasks.map((label, i) => ({ id: `t${i}`, label, done: false })) as SprintTask[],
} as unknown as BacklogItem);

describe('the steps wand', () => {
  it('does nothing for somebody who has written nothing', () => {
    expect(fillTheGaps(item()), 'it wrote the whole plan for a blank card').toEqual([]);
  });

  it('keeps every word the learner wrote', () => {
    const mine = item(['Dig the moat out by hand']);
    const filled = fillTheGaps(mine);
    expect(filled[0].label, 'their first step was rewritten').toBe('Dig the moat out by hand');
    expect(filled.length, 'it added nothing at all').toBeGreaterThan(1);
  });

  it('does not say the same step twice in different words', () => {
    // "Fence it" and "Fence it securely" are one step said twice, and a plan with both in it is a
    // plan nobody trusts.
    const suggested = suggestTasks(item());
    const theirs = suggested[1]?.label.split(' ').slice(0, 2).join(' ') ?? 'Fence it';
    const filled = fillTheGaps(item([theirs]));
    const words = (s: string) => s.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const mineWords = words(theirs);
    const echoes = filled.slice(1).filter((t) => words(t.label).some((w) => mineWords.includes(w)));
    expect(echoes, `"${theirs}" was suggested back in other words`).toEqual([]);
  });

  it('leaves a plan that is already complete alone', () => {
    const whole = suggestTasks(item()).map((t) => t.label);
    expect(fillTheGaps(item(whole)).length, 'it padded a finished plan').toBe(whole.length);
  });
});

describe('the user story wand', () => {
  const editor = () => render(
    <PbiEditor zones={['Big Cats']} state={initialZooState(1)} enclosures={[]}
      onSave={() => {}} onCancel={() => {}} useStories onToggleStories={() => {}} />,
  );

  it('is not offered to an empty story', () => {
    const { container } = editor();
    const wand = [...container.querySelectorAll('button')].find((b) => /Fill in the rest/i.test(b.textContent ?? ''));
    expect(wand, 'the story wand is gone entirely').toBeTruthy();
    expect((wand as HTMLButtonElement).disabled, 'it offered to write the whole story').toBe(true);
    expect(wand!.getAttribute('title'), 'it does not say what to do first').toMatch(/write a line of it first/i);
  });

  it('fills only the blanks once a line is written', () => {
    const { container } = editor();
    // The three parts of a story: as a ROLE, I want WANT, so that SO THAT. Found by the example in
    // each box rather than by position, so a reordered form does not silently test the wrong field.
    const role = container.querySelector('input[placeholder="a visiting family"]') as HTMLInputElement;
    expect(role, 'the story has no "as a..." box').toBeTruthy();
    fireEvent.change(role, { target: { value: 'a keeper' } });
    const wand = [...container.querySelectorAll('button')].find((b) => /Fill in the rest/i.test(b.textContent ?? ''))!;
    expect((wand as HTMLButtonElement).disabled, 'a learner who had a go was still refused').toBe(false);
    fireEvent.click(wand);
    expect(role.value, 'it overwrote the part they had written').toBe('a keeper');
  });
});

describe('what the button says it will do', () => {
  it('offers to fill gaps, never to do the thinking', () => {
    const { container } = render(
      <PbiEditor zones={['Big Cats']} state={initialZooState(1)} enclosures={[]}
        onSave={() => {}} onCancel={() => {}} useStories onToggleStories={() => {}} />,
    );
    expect(container.textContent, 'a wand still offers to write the thing itself')
      .not.toMatch(/Auto-suggest|Suggest tasks|Suggest steps for all/);
  });
});
