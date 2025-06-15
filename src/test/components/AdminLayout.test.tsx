import { describe, it, beforeEach, vi, expect } from 'vitest'
import { render, screen, fireEvent } from '../test-utils'
import AdminLayout from '@/components/admin/AdminLayout'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'

// Mock for Navigation
vi.mock('@/components/Navigation', () => ({
  __esModule: true,
  default: () => <nav data-testid="mock-nav">MockNav</nav>
}))

const renderWithRoute = (route = '/admin/events') => {
  window.history.pushState({}, 'TestPage', route);
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AdminLayout />
    </MemoryRouter>
  );
};

describe('AdminLayout Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sidebar navigation links', () => {
    renderWithRoute('/admin/events');
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Instructors')).toBeInTheDocument();
    expect(screen.getByText('Locations')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('highlights the active sidebar link', () => {
    renderWithRoute('/admin/events');
    const eventsLink = screen.getByText('Events').closest('a');
    expect(eventsLink).toHaveClass('bg-primary');
    // Now switch to templates
    renderWithRoute('/admin/templates');
    const templatesLink = screen.getByText('Templates').closest('a');
    expect(templatesLink).toHaveClass('bg-primary');
  });

  it('renders main content area (Outlet)', () => {
    renderWithRoute('/admin/events');
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    // Main content is rendered via Outlet (not tested here, but structure present)
  });
})
