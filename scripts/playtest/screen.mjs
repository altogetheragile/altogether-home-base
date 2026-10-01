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
    //
    // A sentence is taken WHOLE, bold and links included. It used to collect only the text nodes
    // that were an element's own direct children, so every inline tag punched a hole in the
    // sentence around it and its words came back separately, further down:
    //
    //   "What they add is , which is the part worth stealing."
    //
    // The newcomer reported that as a defect in the page, twice, in two different runs. It was not
    // one. A <strong> in the middle of a paragraph is not a hole to a person reading it.
    const INLINE = new Set(['a', 'abbr', 'b', 'br', 'code', 'em', 'i', 'kbd', 'mark', 'q', 's',
      'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr']);
    const blocks = [];
    const walk = (node) => {
      for (const el of node.children) {
        if (!seen(el)) continue;
        const tag = el.tagName.toLowerCase();
        if (['script', 'style', 'svg'].includes(tag)) continue;
        // A run of prose: nothing inside it breaks the line, so it is one sentence and is read as
        // one. Anything with a block inside it is a container, and is walked rather than read.
        const prose = [...el.children].every((c) => INLINE.has(c.tagName.toLowerCase()));
        if (prose) {
          const own = (el.innerText ?? el.textContent ?? '').replace(/\s+/g, ' ').trim();
          if (own) blocks.push(/^h[1-6]$/.test(tag) ? `## ${own}` : own);
          continue;
        }
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
      const tag = el.tagName.toLowerCase();
      const field = tag === 'input' || tag === 'textarea' || tag === 'select';
      // A field is named by its LABEL, never by what is sitting in it.
      //
      // It used to fall back to the placeholder, so an empty box named itself after its own grey
      // prompt text. The newcomer could not tell the difference between a box with a suggestion in
      // it and a box somebody had already filled in, and said so for ten steps running: "I cannot
      // tell what is currently in the Product Goal field, if anything."
      const name = (el.getAttribute('aria-label')
        || (field ? '' : el.innerText?.trim())
        || el.getAttribute('title')
        || (field ? el.getAttribute('placeholder') : '')
        || '').replace(/\s+/g, ' ').slice(0, 90);
      if (!name) return;
      const role = tag === 'a' ? 'link' : field ? 'field' : el.getAttribute('role') || 'button';
      const ref = `c${i}`;
      el.setAttribute('data-playtest-ref', ref);
      const one = { ref, role, name };
      if (field) {
        // What a person sees when they look at the box: the words in it, or nothing and a
        // suggestion in grey, and whether the cursor is sitting there.
        one.value = (el.value ?? '').replace(/\s+/g, ' ').slice(0, 200);
        one.hint = (el.getAttribute('placeholder') ?? '').replace(/\s+/g, ' ').slice(0, 120);
        one.focused = el === document.activeElement;
      }
      controls.push(one);
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
  // Pressing a key, because some of this game can only be played with one.
  //
  // The park says "picked up - arrow keys move it, Enter puts it down", which is a real keyboard
  // path put there on purpose so the building half of the game is not mouse-only. The harness had
  // no way to press a key, so the newcomer clicked the same thing seven times and ran out of steps
  // with the enclosure still in its hands: "I cannot use arrow keys in this interface, so I am
  // stuck." Nothing wrong with the page. The tester could not do what the page told it to.
  if (kind === 'key') {
    const name = (text ?? '').trim() || 'Enter';
    if (ref) await page.locator(`[data-playtest-ref="${ref}"]`).focus().catch(() => {});
    await page.keyboard.press(name);
    return `pressed ${name}`;
  }
  if (kind === 'scroll') {
    await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.8)));
    return 'scrolled down';
  }
  const target = ref ? page.locator(`[data-playtest-ref="${ref}"]`) : null;
  if (!target || (await target.count()) === 0) return `could not find ${ref ?? 'anything'} to act on`;

  if (kind === 'type') {
    await target.fill(text ?? '');
    return `typed "${(text ?? '').slice(0, 60)}" into it`;
  }

  // What clicking actually did, in the words a person would use.
  //
  // It used to say "clicked it" whatever happened, and for a text field that is a lie by omission:
  // a click puts the cursor in the box and changes nothing else on the screen, so the newcomer read
  // an unchanged screen as a dead control and clicked it again. Ten times, in one run, before
  // giving up on it: "I am not sure if that is a button or just a label on the text field."
  const isField = await target.evaluate((el) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)).catch(() => false);
  try {
    await target.click({ timeout: 5000 });
  } catch (e) {
    if (!/intercept|outside of the viewport|not stable/i.test(e.message)) throw e;
    // Something is sitting on top of it. A person would see that and work round it; the run
    // should not end because a sticky bar was in the way.
    await target.click({ timeout: 5000, force: true }).catch(() => {});
    return 'something on the page was covering it, so the click may not have landed where you meant';
  }
  if (!isField) return 'clicked it';
  const now = await target.evaluate((el) => (el.value ?? '')).catch(() => '');
  return now.trim()
    ? `the cursor is now in that box, which already contains "${now.slice(0, 80)}"`
    : 'the cursor is now in that box, and the box is empty - nothing else on the screen changes until you type something';
}
