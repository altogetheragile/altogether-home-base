import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';

vi.mock('@/hooks/useUserRole', () => ({ useUserRole: () => ({ data: 'admin' }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'someone' } }) }));

import { DialEditor } from './DialEditor';
import { DIALS } from './tuning';

// What a trainer sees when they go to turn the numbers.
//
// Admin-only, and in the game rather than in an admin screen, for the same reason the copy editor
// is: the person who wants ground to be dearer is the person running the workshop, at the moment a
// group has found it too cheap.

describe('the dials panel', () => {
  it('offers every dial, with what turning it changes', () => {
    const { container } = render(<DialEditor overrides={{}} onChanged={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Numbers/ }));
    const panel = container.querySelector('[data-part="dial-editor"]')!;
    expect(panel, 'the panel did not open').toBeTruthy();
    for (const d of DIALS) {
      expect(panel.textContent, `${d.label} is not offered`).toContain(d.label);
      expect(panel.textContent, `${d.label} does not say what turning it changes`).toContain(d.hint.slice(0, 40));
    }
  });

  it('says what is deliberately not a dial', () => {
    // The absence is the design, and somebody will otherwise go looking for the switch.
    const { container } = render(<DialEditor overrides={{}} onChanged={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Numbers/ }));
    expect(container.querySelector('[data-part="dial-editor"]')!.textContent)
      .toMatch(/no dials for the lessons/i);
  });

  it('shows a turned dial against what the game shipped with', () => {
    const { container } = render(
      <DialEditor overrides={{ 'tune.ground.price': '2400' }} onChanged={() => {}} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Numbers/ }));
    const row = container.querySelector('[data-key="tune.ground.price"]')!;
    expect(row.textContent, 'a turned dial does not say what it was').toMatch(/shipped at/i);
    expect((row.querySelector('input') as HTMLInputElement).value).toBe('2400');
    expect(row.textContent, 'there is no way back to the shipped number').toMatch(/Reset/);
  });

  it('is not there for somebody who is not an admin', async () => {
    vi.resetModules();
    vi.doMock('@/hooks/useUserRole', () => ({ useUserRole: () => ({ data: 'user' }) }));
    const { DialEditor: Gated } = await import('./DialEditor');
    const { container } = render(<Gated overrides={{}} onChanged={() => {}} />);
    expect(container.textContent, 'a learner was offered the game’s own dials').toBe('');
  });
});
