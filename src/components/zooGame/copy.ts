import { SCRUM_CARDS, SCRUM_INTRO, EVENT_CONTRACT, ARTIFACT_PROVENANCE, CARDS_BY_PHASE, INTRO_COPY } from './scrumContent';
import { COACH_NUDGES, RETRO_QUESTIONS } from './engine';

// ============= The teaching copy, as data you can edit =============
//
// Everything the game says ABOUT SCRUM is editable without a deploy. The trainer polishing a
// sentence at 9pm should not need a developer.
//
// Two rules make that safe. The code holds the defaults, so an override is only ever a layer on
// top - a bad edit can be reverted to the shipped wording in one click, and if the fetch fails the
// game runs on what it was built with. And only the TEACHING voice is editable: button labels,
// column names and step titles stay in code, because they are bound to layout and logic, and an
// edit there breaks a screen rather than improving a sentence.

/** Where a piece of copy appears, so the admin list can be grouped the way the game is played. */
export type CopyGroup = 'Teaching cards' | 'The front page' | 'Scrum on one page' | 'What events touch' | 'Artifacts' | 'The coach' | 'Retrospective questions';

export interface CopyEntry {
  /** Stable id - the database key. Never renamed once shipped, or overrides orphan. */
  key: string;
  group: CopyGroup;
  /** What this text is, in the admin list. */
  label: string;
  /** Where it shows up, so it can be found in the game. */
  where: string;
  /** The shipped wording. */
  value: string;
  /** Longer than a line? The editor gives it a textarea. */
  long?: boolean;
  /** Which game phases this text appears in, so the in-game editor can show you only what is on
   *  the screen in front of you. Empty means it appears everywhere (the header, the reference). */
  phases: string[];
  /** Put the new value back into the live content structures. */
  apply: (v: string) => void;
}

const CARD_FIELDS = [
  ['summary', 'Summary', false], ['why', 'Why', true], ['who', 'Who', true],
  ['when', 'When', true], ['how', 'How', true], ['timebox', 'Timebox', false],
  ['notScrum', 'Not-Scrum note', true],
] as const;

/** Every editable string in the game, with its default and how to write it back. This one function
 *  serves both jobs: applying saved overrides at load, and listing what can be edited in admin. */
