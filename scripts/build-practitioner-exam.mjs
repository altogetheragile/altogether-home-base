#!/usr/bin/env node
/**
 * Build an AgilePM Practitioner sample-exam migration from a Markdown paper.
 *
 * The Practitioner format does not fit the flat Foundation question model on its
 * own (it has a shared scenario, four scenario-based questions, each split into
 * parts with sub-question items, and three item styles: Matching, single-answer,
 * and "select 2" multiple-response). This script flattens that structure onto the
 * existing `questions` table:
 *   - Matching part      -> one single-select item per Column-1 row, options = Column 2
 *   - single-answer part -> one single-select item per sub-question
 *   - "select 2" part    -> one multi-answer item per sub-question (correct = "X,Y")
 * The shared scenario goes on `exams.scenario`; the player pins it beside the
 * question. Correct answers and rationales come from the Marking Scheme section.
 *
 * Usage:
 *   node scripts/build-practitioner-exam.mjs <paper.md> [output.sql]
 *
 * Re-runnable for any future Practitioner paper written in the same MD format.
 */
import fs from 'fs';
import crypto from 'crypto';

/* ─── Config (edit to rename / reslug a paper) ─── */
const EXAM = {
  title: 'AgilePM3 Practitioner - Paper 1',
  slug: 'agilepm-practitioner-paper-1',
  description:
    'Original practice Practitioner paper using the Harbour Quarter Regeneration scenario. ' +
    'Objective-test format: four scenario-based questions, 60 marks, 50% to pass, 2 hours, open book.',
  duration_minutes: 120,
  pass_mark: 30,
  total_questions: 60,
  status: 'published',
};

const inPath = process.argv[2];
if (!inPath) {
  console.error('Usage: node scripts/build-practitioner-exam.mjs <paper.md> [output.sql]');
  process.exit(1);
}
const outPath = process.argv[3] || 'supabase/migrations/20260619120000_add_agilepm_practitioner_paper1.sql';

const raw = fs.readFileSync(inPath, 'utf8');
const lines = raw.split(/\r?\n/);

