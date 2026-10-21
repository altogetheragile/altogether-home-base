import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { credit, creditRules } from './quoteCredit';

// The three switches on the Testimonials tab were read by the testimonials page alone. The strip
// on the home and coaching pages and the quotes on the about page named everybody in full, so
// turning names off to keep quotes anonymous left them published on three other pages.

const q = { first_name: 'Jane', last_name: 'Smith', job_title: 'Delivery Lead', company: 'Acme' };

describe('quotes follow the switches', () => {
  it('names somebody in full, with where they work, by default', () => {
    expect(credit(q, creditRules({}))).toEqual({ name: 'Jane Smith', role: 'Delivery Lead · Acme' });
  });

  it('names nobody when names are off', () => {
    expect(credit(q, creditRules({ show_testimonial_name: false })).name).toBe('');
  });

  it('uses the first name alone when asked to', () => {
    expect(credit(q, creditRules({ show_testimonial_first_name_only: true })).name).toBe('Jane');
  });

  it('keeps the job title but not the company when the company is off', () => {
    expect(credit(q, creditRules({ show_testimonial_company: false })).role).toBe('Delivery Lead');
  });

  it('is used by every page that quotes somebody', () => {
    // A page that reads the switches itself is a page that can forget one.
    const root = join(__dirname, '..', 'app');
    for (const file of ['HomeTestimonials.tsx', 'about/page.tsx', 'testimonials/TestimonialsGrid.tsx']) {
      expect(readFileSync(join(root, file), 'utf8'), file).toContain("from '@/lib/quoteCredit'");
    }
  });
});
