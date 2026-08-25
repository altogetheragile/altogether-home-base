import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { initialZooState } from './config';
import { reviewSprint } from './engine';
import type { BacklogItem, ZooGameState } from './types';
import { DesignBench } from './DesignBench';
import type { EditApi } from './ParkView';

const noop = () => { /* the bench is only being read here, not used */ };
const edit = new Proxy({}, { get: () => noop }) as unknown as EditApi;

describe('the design bench', () => {
  it('lets go of an item that ran out of Sprint', () => {
    // The stuck state: a Sprint ended with the signposts half built. Unfinished work goes back to
    // the Product Backlog to be sized against what is left - that is the rule, and the board was
    // right. The bench was not: it went on showing the item, open and apparently in progress, while
    // the item was on no column of the board. There was no way to finish it and no way to put it
    // down. So the bench now says where it went.
    let s = initialZooState(1);
    s = {
      ...s,
      phase: 'sprint',
      backlog: s.backlog.map((it) => (it.id === 'signposts'
        ? { ...it, status: 'committed', sprintNumber: s.sprintNumber, started: true } as BacklogItem
        : it)),
    } as ZooGameState;
    const after = reviewSprint(s);

    const signs = after.backlog.find((it) => it.id === 'signposts')!;
    expect(signs.status, 'unfinished work belongs to the Product Backlog').toBe('backlog');
    expect(signs.sprintNumber).toBeNull();

    const { container } = render(<DesignBench state={after} itemId="signposts" edit={edit} onToggleTask={noop} onConfirmAc={noop} />);
    const text = container.textContent ?? '';
    expect(text).toMatch(/Nothing on the bench/);
    expect(text).toMatch(/did not finish in the Sprint/);
    // and it does not still offer the controls for building it
    expect(text).not.toMatch(/ACCEPTANCE CRITERIA/i);
  });
});
