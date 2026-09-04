import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PbiEditor } from './PbiEditor';
import { initialZooState } from './config';
import { checkCriterion } from './parkChecks';
import type { BacklogItem, ZooGameState } from './types';

// Whether the park can answer a criterion, said while it is being written.
//
// The split between what the park measures and what stays the Product Owner's judgement is the
// same teaching the Done gate carries, and Refinement is where it is cheap to act on: a criterion
// nobody can check is one taken on trust. Fine sometimes, and worth knowing you have written one -
// which you cannot know if you only find out at the gate, three days later.

const state: ZooGameState = initialZooState(3);

/** A lion, with one criterion the park answers and one it cannot. */
const lion = (acceptance: string[]): BacklogItem => ({
  ...state.backlog.find((it) => it.category === 'exhibit')!,
  acceptance,
} as BacklogItem);

const tags = (item: BacklogItem) => {
  const { container } = render(
    <PbiEditor zones={state.zones} state={state} item={item} useStories={false}
      onToggleStories={() => {}} onSave={() => {}} onCancel={() => {}} />,
  );
  return [...container.querySelectorAll('span')].map((s) => s.textContent?.trim())
    .filter((t) => t === 'the park checks this' || t === 'your judgement');
};

describe('writing a criterion', () => {
  it('says which ones the park will answer for itself', () => {
    const measured = 'Can I see a group rather than one animal on its own?';
    expect(checkCriterion(state, lion([measured]), measured), 'this test needs a criterion the park answers').toBeTruthy();
    expect(tags(lion([measured]))).toEqual(['the park checks this']);
  });

  it('says when it is the Product Owner’s word', () => {
    const judged = 'Does it feel like somewhere a lion would choose?';
    expect(checkCriterion(state, lion([judged]), judged), 'this test needs a criterion nothing can check').toBeNull();
    expect(tags(lion([judged]))).toEqual(['your judgement']);
  });

  it('says nothing about a line nobody has written yet', () => {
    // An empty row is not a criterion taken on trust; it is an empty row.
    expect(tags(lion(['']))).toEqual([]);
  });

  it('stays quiet when there is nothing to check against', () => {
    // Writing a brand-new item, there is no item for the park to answer about.
    const { container } = render(
      <PbiEditor zones={state.zones} useStories={false} onToggleStories={() => {}} onSave={() => {}} onCancel={() => {}} />,
    );
    const found = [...container.querySelectorAll('span')].map((s) => s.textContent?.trim())
      .filter((t) => t === 'the park checks this' || t === 'your judgement');
    expect(found, 'a new item was told what the park thinks of criteria it has never seen').toEqual([]);
  });
});
