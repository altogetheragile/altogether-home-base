import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { glossary, markTerms } from './glossary';
import { SCRUM_CARDS, GLOSSARY_WORDS } from './scrumContent';
import { SamSays } from './SamSays';
import { GlossaryBody } from './GlossaryTerm';
import { forgetQuiet } from './samLines';

// A glossary, and the words in Sam's prompts pressable for their definitions. Asked for on 19 Nov
// 2026: "Can we add a glossary of terms. For terms, such as product goal, on guidance dialogs a pop
// definition could be clicked to orientate the user."

beforeEach(() => { forgetQuiet(); });

describe('the glossary', () => {
  it('has every Teaching Card in it, with the card\'s own summary as its definition', () => {
    const g = glossary();
    for (const c of SCRUM_CARDS) expect(g.find((e) => e.id === c.id)?.definition, c.id).toBe(c.summary);
  });

  it('is A to Z', () => {
    const terms = glossary().map((e) => e.term);
    expect(terms).toEqual([...terms].sort((a, b) => a.localeCompare(b)));
  });

  it('is in the house style: no em dashes', () => {
    for (const w of GLOSSARY_WORDS) expect(`${w.definition} ${w.notScrum ?? ''}`, w.id).not.toMatch(/—/);
  });

  it('says which words are not the Scrum Guide\'s', () => {
    const g = glossary();
    for (const id of ['velocity', 'definition-of-ready', 'swarming', 'acceptance-criteria', 'story-points', 'epic']) {
      expect(g.find((e) => e.id === id)?.notScrum, id).toBeTruthy();
    }
    for (const id of ['product-goal', 'sprint-goal', 'scrum-team', 'increment']) {
      expect(g.find((e) => e.id === id)?.notScrum, id).toBeFalsy();
    }
  });
});

describe('marking the terms in running text', () => {
  const marked = (t: string) => markTerms(t).filter((p) => typeof p !== 'string').map((p) => (p as { id: string }).id);

  it('marks a term once, at its first mention', () => {
    expect(marked('The Product Goal comes first. Then the Product Goal again.')).toEqual(['product-goal']);
  });

  it('takes the longest term, so "Sprint Goal" is not "Sprint"', () => {
    expect(marked('Agree the Sprint Goal.')).toEqual(['sprint-goal']);
  });

  it('keeps the words as they were', () => {
    const t = 'Priya, our Product Owner, orders the Product Backlog.';
    expect(markTerms(t).map((p) => (typeof p === 'string' ? p : p.text)).join('')).toBe(t);
  });

  it('matches short forms only as written', () => {
    expect(marked('the PO says')).toEqual(['product-owner']);
    expect(marked('a podium and a dodo')).toEqual([]);
  });
});

describe('on screen', () => {
  it('a word in Sam\'s prompt opens its definition, inside the prompt', () => {
    render(<SamSays screen="product-goal" />);
    const prompt = screen.getAllByRole('dialog')[0];
    fireEvent.click(screen.getByRole('button', { name: 'Product Goal: what it means' }));
    const card = document.querySelector('[data-part="glossary-card"]')!;
    expect(card.textContent).toContain(SCRUM_CARDS.find((c) => c.id === 'product-goal')!.summary);
    expect(prompt.contains(card), 'the definition opened outside the prompt, where a screen reader cannot follow').toBe(true);
    expect(screen.getByRole('button', { name: 'Got it' })).toBeTruthy();
  });

  it('the glossary lists every term with its definition', () => {
    const { container } = render(<GlossaryBody />);
    expect(container.querySelectorAll('dt')).toHaveLength(glossary().length);
    expect(screen.getByText('Scrum Team')).toBeTruthy();
  });
});

describe('editing the glossary', () => {
  it('its own words are in the copy editor, and an edit reaches the glossary', async () => {
    const { copyEntries } = await import('./copy');
    const entry = copyEntries().find((e) => e.key === 'glossary.scrum-team')!;
    expect(entry.group).toBe('Glossary');
    const was = entry.value;
    entry.apply('Reworded by a trainer.');
    expect(glossary().find((e) => e.id === 'scrum-team')?.definition).toBe('Reworded by a trainer.');
    entry.apply(was);
  });
});
