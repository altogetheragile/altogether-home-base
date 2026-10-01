#!/usr/bin/env node
// A newcomer plays the game, and says where it confused them.
//
// Asked for as "an AI agent to play the game as a user to test usability ... a newbie ... like a
// real new user". The value is in what it does NOT know: it sees the rendered screen and nothing
// else - no source, no test hooks, no explanation of what the game is - so when it misreads a
// label, that is the label's fault and not the tester's.
//
// Run it:
//   ANTHROPIC_API_KEY=... node scripts/playtest/playtest.mjs
//   ... --url http://localhost:4173/zoo-game --steps 20 --headed
//
// It costs money: one Claude call per step. Deliberately not in CI, and deliberately capped.
//
// What it is not: a test. It does not pass or fail, it reports. Two runs will differ, which is
// the point - a newcomer is not deterministic either.

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { askTheNewcomer } from './ask.mjs';
import { readScreen, doAction } from './screen.mjs';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback;
};
const has = (name) => process.argv.includes(`--${name}`);

const URL = arg('url', 'https://altogetheragile.com/zoo-game');
const MAX_STEPS = Number(arg('steps', 18));
const OUT = resolve(arg('out', 'playtest-report'));

// A stand-in that needs no key and no model, for checking the harness itself: does it read the
// screen, can it press what it found, does the report come out. Everything except the judgement.
// Without this the first thing anybody learns about a broken screen reader is the bill.
const SCRIPTED = [
  { thinking: 'Dry run: pressing whatever the first button is.', expect: 'something happens', confused_by: null, surprised_by: null, action: { kind: 'click', ref: 'FIRST' } },
  { thinking: 'Dry run: scrolling.', expect: 'more of the page', confused_by: null, surprised_by: null, action: { kind: 'scroll' } },
  { thinking: 'Dry run: typing into the first field.', expect: 'the words appear', confused_by: 'nothing, this is a dry run', surprised_by: null, action: { kind: 'type', ref: 'FIRSTFIELD', text: 'a zoo the whole county talks about' } },
  { thinking: 'Dry run: done.', expect: 'it ends', confused_by: null, surprised_by: null, action: { kind: 'stop' } },
];

const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY && !has('dry')) {
  console.error(`
No ANTHROPIC_API_KEY, so there is nobody to play the game.

This script asks Claude what a newcomer would do, once per step, so it needs a key in the
environment. The project's key lives in Supabase secrets, which a script on your machine cannot
read, so put one in .env or pass it in:

    ANTHROPIC_API_KEY=sk-... node scripts/playtest/playtest.mjs

Nothing else is missing: Playwright is already a dependency.

To check the harness itself without spending anything, which exercises everything but the
judgement:

    node scripts/playtest/playtest.mjs --dry
`);
  process.exit(2);
}

/** The stand-in, with its refs resolved against whatever is actually on the screen. */
const dryStep = (step, screen) => {
  const said = SCRIPTED[Math.min(step, SCRIPTED.length) - 1];
  const ref = said.action.ref;
  if (ref === 'FIRST') return { ...said, action: { ...said.action, ref: screen.controls[0]?.ref } };
  if (ref === 'FIRSTFIELD') {
    const field = screen.controls.find((c) => c.role === 'field');
    return field ? { ...said, action: { ...said.action, ref: field.ref } } : { ...said, action: { kind: 'scroll' } };
  }
  return said;
};

const run = async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: !has('headed') });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const log = [];
  const history = [];
  console.log(`A newcomer is opening ${URL}\n`);
  await page.goto(URL, { waitUntil: 'networkidle' }).catch(() => page.goto(URL));

  for (let step = 1; step <= MAX_STEPS; step += 1) {
    const screen = await readScreen(page);
    const shot = `step-${String(step).padStart(2, '0')}.png`;
    await page.screenshot({ path: resolve(OUT, shot) });

    let said;
    try {
      said = has('dry') ? dryStep(step, screen) : await askTheNewcomer({ apiKey: KEY, screen, history, step, maxSteps: MAX_STEPS });
    } catch (e) {
      console.error(`\nStopped at step ${step}: ${e.message}`);
      break;
    }
    if (!said?.action) {
      console.error(`\nStopped at step ${step}: the answer was not in the shape expected.`);
      break;
    }

    const did = await doAction(page, said.action);
    // Settle, because a decision taken on a half-rendered screen is not the screen's fault.
    await page.waitForTimeout(900);

    log.push({ step, shot, url: page.url(), ...said, did });
    history.push(`${said.action.kind}${said.action.ref ? ` the "${screen.controls.find((c) => c.ref === said.action.ref)?.name ?? said.action.ref}"` : ''} - ${did}`);

    const mark = said.confused_by ? 'x' : said.surprised_by ? '!' : '.';
    console.log(`${mark} ${step}. ${said.thinking}`);
    if (said.confused_by) console.log(`    confused: ${said.confused_by}`);
    if (said.surprised_by) console.log(`    surprised: ${said.surprised_by}`);

    if (said.action.kind === 'stop') break;
  }

  await browser.close();

  const trouble = log.filter((l) => l.confused_by || l.surprised_by);
  const report = [
    `# A newcomer plays ${URL}`,
    '',
    `${log.length} steps. ${trouble.length} of them produced confusion or surprise.`,
    '',
    '## Where it went wrong',
    '',
    trouble.length
      ? trouble.map((l) => [
        `### Step ${l.step}`,
        l.confused_by ? `**Confused by:** ${l.confused_by}` : '',
        l.surprised_by ? `**Surprised by:** ${l.surprised_by}` : '',
        `**Was thinking:** ${l.thinking}`,
        `**Expected:** ${l.expect}`,
        `**Did:** ${l.action.kind} ${l.action.ref ?? ''} - ${l.did}`,
        `![step ${l.step}](${l.shot})`,
        '',
      ].filter(Boolean).join('\n\n')).join('\n')
      : 'Nothing. Either the screens are clear or the run was too short to reach the hard parts.',
    '',
    '## Every step',
    '',
    ...log.map((l) => `${l.step}. ${l.thinking} _(${l.action.kind}: ${l.did})_`),
    '',
    '---',
    '',
    'Written by scripts/playtest/playtest.mjs. Not a test: two runs will differ, and a newcomer is',
    'not deterministic either. What is worth acting on is the same complaint turning up twice.',
  ].join('\n');

  writeFileSync(resolve(OUT, 'report.md'), `${report}\n`);
  console.log(`\n${trouble.length} of ${log.length} steps gave trouble. Report: ${resolve(OUT, 'report.md')}`);
};

run().catch((e) => { console.error(e); process.exit(1); });