export function copyEntries(): CopyEntry[] {
  const out: CopyEntry[] = [];

  // Which phase shows which card, so a card can be found where it is met.
  const cardPhase: Record<string, string[]> = {};
  for (const [phase, ids] of Object.entries(CARDS_BY_PHASE)) for (const id of ids) (cardPhase[id] ??= []).push(phase);

  // The front page: the first words anyone reads, and until now the only ones a trainer could not
  // touch. Not Scrum teaching, but the same job - saying what this is.
  out.push(
    { key: 'intro.title', group: 'The front page', label: 'Title', where: 'The front page', value: INTRO_COPY.title, phases: ['intro'], apply: (v) => { INTRO_COPY.title = v; } },
    { key: 'intro.strapline', group: 'The front page', label: 'Strapline', where: 'The front page', value: INTRO_COPY.strapline, long: true, phases: ['intro'], apply: (v) => { INTRO_COPY.strapline = v; } },
    { key: 'intro.loopTitle', group: 'The front page', label: 'The Sprint loop - heading', where: 'The front page', value: INTRO_COPY.loopTitle, phases: ['intro'], apply: (v) => { INTRO_COPY.loopTitle = v; } },
  );
  INTRO_COPY.loop.forEach((l, i) => {
    out.push({
      key: `intro.loop.${i}`, group: 'The front page', label: l.step, where: 'The front page - each Sprint',
      value: l.text, phases: ['intro'], apply: (v) => { INTRO_COPY.loop[i].text = v; },
    });
  });

  // The Why / Who / When / How cards - the largest block, and the one most worth owning.
  for (const card of SCRUM_CARDS) {
    out.push({
      key: `card.${card.id}.title`, group: 'Teaching cards', label: 'Title',
      where: `${card.title} card`, value: card.title, phases: cardPhase[card.id] ?? [],
      apply: (v) => { card.title = v; },
    });
    for (const [field, label, long] of CARD_FIELDS) {
      const current = card[field];
      if (current === undefined) continue;
      out.push({
        key: `card.${card.id}.${field}`, group: 'Teaching cards', label,
        where: `${card.title} card`, value: current, long, phases: cardPhase[card.id] ?? [],
        apply: (v) => { (card as unknown as Record<string, string>)[field] = v; },
      });
    }
  }

  // The one page of Scrum shown before play.
  out.push({
    key: 'intro.what', group: 'Scrum on one page', label: 'What Scrum is',
    where: 'Under the heading', value: SCRUM_INTRO.what, long: true, phases: ['intro'],
    apply: (v) => { SCRUM_INTRO.what = v; },
  });
  const sections = [
    ['foundations', 'Founded on'], ['accountabilities', 'Three accountabilities'],
    ['artifacts', 'Three artifacts'], ['events', 'Five events'], ['values', 'Five values'],
  ] as const;
  for (const [section, label] of sections) {
    SCRUM_INTRO[section].forEach((row, i) => {
      out.push({
        key: `intro.${section}.${i}`, group: 'Scrum on one page', label: `${label} - ${row.name}`,
        where: `${label}, on the one-pager`, value: row.text, long: true, phases: ['intro'],
        apply: (v) => { SCRUM_INTRO[section][i].text = v; },
      });
    });
  }

  // What each event inspects, adapts and creates - the extra line under the strip.
  for (const [phase, contract] of Object.entries(EVENT_CONTRACT)) {
    out.push({
      key: `contract.${phase}.who`, group: 'What events touch', label: `${contract.event} - who is there`,
      where: `The "?" panel on ${contract.event}`, value: contract.who, phases: [phase],
      apply: (v) => { contract.who = v; },
    });
    if (contract.also !== undefined) {
      out.push({
        key: `contract.${phase}.also`, group: 'What events touch', label: `${contract.event} - also inspects`,
        where: `The "?" panel on ${contract.event}`, value: contract.also, long: true, phases: [phase],
        apply: (v) => { contract.also = v; },
      });
    }
  }

  // What each artifact is, before it exists and once it does.
  for (const [id, prov] of Object.entries(ARTIFACT_PROVENANCE)) {
    out.push({
      key: `artifact.${id}.born`, group: 'Artifacts', label: `${id} - before it exists`,
      where: 'The Artifacts panel', value: prov.born, long: true, phases: [],
      apply: (v) => { prov.born = v; },
    });
    out.push({
      key: `artifact.${id}.changes`, group: 'Artifacts', label: `${id} - what changes it`,
      where: 'The Artifacts panel', value: prov.changes, long: true, phases: [],
      apply: (v) => { prov.changes = v; },
    });
  }

  // The coach only speaks when the screens do not - so these few lines carry weight.
  for (const nudge of COACH_NUDGES) {
    out.push({
      key: `nudge.${nudge.id}`, group: 'The coach', label: nudge.id,
      where: nudge.where, value: nudge.text, long: true, phases: nudge.phases,
      apply: (v) => { nudge.text = v; },
    });
  }

  // The open questions the Retrospective asks.
  RETRO_QUESTIONS.forEach((q, i) => {
    out.push({
      key: `retro.${q.id}`, group: 'Retrospective questions', label: q.id,
      where: q.when, value: q.text, long: true, phases: ['retro'],
      apply: (v) => { RETRO_QUESTIONS[i].text = v; },
    });
  });

  return out;
}

/** Lay saved overrides over the shipped wording. Unknown keys are ignored, so copy that has been
 *  renamed or retired in code cannot resurrect itself or throw. */
export function applyCopyOverrides(overrides: Record<string, string>): number {
  let applied = 0;
  for (const entry of copyEntries()) {
    const v = overrides[entry.key];
    if (typeof v === 'string' && v.trim() && v !== entry.value) { entry.apply(v); applied++; }
  }
  return applied;
}
