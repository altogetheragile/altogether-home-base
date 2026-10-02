import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Prose } from './prose';
import { BOARD_PAGES } from './boardPages';

// The gate between an edit and a public page.
//
// The App sanitises the same prose with DOMPurify and injects it. The Site injects nothing: the
// markup is parsed into elements against a list of what these pages may contain, and anything else
// becomes text. These hold that it keeps what the pages are made of and refuses the rest.

const html = (s: string) => render(<Prose html={s} base="/scrum-on-one-page" />).container;

describe('a reference page body', () => {
  it('keeps the prose it is made of', () => {
    const c = html("<p>A <strong>Product Goal</strong> is a commitment.</p><ul><li>One</li></ul>");
    expect(c.querySelector('strong')?.textContent).toBe('Product Goal');
    expect(c.querySelector('li')?.textContent).toBe('One');
  });

  it('keeps the table the Inspect and Adapt page is built on', () => {
    const c = html("<table><thead><tr><th>Event</th></tr></thead><tbody><tr><td>Sprint</td></tr></tbody></table>");
    expect(c.querySelector('th')?.textContent).toBe('Event');
    expect(c.querySelector('td')?.textContent).toBe('Sprint');
  });

  it('turns a cross-link into a real page, not a hash', () => {
    // On the Site every one of the 28 is a URL of its own, so they can be found and linked to.
    const a = html("<a href='#increment'>the Increment</a>").querySelector('a');
    expect(a?.getAttribute('href'), 'the cross-link does not go anywhere real').toBe('/scrum-on-one-page/increment');
    expect(a?.textContent).toBe('the Increment');
  });

  it('shows a script instead of running one', () => {
    const c = html('<p>Hello</p><script>alert(1)</script>');
    expect(c.querySelector('script'), 'a script element was built').toBeNull();
    expect(c.textContent, 'the words were swallowed instead of shown').toContain('Hello');
  });

  it('refuses a link that leaves the board', () => {
    for (const bad of ["javascript:alert(1)", 'https://example.com', 'mailto:a@b.c', '/admin']) {
      const c = html(`<a href='${bad}'>press me</a>`);
      expect(c.querySelector('a'), `${bad} was made into a link`).toBeNull();
      expect(c.textContent, 'the words were thrown away with the link').toContain('press me');
    }
  });

  it('gives an editable field no class and no style to hide behind', () => {
    const c = html('<p style="position:fixed;inset:0" class="overlay">x</p>');
    expect(c.querySelector('p')?.getAttribute('style')).toBeNull();
    expect(c.querySelector('p')?.getAttribute('class')).toBeNull();
  });

  it('is not fooled by an unclosed tag', () => {
    const c = html('<p>one<p>two');
    expect(c.textContent).toContain('one');
    expect(c.textContent).toContain('two');
  });
});

describe('the pages we ship', () => {
  it('all come through with their words and their links', () => {
    for (const p of BOARD_PAGES) {
      for (const [heading, body] of p.secs) {
        const c = html(body);
        // Spacing aside. Replacing a tag with a space in the source puts one where the DOM has
        // none at an element boundary, so comparing with whitespace in compares the markup rather
        // than the words. What must not change is the words themselves.
        const words = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'").replace(/\s+/g, '').trim();
        expect(words(c.textContent ?? ''), `${p.id} / ${heading} loses words`).toBe(words(body));
        const want = [...body.matchAll(/href='#([a-z0-9-]+)'/g)].map((m) => `/scrum-on-one-page/${m[1]}`);
        const got = [...c.querySelectorAll('a')].map((a) => a.getAttribute('href'));
        expect(got, `${p.id} / ${heading} loses a cross-link`).toEqual(want);
      }
    }
  });
});
