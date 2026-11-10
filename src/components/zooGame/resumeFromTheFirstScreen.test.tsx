import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { BeforeYouStart } from './BeforeYouStart';

// "Move the resume saved game button or a copy of it the initial screen." It was only on the
// Product Goal screen, the second one in, so coming back to a game meant stepping past the first.

const inRouter = (ui: ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>).container;

describe('resuming a saved game', () => {
  it('is offered on the first screen, and opens the saved games', () => {
    const onOpenSaves = vi.fn();
    const c = inRouter(<BeforeYouStart tab="scrum" onTab={() => {}} onDone={() => {}} onOpenSaves={onOpenSaves} />);
    const resume = c.querySelector('[data-part="resume-saved"]');
    expect(resume, 'the first screen has no way back into a saved game').toBeTruthy();
    fireEvent.click(resume!);
    expect(onOpenSaves).toHaveBeenCalled();
  });

  it('is not offered to somebody with nothing to resume', () => {
    // Signed out, there are no saved games, and the page decides that by passing nothing.
    const c = inRouter(<BeforeYouStart tab="scrum" onTab={() => {}} onDone={() => {}} />);
    expect(c.querySelector('[data-part="resume-saved"]')).toBeNull();
  });
});
