import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Calendar } from './calendar';

// The calendar was styled with react-day-picker v8's class keys while the app runs v9, which
// ignores them: the weekday names bunched up apart from the day numbers, and both arrows
// pointed left (23 Oct 2026, /book/chemistry-session).
describe('The calendar lines up', () => {
  it('lays the weekday names out in the same 2.25rem columns as the days', () => {
    const { container } = render(<Calendar mode="single" month={new Date(2026, 9, 1)} />);
    const weekdays = container.querySelectorAll('th');
    expect(weekdays).toHaveLength(7);
    weekdays.forEach((th) => expect(th.className).toContain('w-9'));
    expect(weekdays[0].parentElement?.className).toContain('flex');
    container.querySelectorAll('td').forEach((td) => expect(td.className).toContain('w-9'));
  });

  it('points the next-month arrow right', () => {
    render(<Calendar mode="single" month={new Date(2026, 9, 1)} />);
    const next = screen.getByRole('button', { name: /next month/i });
    expect(next.querySelector('svg')?.getAttribute('class')).toContain('lucide-chevron-right');
    const prev = screen.getByRole('button', { name: /previous month/i });
    expect(prev.querySelector('svg')?.getAttribute('class')).toContain('lucide-chevron-left');
  });
});
