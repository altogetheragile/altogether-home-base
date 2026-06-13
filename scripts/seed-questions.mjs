#!/usr/bin/env node
// Seed coach question ladders into knowledge_items (item_type 'question'). Run
// AFTER the 20260613120000_coach_question_ladders.sql migration. Upserts by slug,
// so it is safe to re-run. Uses the service role key from .env. Defaults to a dry
// run; pass --apply to write.
//
//   node scripts/seed-questions.mjs [--apply]
//
// Ladders are keyed by the calling TOOL (coaches_slug = tool key), and cell_key is
// the lowercased cell tag the tool sends to coach-reflect. Content is transcribed
// from the static CellCoach strings in each tool (src/types/*, src/config/canvases.ts,
// CoachedBMCEditor and the single-cell coaches), so grounding starts identical to
// today, then becomes editable as Knowledge Base data.

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

// tool key -> [{ cell, open, stretch }]. cell is the lowercased cell tag.
const LADDERS = {
  persona: [
    { cell: 'name', open: 'Who is this person? Give them a name.', stretch: 'Is this a real type of person you have met, or one you wish existed?' },
    { cell: 'role', open: 'What is their role or situation?', stretch: 'What part of their role do they find hardest to admit?' },
    { cell: 'context', open: 'What is their context?', stretch: 'What in their day quietly works against using this?' },
    { cell: 'goals', open: 'What are they trying to get done?', stretch: 'Who would be inconvenienced by this person succeeding?' },
    { cell: 'pains', open: 'What frustrates or blocks them?', stretch: 'Which pain do they complain about but secretly tolerate?' },
    { cell: 'behaviours', open: 'How do they behave?', stretch: 'What do they say they do that differs from what they actually do?' },
    { cell: 'quote', open: 'What might they say?', stretch: 'Would they say this out loud, or only think it?' },
  ],
  'impact-map': [
    { cell: 'why', open: 'What is the goal?', stretch: 'If you achieved this and nothing felt different, how would you know?' },
    { cell: 'who', open: 'Who can help or hinder the goal?', stretch: 'Whose behaviour are you assuming will not change?' },
    { cell: 'how', open: 'How should their behaviour change?', stretch: 'Which of these changes would happen anyway, without you?' },
    { cell: 'what', open: 'What could we do to support that?', stretch: 'Which of these are you most attached to, and what would tell you to drop it?' },
  ],
  'journey-map': [
    { cell: 'doing', open: 'What is this persona trying to get done at this stage?', stretch: 'Which stage do we not actually have evidence for?' },
    { cell: 'thinking', open: 'What is going through their mind here?', stretch: 'Which stage do we not actually have evidence for?' },
    { cell: 'feeling', open: 'How do they feel at this point, and why?', stretch: 'Which stage do we not actually have evidence for?' },
    { cell: 'pains', open: 'What gets in their way or frustrates them here?', stretch: 'Which stage do we not actually have evidence for?' },
    { cell: 'opportunities', open: 'What could we do here that would actually help?', stretch: 'Which stage do we not actually have evidence for?' },
  ],
  'business-case': [
    { cell: 'vision', open: 'What is the business vision this case serves?', stretch: "What in today's way of working actually works, and might this break it?" },
    { cell: 'options', open: 'What options did you consider, including doing nothing?', stretch: 'Which option had you already chosen before the others were written down?' },
    { cell: 'solution', open: 'What is the solution, in brief?', stretch: 'Which optional part is actually load-bearing?' },
    { cell: 'alignment', open: 'How does this align to the strategy?', stretch: 'If the strategy shifted next quarter, which part of this case would fall?' },
    { cell: 'costs/benefits', open: 'What are the costs and benefits, as best, expected and worst ranges?', stretch: 'What does your worst case still quietly assume will go right?' },
    { cell: 'appraisal', open: 'What is the investment appraisal?', stretch: 'When do the costs land against the benefits, and can you survive the gap?' },
    { cell: 'risk', open: 'What is the investment risk?', stretch: 'Which risk are you leaving out because naming it would weaken the case?' },
    { cell: 'assumptions', open: 'What are the key assumptions, risks and dependencies?', stretch: 'Which assumption are you relying on most and testing least?' },
  ],
  'product-vision': [
    { cell: 'vision', open: 'What is the overarching vision?', stretch: 'If this vision came true, what would you have to stop doing?' },
    { cell: 'who', open: 'Who is the product for?', stretch: 'Who are you quietly hoping will not use this?' },
    { cell: 'needs', open: 'What problem does it solve, or benefit does it offer?', stretch: 'Which need do they say they have but do not act on?' },
    { cell: 'product', open: 'What is the product, in brief?', stretch: 'What is the smallest version that would still matter?' },
    { cell: 'goals', open: 'What are the business goals?', stretch: 'How would you know this product earned its place, not just shipped?' },
  ],
  bmc: [
    { cell: 'segments', open: 'Who are the most important customers you are creating value for?', stretch: 'Which segment are you serving out of habit rather than choice?' },
    { cell: 'value', open: 'What value do you deliver, and which customer problem are you solving?', stretch: 'Which part of your value do customers actually pay for, rather than the part you are proud of?' },
    { cell: 'channels', open: 'Through which channels do your customers want to be reached?', stretch: 'Which channel works because it is easy for you, not easy for them?' },
    { cell: 'relationships', open: 'What kind of relationship does each segment expect from you?', stretch: 'Where are you investing in a relationship the customer does not actually want?' },
    { cell: 'revenue', open: 'What are customers genuinely willing to pay for, and how?', stretch: 'Which revenue stream are you assuming will appear rather than testing?' },
    { cell: 'resources', open: 'What key resources does your value proposition require?', stretch: 'Which resource would hurt most if it disappeared tomorrow?' },
    { cell: 'activities', open: 'What key activities does your value proposition require?', stretch: 'Which activity do you keep in-house that you no longer need to?' },
    { cell: 'partners', open: 'Who are your key partners and suppliers?', stretch: 'Which partner are you depending on more than you would like to admit?' },
    { cell: 'costs', open: 'What are the most important costs in your model?', stretch: 'Which cost have you normalised that a newcomer would question?' },
  ],
  'ways-of-working': [
    { cell: 'improve', open: 'What one thing would most improve how you work together?', stretch: 'What works well that we have quietly become afraid to change?' },
  ],
  'probe-tracker': [
    { cell: 'probe', open: 'What is the smallest test that would tell you most?', stretch: 'What would prove this wrong?' },
  ],
  'benefits-scorecard': [
    { cell: 'outcome', open: 'What is the real outcome you want, beyond the output being shipped?', stretch: 'If every number improved and nothing really changed, how would you know?' },
  ],
};

const rows = [];
for (const [tool, cells] of Object.entries(LADDERS)) {
  for (const c of cells) {
    const cellSlug = c.cell.replace(/[^a-z0-9]+/g, '-');
    rows.push({
      slug: `q-${tool}-${cellSlug}-open`, name: `${tool} ${c.cell}: open`, item_type: 'question',
      description: c.open, coaches_slug: tool, cell_key: c.cell, rung: 'open', ladder_order: 1, is_published: true,
    });
    rows.push({
      slug: `q-${tool}-${cellSlug}-stretch`, name: `${tool} ${c.cell}: stretch`, item_type: 'question',
      description: c.stretch, coaches_slug: tool, cell_key: c.cell, rung: 'stretch', ladder_order: 9, is_published: true,
    });
  }
}

const toolCount = Object.keys(LADDERS).length;
console.log(`Coach question rows to upsert: ${rows.length} across ${toolCount} tools`);
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
console.log(`Seeded ${rows.length} question rows across ${toolCount} tools.`);
