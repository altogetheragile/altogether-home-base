
import { describe, it, beforeEach, vi, expect } from 'vitest'
import { renderWithRouter } from '@/test/utils/verified-patterns'
import { screen } from '@testing-library/react'
import AdminLayout from '@/components/admin/AdminLayout'
import React from 'react'

// Mock for Navigation
vi.mock('@/components/Navigation', () => ({
  __esModule: true,
  default: () => <nav data-testid="mock-nav">MockNav</nav>
}));

describe('AdminLayout Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderAt(route: string) {
    // AdminLayout needs router context - provide it properly
    return renderWithRouter(<AdminLayout />, { initialEntries: [route] });
  }

  it('renders sidebar navigation links', () => {
    renderAt('/admin/events');
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Instructors')).toBeInTheDocument();
    expect(screen.getByText('Locations')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('highlights the active sidebar link', () => {
    renderAt('/admin/events');
    const eventsLink = screen.getByText('Events').closest('a');
    expect(eventsLink).toHaveClass('bg-primary');
    // Switch to another route
    renderAt('/admin/templates');
    const templatesLink = screen.getByText('Templates').closest('a');
    expect(templatesLink).toHaveClass('bg-primary');
  });

  it('renders main content area (Outlet)', () => {
    renderAt('/admin/events');
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    // Main content rendered via Outlet
  });
});
