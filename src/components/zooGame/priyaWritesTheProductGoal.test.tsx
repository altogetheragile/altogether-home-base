import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooIntro } from './ZooIntro';
import { SeatBand } from './SeatBand';
import { initialZooState, priyaGoal, PRODUCT_GOAL } from './config';
import { aiTurn } from './aiSeats';
import { reducer } from './useZooGame';
import type { ZooGameState } from './types';

// "PO should define product goals anyway, according to the scrum guide" (Al, 20 November 2026).
// The 2020 Guide: the Product Owner is accountable for "Developing and explicitly communicating the
// Product Goal". Playing alone, the game plays Priya, so the Goal is hers - and her starter Product
// Backlog is written to it, rather than being the same list whatever the Goal said.

describe('Priya\'s Product Goal', () => {
  it('is the shipped Goal with no focus, and names the area and its animals with one', () => {
    expect(priyaGoal(null)).toBe(PRODUCT_GOAL);
    expect(priyaGoal('Waterside')).toMatch(/starting with the Waterside area: penguins and reef\.$/);
    expect(priyaGoal('Big Cats')).toMatch(/lion, tiger and leopard/);
    expect(priyaGoal('Atlantis'), 'an area the zoo does not have').toBe(PRODUCT_GOAL);
  });
});

describe('the goal screen, playing alone', () => {
  const intro = (onSetGoal = vi.fn(), onStart = vi.fn()) => {
    render(<MemoryRouter><ZooIntro productGoal={PRODUCT_GOAL} productOwner="Priya" onSetGoal={onSetGoal} onStart={onStart} /></MemoryRouter>);
    return { onSetGoal, onStart };
  };

  it('is Priya\'s to write, not yours, and says so', () => {
    intro();
    expect(screen.queryByRole('textbox', { name: 'Product Goal' }), 'the player is asked to write it').toBeNull();
    expect(document.body.textContent).not.toMatch(/You are the Product Owner/);
    expect(document.querySelector('[data-part="priyas-goal"]')?.textContent).toMatch(/Priya, your Product Owner, has written the Product Goal/);
    expect(document.querySelector('[data-part="po-goal"]')?.textContent).toContain(PRODUCT_GOAL);
  });

  it('takes a suggestion of where it starts, rewrites the Goal, and starts the game with both', () => {
    const { onSetGoal, onStart } = intro();
    fireEvent.click(screen.getByRole('button', { name: 'Waterside' }));
    expect(screen.getByRole('button', { name: 'Waterside' }).getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('[data-part="po-goal"]')?.textContent).toContain(priyaGoal('Waterside'));
    fireEvent.click(screen.getByRole('button', { name: /Start/ }));
    expect(onSetGoal).toHaveBeenCalledWith(priyaGoal('Waterside'), 'Waterside');
    expect(onStart).toHaveBeenCalled();
  });
});

describe('her starter Product Backlog', () => {
  const atBrief = (focus?: string): ZooGameState => {
    let s = initialZooState(3) as ZooGameState;
    s = reducer(s, { type: 'SET_PRODUCT_GOAL', goal: priyaGoal(focus), focus: focus ?? null });
    return { ...s, phase: 'brief' } as ZooGameState;
  };

  it('puts the area her Goal starts with on top', () => {
    const s = atBrief('Waterside');
    const move = aiTurn(s, 'product_owner')!;
    expect(move.action).toMatchObject({ type: 'WRITE_BACKLOG', brief: { firstZone: 'Waterside' } });
    const written = reducer(s, move.action);
    expect(written.backlog[0].zone, 'Big Cats is still on top of a Goal about the water').toBe('Waterside');
  });

  it('still knows where the Goal starts after the game starts from it', () => {
    // Start resets the game from what was written; the focus was dropped there, so the browser
    // showed a Waterside Goal over a Big Cats Product Backlog.
    let s = atBrief('Waterside');
    s = reducer(s, { type: 'START_FROM_THE_BRIEF' });
    expect(s.goalFocus).toBe('Waterside');
    expect(aiTurn(s, 'product_owner')!.action).toMatchObject({ brief: { firstZone: 'Waterside' } });
  });

  it('opens Big Cats first when nobody suggested anywhere', () => {
    const move = aiTurn(atBrief(), 'product_owner')!;
    expect(move.action).toMatchObject({ type: 'WRITE_BACKLOG', brief: { firstZone: 'Big Cats' } });
  });
});

describe('the band, before there is a Sprint Goal', () => {
  it('carries the Product Goal while the Product Backlog is refined', () => {
    const s = { ...initialZooState(3), phase: 'refine', productGoal: priyaGoal('Waterside') } as ZooGameState;
    const band = render(<SeatBand state={s} />).container;
    expect(band.querySelector('[data-part="product-goal-text"]')?.textContent).toBe(priyaGoal('Waterside'));
  });
});
