import { chromium } from 'playwright';
const b = await chromium.launch();
for (let i = 1; i <= 40; i++) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await p.goto('https://altogetheragile.com/zoo-game', { waitUntil: 'networkidle', timeout: 45000 });
    await p.waitForTimeout(1200);
    await p.locator('button').filter({ hasText: 'Write your Product Goal' }).first().click();
    await p.waitForTimeout(1000);
    await p.locator('[aria-label="Product Goal"]').fill('A park that families come back to.');
    await p.locator('button').filter({ hasText: 'Start building' }).first().click();
    await p.waitForTimeout(2500);
    // What colour is each seat on the team row?
    const seats = await p.evaluate(() => [...document.querySelectorAll('[data-part="team-row"] span, header span')]
      .map((n) => ({ t: n.textContent.trim(), bg: getComputedStyle(n).backgroundColor }))
      .filter((s) => ['PO', 'SM', 'A', 'B', 'C'].includes(s.t)));
    console.log(`try ${i}:`, seats.map((s) => `${s.t}=${s.bg}`).join(' '));
    await p.close();
    if (seats.some((s) => s.t === 'SM' && s.bg.includes('123, 45, 123'))) { console.log('DEPLOYED'); break; }
  } catch (e) { console.log(`try ${i}: ${e.message.split('\n')[0]}`); await p.close(); }
  await new Promise((r) => setTimeout(r, 20000));
}
await b.close();
