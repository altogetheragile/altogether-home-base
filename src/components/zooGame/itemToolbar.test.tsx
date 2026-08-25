import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import type { BacklogItem } from './types';
import { ItemToolbar } from './ItemToolbar';

const lion = (): BacklogItem => ({
  id: 'lion', name: 'Lion', zone: 'Big Cats', category: 'exhibit', template: 'lion',
  status: 'committed', started: true, enclosureId: 'enc', enclosureSize: 'large',
  points: 3, acceptance: [], acConfirmed: [], tasks: [],
} as unknown as BacklogItem);

describe('choosing who is in a group', () => {
  it('offers males and females, not just adults', () => {
    // A pride is one male and several females, and that is why it is a pride. The model only knew
    // "adults", so the choice could not be made at all.
    const { container } = render(
      <ItemToolbar docked item={lion()} design={{ parts: {}, colors: {} }}
        onDesign={() => {}} onToggleTask={() => {}} onConfirmAc={() => {}} onClose={() => {}} />,
    );
    const text = (container.textContent ?? '').toLowerCase();
    for (const kind of ['males', 'females', 'juveniles', 'cubs']) {
      expect(text, `the studio does not offer ${kind}`).toContain(kind);
    }
    expect(text).not.toContain('adults');
  });

  it('makes a pair a male and a female', () => {
    // "A pair" of anything in a zoo is a breeding pair. Two adults said nothing.
    const chosen: unknown[] = [];
    const { container } = render(
      <ItemToolbar docked item={lion()} design={{ parts: {}, colors: {} }}
        onDesign={(d) => chosen.push(d.group)} onToggleTask={() => {}} onConfirmAc={() => {}} onClose={() => {}} />,
    );
    const pair = [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'A pair')!;
    expect(pair, 'there is no way to choose a pair').toBeTruthy();
    pair.click();
    expect(chosen[0]).toEqual({ males: 1, females: 1, juveniles: 0, cubs: 0 });
  });
});
