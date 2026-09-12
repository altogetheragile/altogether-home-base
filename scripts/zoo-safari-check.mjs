// Does a tint actually change pixels in Safari's engine?
//
// Every test and driver in this repo runs in Chromium, which is how a recolouring that WebKit
// ignores shipped twice with a green suite. This renders the real park - the dev server, a lion
// painted black - in WebKit AND Chromium and samples the animal.
import pw from '/Users/alundavies-baker/altogether-home-base/node_modules/playwright/index.js';

const OUT = '/Users/alundavies-baker/Desktop/zoo-shots';
const step = async (page, text, wait = 900) => {
  const b = page.getByRole('button', { name: new RegExp(text, 'i') }).first();
  if (!(await b.count())) return null;
  await b.click().catch(() => {});
  await page.waitForTimeout(wait);
  return text;
};

for (const engine of ['chromium', 'webkit']) {
  const browser = await pw[engine].launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  await page.goto('http://localhost:8080/zoo-game', { waitUntil: 'networkidle' });
  for (const s of ['Start building the zoo', 'Start building', 'who is the zoo for', 'Next', 'Next', 'Write the Product Backlog']) await step(page, s);
  await step(page, 'Split it up'); await step(page, 'Create 5 Product Backlog items', 1400);
  await step(page, 'and agree the definition of done');
  await step(page, 'We agree - this is our Definition of Done');
  await step(page, 'Go to Sprint Planning', 1800);
  await step(page, 'Word it for me'); await step(page, 'Next: what to build', 1000);
  for (let i = 0; i < 8; i += 1) {
    const a = page.getByLabel(/^Add .+ to the Sprint$/).first();
    if (await a.count()) { await a.click().catch(() => {}); await page.waitForTimeout(200); }
  }
  await step(page, 'Next: how', 1200); await step(page, 'Start Sprint', 2500);

  const card = async (name) => { await page.evaluate((n) => {
    const c = [...document.querySelectorAll('[data-part="board-card"]')].find((x) => x.innerText.trim().startsWith(n));
    c?.click(); }, name); await page.waitForTimeout(700); };
  const strip = async (m) => page.evaluate((mm) => {
    const root = document.querySelector('[data-part="park-options"]');
    const btn = [...(root?.querySelectorAll('button') ?? [])].find((x) => new RegExp(mm, 'i').test((x.getAttribute('aria-label') || x.innerText).trim()));
    btn?.click(); return !!btn;
  }, m);

  await card('Lion Enclosure'); await step(page, 'Start it', 1500);
  const box = await page.locator('[data-part="park-plan"]').boundingBox();
  await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.5);
  await page.waitForTimeout(1000);
  await strip('^Ground '); await page.waitForTimeout(400);
  await strip('Look Inside'); await page.waitForTimeout(800);
  for (const p of ['\\+ Water', '\\+ Rocks', '\\+ Tree']) { await strip(p); await page.waitForTimeout(500); }
  await strip('Back to the park'); await page.waitForTimeout(700);
  await page.evaluate(() => document.querySelector('[data-part="park-inspector"][data-collapsed="yes"]')?.click());
  await page.waitForTimeout(500);
  await step(page, 'Ask Priya to check', 1800);
  await step(page, 'Accept it', 1800);
  await page.evaluate(() => document.querySelector('[data-part="move-to-done"]')?.click());
  await page.waitForTimeout(1200);
  await card('Lion'); await step(page, 'Start it', 1600);

  const sample = async () => page.evaluate(() => {
    const g = document.querySelector('[data-spot^="lion:"]');
    if (!g) return null;
    const r = g.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height * 0.6), attr: g.getAttribute('filter') };
  });

  await step(page, 'Increment', 2000);
  const before = await sample();
  const shotA = await page.screenshot();
  await step(page, 'Sprint Backlog', 1200);
  await page.evaluate(() => document.querySelector('[data-part="look-black"]')?.click());
  await page.waitForTimeout(700);
  await step(page, 'Increment', 2000);
  const after = await sample();
  const shotB = await page.screenshot();
  await page.screenshot({ path: `${OUT}/play-safari-${engine}.png` });

  // Sample the same point out of both screenshots.
  const pick = async (buf, at) => {
    const p2 = await browser.newPage();
    const px = await p2.evaluate(async ({ b64, x, y }) => {
      const img = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = `data:image/png;base64,${b64}`; });
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      const d = c.getContext('2d').getImageData(x, y, 1, 1).data;
      return `${d[0]},${d[1]},${d[2]}`;
    }, { b64: buf.toString('base64'), x: at.x, y: at.y });
    await p2.close();
    return px;
  };

  if (!before || !after) { console.log(engine, 'no lion found', { before, after }); }
  else {
    const a = await pick(shotA, before), b = await pick(shotB, after);
    console.log(`${engine}: natural ${a} -> black ${b}  attr=${after.attr ?? 'none'}  changed=${a !== b}`);
  }
  await browser.close();
}
