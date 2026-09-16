import { describe, it, expect } from 'vitest';
import { CRITERIA, criterionFor, answerable, asAsked } from './parkChecks';
import { enclosureAcceptance, exhibitAcceptance, amenityAcceptance, pathAcceptance,
  floraAcceptance, FLORA_PIECES } from './design';
import { initialZooState } from './config';
import { writeBacklog, acceptSignal } from './engine';
import type { ZooGameState } from './types';

// No criterion without an answer, and no answer without a criterion.
//
// This game has shipped a criterion nothing could recognise three times. "Can I find it from the
// entrance?" was a facility asking the habitat's question in different words. "Placed where
// visitors can reach it" was the same again. The Gift Shop's three were all judgements, so the only
// route to Done was the Product Owner waiving every one of them - which teaches that Done is
// whatever they say it is, and that is the opposite of the lesson.
//
// Every time, the cause was the same: the sentence was data and the answer was code, and nothing
// held them together. They are one list now, and this is the test that keeps it one list.

/** Every criterion the game can write down, from the places that write them. */
function everythingTheGameWrites(): { where: string; asks: string }[] {
  const out: { where: string; asks: string }[] = [];
  const add = (where: string, acs: string[]) => acs.forEach((a) => out.push({ where, asks: a }));

  add('enclosureAcceptance', enclosureAcceptance());
  ['Lion', 'Penguins', 'Meerkat'].forEach((n) => add(`exhibitAcceptance(${n})`, exhibitAcceptance(n)));
  (['food', 'toilet', 'rest', undefined] as const).forEach((s) =>
    ['Gift Shop', 'Toilets', 'Kiosk', 'Seating Area', 'Something Else'].forEach((n) =>
      add(`amenityAcceptance(${n}, ${s})`, amenityAcceptance(n, s))));
  add('pathAcceptance', pathAcceptance());
  FLORA_PIECES.forEach((p) => add(`floraAcceptance(${p.key})`, floraAcceptance(p.key)));

  // ...and the ones the game writes while it is being played: the starter Backlog, and the items
  // the visitors ask for at a Review.
  const seeded = writeBacklog(initialZooState(1) as ZooGameState,
    { zones: ['Big Cats', 'Waterside', 'Savanna'], audience: 'families', firstZone: 'Big Cats' });
  seeded.backlog.forEach((it) => add(`seed:${it.name}`, it.acceptance ?? []));
  for (const drivenBy of ['unmet:food', 'unmet:toilet', 'unmet:rest', 'crowding']) {
    const after = acceptSignal({ ...seeded, sprintNumber: 1,
      signals: [{ suggestion: 'x', drivenBy, estimatedValue: 'high' }] } as ZooGameState, 0);
    const made = after.backlog.find((it) => !seeded.backlog.some((b) => b.id === it.id));
    if (made) add(`signal:${drivenBy}`, made.acceptance ?? []);
  }
  return out;
}

describe('every criterion the game writes', () => {
  it('is one the registry knows about', () => {
    const orphans = everythingTheGameWrites()
      .filter(({ asks }) => !criterionFor(asks))
      .map(({ where, asks }) => `${where}: "${asks}"`);
    expect([...new Set(orphans)],
      'these can be written onto an item and nothing recognises them, so the only route to Done is a waiver')
      .toEqual([]);
  });

  it('either has an answer or is deliberately somebody’s judgement', () => {
    // Both are fine. What is not fine is a third state where nobody decided which it was.
    for (const { asks } of everythingTheGameWrites()) {
      const def = criterionFor(asks)!;
      expect(typeof def.answer === 'function' || def.answer === undefined).toBe(true);
      expect(def.short, `${def.id} has no short form for a catalogue row`).toBeTruthy();
    }
  });
});

describe('the registry itself', () => {
  it('gives every criterion one id and one sentence', () => {
    const ids = CRITERIA.map((d) => d.id);
    const asks = CRITERIA.map((d) => d.asks);
    expect(ids.length, 'two criteria share an id').toBe(new Set(ids).size);
    expect(asks.length, 'two criteria ask the same question').toBe(new Set(asks).size);
  });

  it('keeps every old spelling pointing at exactly one criterion', () => {
    // A save taken yesterday still carries the words it was written in.
    const seen = new Map<string, string>();
    for (const d of CRITERIA) {
      for (const old of d.was ?? []) {
        expect(seen.has(old), `"${old}" is claimed by ${seen.get(old)} and ${d.id}`).toBe(false);
        seen.set(old, d.id);
        expect(asAsked(old), 'an old spelling does not lead to the words it is asked in now').toBe(d.asks);
        expect(answerable(old), 'a game in play stopped being checkable').toBe(answerable(d.asks));
      }
    }
    expect(seen.size, 'the migration list is empty, which it should not be while saves exist')
      .toBeGreaterThan(0);
  });

  it('does not answer a question nobody asks', () => {
    // The other direction: a checker with no way to reach it is dead weight, and dead weight is
    // how the three structures this replaced drifted apart.
    const written = new Set(everythingTheGameWrites().map((x) => criterionFor(x.asks)?.id));
    const unreachable = CRITERIA.filter((d) => !written.has(d.id)).map((d) => d.id);
    expect(unreachable, 'these are in the registry and nothing can ever ask them').toEqual([]);
  });
});
