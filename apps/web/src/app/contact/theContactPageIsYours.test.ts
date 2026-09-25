import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import contact from '@/lib/copy/contact.json';

// The page whose whole purpose is telling somebody how to reach you had this site's email address
// written into it as a constant, along with a city and a description of a call. The footer read
// contact_email from site_settings all along, so a second site showed its own address at the
// bottom of the page and ours at the top.

const source = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('the contact page uses this site’s own details', () => {
  it('has no address, phone number or place written into it', () => {
    expect(source).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(source).not.toMatch(/London/);
    // A tel: or mailto: with anything after it is a number or address in the source.
    expect(source).not.toMatch(/(mailto|tel):[^`$]/);
  });

  it('reads each of them from the settings the footer already reads', () => {
    for (const key of ['contact_email', 'contact_phone', 'contact_location']) {
      expect(source, `the page never looks at ${key}`).toContain(`settings.${key}`);
    }
  });

  it('leaves a card out rather than showing it empty', () => {
    // A site with no phone number should have no phone card, not one saying "Phone" and nothing.
    expect(source).toMatch(/c\.value \?/);
  });

  it('does not lay the cards out as though there were always three', () => {
    // A fixed three-column grid leaves a hole the moment a card is omitted.
    expect(source).not.toMatch(/grid-template-columns:\s*repeat\(3,/);
    expect(source).toMatch(/auto-fit/);
  });

  it('lets the headings and the booking line be edited', () => {
    const keys = Object.keys((contact as { entries: Record<string, unknown> }).entries);
    for (const k of ['email', 'phone', 'location', 'booking', 'bookingNote']) {
      expect(keys, `contact.cards.${k} is not editable`).toContain(`contact.cards.${k}`);
    }
  });

  it('says in the email card’s hint where the address actually comes from', () => {
    // Otherwise somebody edits the heading, looks for a box to type the address into, and finds
    // none, because it lives on a different tab.
    const entries = (contact as { entries: Record<string, { hint: string }> }).entries;
    expect(entries['contact.cards.email'].hint).toMatch(/This Site/);
  });
});
