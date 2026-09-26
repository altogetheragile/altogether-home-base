import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ctaHref, ctaWasRedirected } from './cta';

// The label on a call to action was editable and its destination was not, so a site with Events
// switched off kept a hero button reading "Browse Events" pointing at /events, which answers Not
// Found to everybody but an administrator. The main action on the home page was a dead link, and
// nothing in the editor could move it.

const on = (...names: string[]) => Object.fromEntries(names.map((n) => [`show_${n}`, true]));
const off = (...names: string[]) => Object.fromEntries(names.map((n) => [`show_${n}`, false]));

describe('a button points somewhere that exists', () => {
  it('goes where it was told when that page is switched on', () => {
    expect(ctaHref('events', on('events'))).toBe('/events');
    expect(ctaHref('coaching', on('coaching'))).toBe('/coaching');
    expect(ctaHref('about', on('about'))).toBe('/about');
  });

  it('goes somewhere else rather than to Not Found', () => {
    // The exact failure: events off, button still addressing /events.
    expect(ctaHref('events', { ...off('events'), ...on('contact') })).toBe('/contact');
  });

  it('keeps falling through until it finds something that answers', () => {
    expect(ctaHref('events', { ...off('events', 'contact'), ...on('coaching') })).toBe('/coaching');
    expect(ctaHref('events', { ...off('events', 'contact', 'coaching'), ...on('about') })).toBe('/about');
  });

  it('never returns nothing, whatever is switched off', () => {
    // Nothing switches off the front door, so there is always one answer left.
    expect(ctaHref('events', off('events', 'contact', 'coaching', 'about'))).toBe('/');
    expect(ctaHref('anything-unknown', {})).toBeTruthy();
    expect(ctaHref(null, on('events'))).toBe('/events');
    expect(ctaHref('   ', on('events'))).toBe('/events');
  });

  it('sends a booking button where bookings already went', () => {
    // bookingHref has sent people to the contact page when bookings are off since long before
    // this existed, and that is still the right answer.
    expect(ctaHref('booking', on('bookings'))).toBe('/book/chemistry-session');
    expect(ctaHref('booking', off('bookings'))).toBe('/contact');
  });

  it('says when somebody will not get the page they chose', () => {
    // A working link that says the wrong thing is still wrong: "Browse Events" pointing at the
    // contact page needs the owner to know, not to be quietly corrected.
    expect(ctaWasRedirected('events', on('events'))).toBe(false);
    expect(ctaWasRedirected('events', off('events'))).toBe(true);
    expect(ctaWasRedirected('booking', off('bookings'))).toBe(true);
  });

  it('is used by every call to action on the home page', () => {
    // The whole defect was one page addressing a route directly. A second one would be the same
    // bug again, found the same slow way.
    const page = readFileSync('src/app/page.tsx', 'utf8');
    expect(page, 'a link still addresses /events directly').not.toMatch(/href="\/events"/);
    expect(page).toContain('ctaHref');
  });
});
