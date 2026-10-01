// What the newcomer can see.
//
// The visible text and the things that can be acted on, and nothing else. No ids, no test hooks,
// no class names: a tester who can see `data-part="goal-wand"` knows what the wand is for, and
// the whole point is to find out whether the label alone is enough.

/** Reads the page as a person would: the words on it, and the controls, in the order they appear. */
export async function readScreen(page) {
  return page.evaluate(() => {
    const seen = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      const s = getComputedStyle(el);
      return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05;
    };

    // Visible text, in document order, with the structure a reader would perceive: a heading on
    // its own line, a paragraph on its own line.
    const blocks = [];
    const walk = (node) => {
      for (const el of node.children) {
        if (!seen(el)) continue;
        const tag = el.tagName.toLowerCase();
        if (['script', 'style', 'svg'].includes(tag)) continue;
        const own = [...el.childNodes]
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent.trim())
          .filter(Boolean)
          .join(' ');
        if (own) blocks.push(/^h[1-6]$/.test(tag) ? `## ${own}` : own);
        walk(el);
      }
    };
    walk(document.body);

    // Controls get a ref of their own, so the newcomer names what it is pressing without ever
    // being shown a selector.
    const controls = [];
    const act = document.querySelectorAll('button, a[href], input, textarea, select, [role="button"], [role="tab"]');
    act.forEach((el, i) => {
      if (!seen(el)) return;
      if (el.disabled) return;
      const name = (el.getAttribute('aria-label')
        || el.innerText?.trim()
        || el.getAttribute('placeholder')
        || el.value
        || el.getAttribute('title')
        || '').replace(/\s+/g, ' ').slice(0, 90);
      if (!name) return;
      const role = el.tagName.toLowerCase() === 'a' ? 'link'
        : el.tagName.toLowerCase() === 'textarea' || el.tagName.toLowerCase() === 'input' ? 'field'
        : el.getAttribute('role') || 'button';
      const ref = `c${i}`;
      el.setAttribute('data-playtest-ref', ref);
      controls.push({ ref, role, name });
    });

    // Long pages are read, not memorised: enough to judge the screen without paying for the lot.
    const text = [...new Set(blocks)].join('\n').slice(0, 6000);
    return { text, controls };
  });
}

/** Does what the newcomer decided, and says plainly when it could not. */
export async function doAction(page, action) {
  const { kind, ref, text } = action ?? {};
  if (kind === 'stop') return 'stopped';
  if (kind === 'scroll') {
    await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.8)));
    return 'scrolled down';
  }
  const target = ref ? page.locator(`[data-playtest-ref="${ref}"]`) : null;
  if (!target || (await target.count()) === 0) return `could not find ${ref ?? 'anything'} to act on`;

  if (kind === 'type') {
    await target.fill(text ?? '');
    return `typed "${(text ?? '').slice(0, 60)}"`;
  }
  await target.click({ timeout: 5000 });
  return 'clicked it';
}
