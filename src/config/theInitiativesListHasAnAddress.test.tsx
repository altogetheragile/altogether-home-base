import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, useLocation } from 'react-router-dom';
import { ProtectedUserRoutes } from './routes';

// Dogfooding the PO route, /projects gave Page Not Found: the list of initiatives lives on a
// dashboard tab and nothing answered the address people guess for it.

vi.mock('@/components/SiteSettingsRouteGuard', () => ({
  SiteSettingsRouteGuard: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/components/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const Where = () => {
  const l = useLocation();
  return <p data-testid="at">{l.pathname + l.search}</p>;
};

const landAt = (from: string) => {
  const { getByTestId } = render(
    <MemoryRouter initialEntries={[from]}>
      <Routes>{ProtectedUserRoutes()}</Routes>
      <Where />
    </MemoryRouter>,
  );
  return getByTestId('at').textContent;
};

describe('the initiatives list has an address', () => {
  it.each(['/projects', '/initiatives'])('%s opens the Initiatives tab', (from) => {
    expect(landAt(from)).toBe('/dashboard?tab=projects');
  });
});
