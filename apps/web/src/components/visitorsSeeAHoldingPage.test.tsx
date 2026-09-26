import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { HoldingPage } from './HoldingPage';
import type { SiteSettings } from '@/lib/site-settings';

// A site is public the moment its domain resolves, long before anybody has written its words. The
// second site spent a day reachable with stats called "Stat 1", an inherited headline, a footer
// tagline describing another business, and a primary button pointing at a 404. The only
// alternative was taking the domain down, which also takes down the editor it is finished in.

const settings = (over: Partial<SiteSettings> = {}) =>
  ({ company_name: 'Stream Strategy', brand: {}, ...over }) as SiteSettings;

describe('the holding page', () => {
  it('says the one thing it is there to say', () => {
    render(<HoldingPage settings={settings()} heading="Something is on its way" body="Do come back soon." />);
    expect(screen.getByRole('heading', { name: 'Something is on its way' })).toBeTruthy();
    expect(screen.getByText('Do come back soon.')).toBeTruthy();
  });

  it('looks like the business rather than like a building site', () => {
    // Its own name, not a placeholder. A visitor who lands here should know whose site it is.
    render(<HoldingPage settings={settings()} heading="Soon" body="" />);
    expect(screen.getByText('Stream Strategy')).toBeTruthy();
  });

  it('offers a way through to somebody who needs them today', () => {
    render(<HoldingPage settings={settings({ contact_email: 'fiona@streamstrategy.co.uk' })} heading="Soon" body="" />);
    const link = screen.getByRole('link', { name: 'fiona@streamstrategy.co.uk' });
    expect(link.getAttribute('href')).toBe('mailto:fiona@streamstrategy.co.uk');
  });

  it('offers nothing rather than an empty mailto when no address is set', () => {
    const { container } = render(<HoldingPage settings={settings()} heading="Soon" body="" />);
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
  });

  it('leaves out the message rather than showing a gap', () => {
    const { container } = render(<HoldingPage settings={settings()} heading="Soon" body="   " />);
    expect(container.querySelectorAll('p').length).toBe(0);
  });

  /** It shipped reading its words from the navigation registry, which has no site.construction
   *  keys, so both came back empty. An empty h1 renders as nothing: the live page was a logo, a
   *  button, and silence between them, for as long as it took somebody to look at it. */
  it('says something even when it is handed nothing', () => {
    render(<HoldingPage settings={settings()} heading="" body="" />);
    expect(screen.getByRole('heading').textContent?.trim()).toBeTruthy();
  });

  it('reads its words from the registry that actually holds them', () => {
    const layout = readFileSync('src/app/layout.tsx', 'utf8');
    // `t` on that line is getCopy('navigation'). The site words are a separate reader.
    expect(layout).toMatch(/heading=\{siteWords\('site\.construction\.heading'\)\}/);
    expect(layout).toMatch(/body=\{siteWords\('site\.construction\.body'\)\}/);
  });
});

describe('who sees it', () => {
  const layout = readFileSync('src/app/layout.tsx', 'utf8');

  it('shows it to everybody except an administrator', () => {
    // An administrator always gets the real site: a site being finished has to be lookable at,
    // and that is also what makes this safe to leave on, since whoever can turn it off can
    // already see past it.
    expect(layout).toMatch(/const holding = !!settings\.under_construction && !admin/);
  });

  it('keeps the editor mounted behind it, or there is no way to switch it off', () => {
    const afterGate = layout.slice(layout.indexOf('holding ?'));
    expect(afterGate).toContain('<EditThisPage');
    // Outside the branch, so it renders in both states.
    expect(afterGate.indexOf('<EditThisPage')).toBeGreaterThan(afterGate.indexOf('</>'));
  });

  it('tells the one person who cannot see it that nobody else can', () => {
    // Otherwise it is switched on once and forgotten, and the site is quietly invisible.
    expect(layout).toMatch(/admin && settings\.under_construction/);
  });

  it('asks not to be indexed while it is up', () => {
    // A crawler is never an administrator, and a half-written page indexed once is hard to undo.
    expect(layout).toMatch(/under_construction \? \{ robots: \{ index: false/);
  });
});
