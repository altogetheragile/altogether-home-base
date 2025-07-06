
import { describe, it, beforeEach, vi, expect } from 'vitest'
import { createWrapper } from '@/test/utils/test-wrappers'
import { render as rtlRender, screen } from '@testing-library/react'
import AdminLayout from '@/components/admin/AdminLayout'
import React from 'react'

// Mock for Navigation to avoid router conflicts
vi.mock('@/components/Navigation', () => ({
  __esModule: true,
  default: () => <nav data-testid="mock-nav">MockNav</nav>
}))

// Mock for Outlet to avoid nested router issues
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    Outlet: () => <div data-testid="mock-outlet">Mock Outlet Content</div>
  }
})

describe('AdminLayout Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderAt(route: string) {
    // Use createWrapper with skipRouter to avoid nested router conflicts
    return rtlRender(<AdminLayout />, {
      wrapper: createWrapper({ skipRouter: true })
    })
  }

  it('renders sidebar navigation links', () => {
    renderAt('/admin/events')
    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
    expect(screen.getByText('Events')).toBeInTheDocument()
    expect(screen.getByText('Instructors')).toBeInTheDocument()
    expect(screen.getByText('Locations')).toBeInTheDocument()
    expect(screen.getByText('Templates')).toBeInTheDocument()
  })

  it('highlights the active sidebar link', () => {
    renderAt('/admin/events')
    const eventsLink = screen.getByText('Events').closest('a')
    expect(eventsLink).toHaveClass('bg-primary')
  })

  it('renders main content area (Outlet)', () => {
    renderAt('/admin/events')
    expect(screen.getByTestId('mock-outlet')).toBeInTheDocument()
  })
})
