import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintReview } from './SprintReview';
import { acceptSignal, needStillWaiting } from './engine';
import { aiTurn } from './aiSeats';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// sm16: "There appear to be two 'Somewhere to eat Need · General' entries ... duplicates or distinct
// items?" Visitors said it at one Review, Priya took it; it was not built, they said it again at the
// next, and taking it again added a second copy of the same need.

const FOOD = 'unmet:food';
const signal = { suggestion: 'Somewhere to eat, without leaving the park', drivenBy: FOOD, estimatedValue: 'medium' as const };
const atReview = (): ZooGameState => ({
  ...initialZooState(3), phase: 'review', sprintNumber: 2,
  signals: [signal], signalAge: { [FOOD]: 1 },
} as unknown as ZooGameState);
/** Taken at one Review, then raised again at the next. */
const raisedAgain = (): ZooGameState => {
  const first = acceptSignal(noStarterNeed(atReview()), 0, 'product_owner');
  return { ...first, sprintNumber: 3, signals: [signal], signalAge: { [FOOD]: 2 } };
};
/** Whatever stands for it: the need, or what the Developers turned it into (taking it refines it
 *  off screen into a Kiosk), keeping the id it arrived with. */
const eats = (s: ZooGameState) => s.backlog.filter((it) => it.id === 'somewhere-to-eat' || it.id.startsWith('sig-unmetfood'));

/** A zoo whose starter Product Backlog has no "Somewhere to eat" in it. */
const noStarterNeed = (s: ZooGameState): ZooGameState => ({ ...s, backlog: s.backlog.filter((it) => it.id !== 'somewhere-to-eat') });

describe('a need said twice is one need', () => {
  it('the first time, it is added', () => {
    expect(eats(acceptSignal(noStarterNeed(atReview()), 0)).length).toBe(1);
  });

  it('said again while it waits, it is kept rather than added twice', () => {
    const s = raisedAgain();
    const before = eats(s).length;
    const after = acceptSignal(s, 0, 'product_owner');
    expect(eats(after).length, 'a second copy of the same need').toBe(before);
    expect(after.signals.length, 'the call was not made').toBe(0);
    expect(after.signalLog?.slice(-1)[0]?.itemId, 'the call does not point at the need it kept').toBe(eats(s).slice(-1)[0]!.id);
  });

  it('once what met it is opened, a fresh complaint is a fresh need', () => {
    const s = raisedAgain();
    const id = s.signalLog!.slice(-1)[0]!.itemId!;
    const opened = { ...s, backlog: s.backlog.map((it) => (it.id === id ? { ...it, status: 'open' as const } : it)) };
    expect(needStillWaiting(opened, FOOD)).toBeNull();
  });

  it('Priya says she is keeping it, not adding it', () => {
    const move = aiTurn(raisedAgain(), 'product_owner');
    expect(move?.says).toMatch(/already on the Product Backlog/);
  });

  it('the Review button says keep, not add', () => {
    render(<MemoryRouter><SprintReview state={raisedAgain()} onTakeSignal={() => {}} onDeclineSignal={() => {}}
      onContinue={() => {}} onWrapUp={() => {}} onOpen={() => {}} onConfirmAc={() => {}}
      onToggleTask={() => {}} onSendBack={() => {}} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Next: the visitors/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next: what we do about it/i }));
    expect(screen.getByRole('button', { name: 'Keep it on the Product Backlog' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add to the Product Backlog' })).toBeNull();
  });
});
