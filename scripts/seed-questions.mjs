#!/usr/bin/env node
// Seed coach question ladders into knowledge_items (item_type 'question'). Run
// AFTER the 20260613120000_coach_question_ladders.sql migration. Upserts by slug,
// so it is safe to re-run. Uses the service role key from .env. Defaults to a dry
// run; pass --apply to write.
//
//   node scripts/seed-questions.mjs [--apply]
//
// v1 seeds the Persona ladders (transcribed from the static CellCoach strings in
// src/types/persona.ts), as the proof that grounding works. Other tools keep their
// static fallback until their ladders are seeded here.

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const apply = process.argv.includes('--apply');

function readEnv(name) {
  if (process.env[name]) return process.env[name];
  try {
    const line = readFileSync(new URL('../.env', import.meta.url), 'utf8')
      .split('\n')
      .find((l) => l.startsWith(`${name}=`));
    if (!line) return undefined;
    return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '');
  } catch {
    return undefined;
  }
}

const SUPABASE_URL = readEnv('VITE_SUPABASE_URL') || readEnv('SUPABASE_URL');
const SERVICE_ROLE = readEnv('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const ARTIFACT = 'coord-user-beneficiary-profile'; // Persona Studio grounds against this
const PERSONA = [
  { cell: 'name', open: 'Who is this person? Give them a name.', stretch: 'Is this a real type of person you have met, or one you wish existed?' },
  { cell: 'role', open: 'What is their role or situation?', stretch: 'What part of their role do they find hardest to admit?' },
  { cell: 'context', open: 'What is their context?', stretch: 'What in their day quietly works against using this?' },
  { cell: 'goals', open: 'What are they trying to get done?', stretch: 'Who would be inconvenienced by this person succeeding?' },
  { cell: 'pains', open: 'What frustrates or blocks them?', stretch: 'Which pain do they complain about but secretly tolerate?' },
  { cell: 'behaviours', open: 'How do they behave?', stretch: 'What do they say they do that differs from what they actually do?' },
  { cell: 'quote', open: 'What might they say?', stretch: 'Would they say this out loud, or only think it?' },
];

// Impact Map Builder grounds against coord-goal. Its cells pass the level tags
// WHY / WHO / HOW / WHAT, so cell_key is the lowercased tag (from src/types/impactMap.ts).
const IMPACT_ARTIFACT = 'coord-goal';
const IMPACT_MAP = [
  { cell: 'why', open: 'What is the goal?', stretch: 'If you achieved this and nothing felt different, how would you know?' },
  { cell: 'who', open: 'Who can help or hinder the goal?', stretch: 'Whose behaviour are you assuming will not change?' },
  { cell: 'how', open: 'How should their behaviour change?', stretch: 'Which of these changes would happen anyway, without you?' },
  { cell: 'what', open: 'What could we do to support that?', stretch: 'Which of these are you most attached to, and what would tell you to drop it?' },
];

const rows = [];
for (const p of PERSONA) {
  rows.push({
    slug: `q-persona-${p.cell}-open`, name: `Persona ${p.cell}: open`, item_type: 'question',
    description: p.open, coaches_slug: ARTIFACT, cell_key: p.cell, rung: 'open', ladder_order: 1, is_published: true,
  });
  rows.push({
    slug: `q-persona-${p.cell}-stretch`, name: `Persona ${p.cell}: stretch`, item_type: 'question',
    description: p.stretch, coaches_slug: ARTIFACT, cell_key: p.cell, rung: 'stretch', ladder_order: 9, is_published: true,
  });
}
for (const m of IMPACT_MAP) {
  rows.push({
    slug: `q-impact-map-${m.cell}-open`, name: `Impact Map ${m.cell}: open`, item_type: 'question',
    description: m.open, coaches_slug: IMPACT_ARTIFACT, cell_key: m.cell, rung: 'open', ladder_order: 1, is_published: true,
  });
  rows.push({
    slug: `q-impact-map-${m.cell}-stretch`, name: `Impact Map ${m.cell}: stretch`, item_type: 'question',
    description: m.stretch, coaches_slug: IMPACT_ARTIFACT, cell_key: m.cell, rung: 'stretch', ladder_order: 9, is_published: true,
  });
}

console.log(`Coach question rows to upsert: ${rows.length} (Persona ${PERSONA.length} cells, Impact Map ${IMPACT_MAP.length} cells)`);
console.log(`Mode: ${apply ? 'APPLY (writing)' : 'DRY RUN (no writes)'}`);
if (!apply) {
  console.log('\nDry run only. Re-run with --apply to write.');
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
const { error } = await supabase.from('knowledge_items').upsert(rows, { onConflict: 'slug' });
if (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}
console.log(`Seeded ${rows.length} question rows.`);
