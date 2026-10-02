import { describe, it, expect } from 'vitest';
import { asProse } from './prose';
import { BOARD_PAGES } from './boardPages';

// What an editable page is allowed to contain.
//
// The bodies are HTML and the copy editor can change them, so this is the gate between a trainer's
// edit and the page a learner reads.

describe('a reference page body', () => {
  it('keeps the prose it is made of', () => {
    const out = asProse("<p>A <strong>Product Goal</strong> is a <a href='#product-goal'>commitment</a>.</p><ul><li>One</li></ul>");
    expect(out).toContain('<strong>Product Goal</strong>');
    expect(out).toContain("href=\"#product-goal\"");
    expect(out).toContain('<li>One</li>');
  });

  it('drops a script somebody pasted in', () => {
    const out = asProse('<p>Hello</p><script>alert(1)</script><img src=x onerror="alert(1)">');
    expect(out, 'a script survived an edit').not.toMatch(/script/i);
    expect(out, 'an event handler survived an edit').not.toMatch(/onerror/i);
    expect(out).toContain('<p>Hello</p>');
  });

  it('only lets a link point at another reference page', () => {
    expect(asProse("<a href='javascript:alert(1)'>x</a>"), 'a javascript: link survived').not.toMatch(/javascript:/i);
    expect(asProse("<a href='https://example.com'>x</a>"), 'a link off the page survived').not.toContain('example.com');
    expect(asProse("<a href='#increment'>x</a>"), 'a real cross-link was thrown away').toContain('#increment');
  });

  it('leaves no style or class for an edit to hide behind', () => {
    const out = asProse('<p style="position:fixed;inset:0" class="overlay">x</p>');
    expect(out).not.toMatch(/style=/);
    expect(out).not.toMatch(/class=/);
  });
});

describe('the shipped pages', () => {
  it('all survive the gate unchanged, so nothing we ship is already being stripped', () => {
    for (const p of BOARD_PAGES) {
      for (const [heading, body] of p.secs) {
        const clean = asProse(body);
        // Attribute quoting is normalised by the sanitiser; the words and the links must not be.
        const words = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        expect(words(clean), `${p.id} / ${heading} loses words on the way out`).toBe(words(body));
        const links = (s: string) => [...s.matchAll(/href=['"]([^'"]+)['"]/g)].map((m) => m[1]).sort();
        expect(links(clean), `${p.id} / ${heading} loses a cross-link`).toEqual(links(body));
      }
    }
  });
});
