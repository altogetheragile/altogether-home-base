import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const saved: { key: string; value: string }[] = [];
vi.mock('@/hooks/useUserRole', () => ({ useUserRole: () => ({ data: 'admin', isLoading: false }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));
vi.mock('./useZooCopy', () => ({
  saveCopy: async (key: string, value: string) => { saved.push({ key, value }); return null; },
}));

import { DeckEditor } from './DeckEditor';
import { DECK_KEY, SHIPPED_TRAINER_CARDS, applyDeck, parseDeck, playableCards, trainerDeck, asPlayed } from './trainerCards';
import { reducer } from './useZooGame';
import { initialZooState } from './config';
import { endDay } from './engine';
import type { ZooGameState } from './types';

// Al, 28 Oct 2026: "Can the cards be editable and extendable by admin?" The deck is one row in
// zoo_copy, laid over the shipped three; a card is a situation, never a new rule.

beforeEach(() => { saved.length = 0; applyDeck({}); });

describe('a saved deck', () => {
  it('replaces the shipped one, and can take a card out without deleting it', () => {
    const own = [...SHIPPED_TRAINER_CARDS.map((c) => (c.id === 'sick' ? { ...c, off: true } : c)),
      { id: 'own-escape', kind: 'impediment', title: 'The keys are lost', detail: 'Nobody can get into the stores.', landsOn: 'Scrum Master', lesson: 'Who removes it?' }];
    applyDeck({ [DECK_KEY]: JSON.stringify(own) });
    expect(trainerDeck().map((c) => c.id)).toEqual([...SHIPPED_TRAINER_CARDS.map((c) => c.id), 'own-escape']);
    expect(playableCards().map((c) => c.id), 'a card taken out is still offered').not.toContain('sick');
  });

  it('drops a malformed card rather than the whole deck', () => {
    const deck = parseDeck(JSON.stringify([{ id: 'a', kind: 'block', title: 'Fine', detail: 'x' }, { id: 'b', kind: 'rule', title: 'A new mechanic' }, { title: 'no id' }]));
    expect(deck?.map((c) => c.id)).toEqual(['a']);
  });

  it('falls back to the shipped deck when what is saved is not one', () => {
    applyDeck({ [DECK_KEY]: 'not json' });
    expect(trainerDeck().length).toBe(SHIPPED_TRAINER_CARDS.length);
  });

  it('cannot rewrite a card already played', () => {
    const base = initialZooState(7);
    const s = { ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1, sprintDays: 5 } as ZooGameState;
    const played = reducer(s, { type: 'PLAY_TRAINER_CARD', card: asPlayed(SHIPPED_TRAINER_CARDS[1]) });
    applyDeck({ [DECK_KEY]: JSON.stringify([{ ...SHIPPED_TRAINER_CARDS[1], title: 'Reworded later' }]) });
    expect(endDay(played).pendingImpediment?.title).toBe('A Developer is off sick');
  });
});

describe('the editor', () => {
  it('adds a card and saves the whole deck as one row', async () => {
    render(<DeckEditor overrides={{}} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByTitle(/reword them, take them out, or add your own/));
    fireEvent.click(screen.getByRole('button', { name: /Add a card/ }));
    const titles = screen.getAllByLabelText('Title');
    fireEvent.change(titles[titles.length - 1], { target: { value: 'The lion has escaped' } });
    const details = screen.getAllByLabelText('What has happened');
    fireEvent.change(details[details.length - 1], { target: { value: 'It is loose in the car park.' } });
    fireEvent.click(screen.getByRole('button', { name: /Save the deck/ }));
    await waitFor(() => expect(saved.length).toBe(1));
    expect(saved[0].key).toBe(DECK_KEY);
    const deck = parseDeck(saved[0].value)!;
    expect(deck.length).toBe(SHIPPED_TRAINER_CARDS.length + 1);
    expect(deck[deck.length - 1]).toMatchObject({ title: 'The lion has escaped', kind: 'block' });
    expect(playableCards().some((c) => c.title === 'The lion has escaped'), 'the saved deck is not the one offered').toBe(true);
  });

  it('will not save a card with no story', () => {
    render(<DeckEditor overrides={{}} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByTitle(/reword them, take them out, or add your own/));
    fireEvent.click(screen.getByRole('button', { name: /Add a card/ }));
    expect(screen.getByRole('button', { name: /Save the deck/ })).toBeDisabled();
  });

  it('only lets an admin delete a card they added', () => {
    render(<DeckEditor overrides={{}} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByTitle(/reword them, take them out, or add your own/));
    expect(screen.queryAllByRole('button', { name: /^Remove/ }).length, 'a shipped card can be deleted').toBe(0);
  });
});
