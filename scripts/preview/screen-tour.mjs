/* A walk through every screen of the game, saved as PNGs.
 *
 *   npm run dev            # in another terminal
 *   node scripts/preview/screen-tour.mjs
 *
 * Writes to ~/Desktop/zoo-screens. Solo play, from the intro to the Retrospective: what a learner
 * meets, in the order they meet it. Hand-run; nothing is committed from it.
 *
 * Signing in is only needed for a shared session, which this tour does not use.
 */
import pw from '../../node_modules/playwright/index.js';

const B = 'http://localhost:8080';
const open = async () => {
  const b = await pw.chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 950 } });
  return { b, p };
};
const OUT = '/Users/alundavies-baker/Desktop/zoo-screens';
const { b, p } = await open();
const S = '39eebb85-8775-4002-9bf8-eb5ba6080bec';
let n = 0;
const shot = async (name, ms = 900) => {
  await p.waitForTimeout(ms);
  const file = `${OUT}/${String(++n).padStart(2, '0')}-${name}.png`;
  await p.screenshot({ path: file, fullPage: true });
  const h = ((await p.$$eval('h1,h2', xs => xs.map(x => x.innerText.trim())))[0] ?? '').replace(/\s+/g, ' ');
  console.log(String(n).padStart(2), name.padEnd(26), '|', h.slice(0, 46));
};
const click = async (re, ms = 1300) => { try { await p.getByRole('button', { name: new RegExp(re, 'i') }).first().click({ timeout: 6000 }); } catch { console.log('   MISS', re); } await p.waitForTimeout(ms); };

// --- solo, from the beginning ---
await p.goto(`${B}/zoo-game`, { waitUntil: 'networkidle' });
await shot('intro-scrum-on-a-page', 1500);
await click('Start building the zoo');
await shot('product-goal');
await click('Start building →');
await shot('brief-areas');
await click('Big Cats'); await click('Waterside'); await click('Next');
await shot('brief-visitors');
await click('Next');
await shot('brief-first-zone');
await click('Savanna Its first'); await click('Write the Product Backlog', 2000);
await shot('refine-before-sprint-1', 1500);
await click('AGREE THE DEFINITION OF DONE', 800);
await shot('definition-of-done');
await click('We agree - this is our Definition of Done', 800);
await click('Go to Sprint Planning', 1600);
await shot('planning-topic-1-why');
await click('Word it for me', 900);
await shot('planning-goal-worded');
// Playing alone you are all three accountabilities, so there is nobody to agree with.
await click('I agree', 900);
await click('Next: what to build', 1200);
await shot('planning-topic-2-what');
// Pull a Sprint's worth in: the plus beside each item.
for (let k = 0; k < 4; k++) {
  const add = p.getByLabel(/^Add .+ to the Sprint$/).first();
  if (await add.count()) { await add.click().catch(() => {}); await p.waitForTimeout(500); }
}
await shot('planning-topic-2-chosen');
await click('Next: how', 1400);
await shot('planning-topic-3-how');
await click('Suggest steps for all', 1500);
await shot('planning-steps-planned');
await click('Start Sprint', 2500);
await shot('sprint-board-day-1');
// the park, both ways of drawing it
await click('^Increment$', 1200); await shot('park-isometric');
await click('^Plan$', 1200); await shot('park-plan-blueprint');
await click('Product Backlog', 1200); await shot('sprint-pull-from-backlog');
await click('^Artifacts', 1200); await shot('artifacts-drawer');
await click('Scrum', 1200); await shot('scrum-on-a-page');

// ...and on to the Review and the Retrospective, letting the days run out.
await click('End Day', 2000);
await shot('daily-scrum');
for (let d = 0; d < 6; d++) {
  await click('End Day', 2000);
  const h = ((await p.$$eval('h1,h2', xs => xs.map(x => x.innerText.trim())))[0] ?? '');
  if (/What did we get Done/.test(h)) break;
}
await shot('review-1-done', 1500);
await click('Next: the visitors', 1500); await shot('review-2-visitors');
await click('Next: what we do about it', 1500); await shot('review-3-what-next');
await click('Retrospective', 1800); await shot('retro-1-inspect');
await click('Next: what we will change', 1200); await shot('retro-2-adapt');
await b.close();
console.log('\nwritten to', OUT);