/* ─── Section boundaries ─── */
const find = (re) => lines.findIndex((l) => re.test(l));
const scenarioStart = find(/^##\s+The Scenario\s*$/);
const bookletStart = find(/^#\s+Question Booklet\s*$/);
const markingStart = find(/^#\s+Marking Scheme and Rationale\s*$/);
let coverageStart = find(/^##\s+A Note On Coverage/);
if (coverageStart === -1) coverageStart = lines.length;

if (scenarioStart === -1 || bookletStart === -1 || markingStart === -1) {
  console.error('Could not locate "## The Scenario", "# Question Booklet" and "# Marking Scheme and Rationale" headers.');
  process.exit(1);
}

const scenarioMd = lines.slice(scenarioStart + 1, bookletStart).join('\n').trim();

/* ─── Split a line range into parts keyed by Q<num><letter> ─── */
function splitParts(start, end) {
  const parts = [];
  let q = null;
  let cur = null;
  for (let i = start; i < end; i++) {
    const l = lines[i];
    let m;
    if ((m = l.match(/^##\s+Question\s+(\d+):\s*(.*)$/))) {
      q = { num: Number(m[1]), area: m[2].trim() };
      continue;
    }
    if ((m = l.match(/^###\s+(Q\d+[A-Z])\s*(?:\(([^)]*)\))?\.?\s*(.*)$/))) {
      cur = { key: m[1], marks: (m[2] || '').trim(), title: (m[3] || '').trim(), q, body: [] };
      parts.push(cur);
      continue;
    }
    if (cur) cur.body.push(l);
  }
  return parts;
}

const optionRe = /^[-*]\s+([A-H])\.\s+(.*)$/; // "- A. text"
const numItemRe = /^\*\*(\d+)\.\*\*\s*(.*)$/; // "**1.** stem"
const colNumRe = /^(\d+)\.\s+(.*)$/; // "1. text" (matching column 1)

/* ─── Parse one Question-Booklet part into flat items ─── */
function parseBookletPart(part) {
  const body = part.body;
  const isMatching = body.some((l) => /^\*\*Column 1\*\*/.test(l));
  const partLetter = part.key.slice(-1);
  const area = `Question ${part.q.num}, Part ${partLetter}`;

  // Instruction = prose before the first item / column marker.
  const firstMarker = body.findIndex(
    (l) => /^\*\*Column 1\*\*/.test(l) || numItemRe.test(l),
  );
  const instruction = body
    .slice(0, firstMarker === -1 ? body.length : firstMarker)
    .map((l) => l.trim())
    .filter(Boolean)
    .join(' ')
    .trim();

  const itemType = isMatching
    ? 'match'
    : /select 2 answers/i.test(`${part.title} ${instruction}`)
      ? 'multi'
      : 'single';

  // Fields shared by every item in this part (used by the player to group/render)
  const common = {
    area,
    question_number: part.q.num,
    part: partLetter,
    item_type: itemType,
    part_instruction: instruction,
  };

  const items = [];

  if (isMatching) {
    const c1Start = body.findIndex((l) => /^\*\*Column 1\*\*/.test(l));
    const c2Start = body.findIndex((l) => /^\*\*Column 2\*\*/.test(l));
    const col1 = [];
    for (let i = c1Start + 1; i < c2Start; i++) {
      const m = body[i].match(colNumRe);
      if (m) col1.push(m[2].trim());
    }
    const col2 = []; // [{letter,text}]
    for (let i = c2Start + 1; i < body.length; i++) {
      const m = body[i].match(optionRe);
      if (m) col2.push({ letter: m[1], text: m[2].trim() });
    }
    // Each Column-1 row is one markable item; the instruction lives at part level.
    for (const rowText of col1) {
      items.push({ ...common, question_text: rowText, options: col2.map((o) => ({ ...o })) });
    }
  } else {
    let cur = null;
    for (const l of body) {
      const im = l.match(numItemRe);
      if (im) {
        if (cur) items.push(cur);
        cur = { ...common, question_text: im[2].trim(), options: [] };
        continue;
      }
      const om = l.match(optionRe);
      if (om && cur) {
        cur.options.push({ letter: om[1], text: om[2].trim() });
        continue;
      }
      // continuation line of a stem (rare): append
      if (cur && cur.options.length === 0 && l.trim()) {
        cur.question_text = `${cur.question_text} ${l.trim()}`.trim();
      }
    }
    if (cur) items.push(cur);
  }

  return items;
}

/* ─── Parse one Marking-Scheme part into {letters, reference} per item ─── */
function parseMarkingPart(part) {
  const out = [];
  let cur = null;
  for (const l of part.body) {
    const m = l.match(/^(\d+)\.\s+\*\*(.+?)\*\*\s*(.*)$/);
    if (m) {
      if (cur) out.push(cur);
      const boldInner = m[2].trim();
      const rest = m[3].trim();
      const lm = boldInner.match(/^([A-H])\b(?:\s+and\s+([A-H])\b)?/);
      const letters = lm ? [lm[1], lm[2]].filter(Boolean) : [];
      const reference = `${boldInner} ${rest}`.replace(/\*\*/g, '').replace(/\*/g, '').trim();
      cur = { letters, reference };
      continue;
    }
    // continuation of rationale (ignore markdown horizontal rules)
    if (cur && l.trim() && !/^-{3,}\s*$/.test(l)) {
      cur.reference = `${cur.reference} ${l.trim()}`.trim();
    }
  }
  if (cur) out.push(cur);
  return out;
}

/* ─── Build keyed maps ─── */
const bookletParts = splitParts(bookletStart + 1, markingStart);
const markingParts = splitParts(markingStart + 1, coverageStart);

const markingByKey = {};
for (const p of markingParts) markingByKey[p.key] = parseMarkingPart(p);

/* ─── Zip booklet items with marking answers, in order ─── */
const errors = [];
const questions = [];
let sort = 0;
for (const part of bookletParts) {
  const items = parseBookletPart(part);
  const marks = markingByKey[part.key];
  if (!marks) {
    errors.push(`No marking scheme found for ${part.key}`);
    continue;
  }
  if (items.length !== marks.length) {
    errors.push(`${part.key}: ${items.length} booklet items but ${marks.length} marking items`);
  }
  items.forEach((item, i) => {
    const mk = marks[i];
    const available = item.options.map((o) => o.letter);
    if (!mk) {
      errors.push(`${part.key} item ${i + 1}: missing marking answer`);
      return;
    }
    if (mk.letters.length === 0) {
      errors.push(`${part.key} item ${i + 1}: could not parse answer letters from "${mk.reference.slice(0, 40)}"`);
    }
    for (const ltr of mk.letters) {
      if (!available.includes(ltr)) {
        errors.push(`${part.key} item ${i + 1}: answer ${ltr} not in options [${available.join('')}]`);
      }
    }
    sort += 1;
    questions.push({
      area: item.area,
      question_number: item.question_number,
      part: item.part,
      item_type: item.item_type,
      part_instruction: item.part_instruction,
      question_text: item.question_text,
      options: item.options,
      correct_answer: mk.letters.join(','),
      reference: mk.reference,
      sort_order: sort,
    });
  });
}

if (errors.length) {
  console.error('Validation errors:\n' + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}

/* ─── Emit SQL migration ─── */
const sq = (s) => (s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);
const optLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const examId = crypto.randomUUID();

let sql = '';
sql += `-- AgilePM Practitioner sample paper: "${EXAM.title}"\n`;
sql += `-- Generated from ${inPath.split('/').pop()} by scripts/build-practitioner-exam.mjs\n`;
sql += `-- Practitioner objective-test format: shared scenario + 4 questions x parts x ${questions.length} items total.\n\n`;

sql += `-- Schema support for the Practitioner format\n`;
sql += `ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS scenario text;\n`;
sql += `ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS shuffle boolean NOT NULL DEFAULT true;\n`;
sql += `ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS option_h text NOT NULL DEFAULT '';\n`;
sql += `ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_number integer;\n`;
sql += `ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS part text;\n`;
sql += `ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS item_type text;\n`;
sql += `ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS part_instruction text;\n\n`;

sql += `-- Replace any prior copy of this paper (idempotent re-run; cascade clears its questions).\n`;
sql += `-- Clear this exam's attempts first (exam_attempts FK has no cascade); scoped to this slug only.\n`;
sql += `DELETE FROM public.exam_attempts WHERE exam_id IN (SELECT id FROM public.exams WHERE slug = ${sq(EXAM.slug)});\n`;
sql += `DELETE FROM public.exams WHERE slug = ${sq(EXAM.slug)};\n\n`;

sql += `INSERT INTO public.exams (id, title, slug, description, scenario, shuffle, duration_minutes, pass_mark, total_questions, status)\n`;
sql += `VALUES (\n`;
sql += `  ${sq(examId)},\n`;
sql += `  ${sq(EXAM.title)},\n`;
sql += `  ${sq(EXAM.slug)},\n`;
sql += `  ${sq(EXAM.description)},\n`;
sql += `  ${sq(scenarioMd)},\n`;
sql += `  false,\n`;
sql += `  ${EXAM.duration_minutes}, ${EXAM.pass_mark}, ${EXAM.total_questions}, ${sq(EXAM.status)}\n`;
sql += `);\n\n`;

sql += `INSERT INTO public.questions\n`;
sql += `  (exam_id, area, question_number, part, item_type, part_instruction, question_text, option_a, option_b, option_c, option_d, option_e, option_f, option_g, option_h, correct_answer, reference, status, sort_order)\n`;
sql += `VALUES\n`;
const rows = questions.map((q) => {
  const opt = {};
  for (const L of optLetters) opt[L] = q.options.find((o) => o.letter === L)?.text ?? '';
  return (
    '  (' +
    `${sq(examId)}, ${sq(q.area)}, ${q.question_number}, ${sq(q.part)}, ${sq(q.item_type)}, ${sq(q.part_instruction)}, ${sq(q.question_text)}, ` +
    `${sq(opt.A)}, ${sq(opt.B)}, ${sq(opt.C)}, ${sq(opt.D)}, ${sq(opt.E)}, ${sq(opt.F)}, ${sq(opt.G)}, ${sq(opt.H)}, ` +
    `${sq(q.correct_answer)}, ${sq(q.reference)}, 'published', ${q.sort_order})`
  );
});
sql += rows.join(',\n') + ';\n';

fs.writeFileSync(outPath, sql);

/* ─── Report ─── */
console.log(`Parsed ${questions.length} items across ${bookletParts.length} parts.`);
const byPart = {};
for (const q of questions) byPart[q.area] = (byPart[q.area] || 0) + 1;
for (const [k, v] of Object.entries(byPart)) console.log(`  ${k}: ${v}`);
const multi = questions.filter((q) => q.correct_answer.includes(',')).length;
console.log(`Single-answer: ${questions.length - multi}, multiple-response: ${multi}`);
console.log(`Scenario: ${scenarioMd.length} chars`);
console.log(`Wrote ${outPath}`);
