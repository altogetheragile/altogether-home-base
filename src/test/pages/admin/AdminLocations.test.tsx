
import { describe, it, beforeEach, afterAll, vi, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../test-utils'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'
import AdminLocations from '@/pages/admin/AdminLocations'
import React from 'react'

// Define Location type for strong typing
type Location = {
  id: string
  name: string
  address: string
  virtual_url: string
}

// Mock data
const mockLocations = [
  { id: 'loc-1', name: 'Main Hall', address: '123 Main St', virtual_url: 'https://zoom.com/main' },
  { id: 'loc-2', name: 'West Room', address: '456 West Blvd', virtual_url: '' },
];

// Helper to set up successful GET
function mockGetLocations() {
  server.use(
    http.get(/\/locations/, () => HttpResponse.json(mockLocations))
  )
}
function mockCreateLocation(newLocation: { name: string; address: string; virtual_url: string }) {
  server.use(
    http.post(/\/locations/, async ({ request }) => {
      const body = await request.json()
      return HttpResponse.json(Object.assign({}, body, { id: 'loc-3' }))
    }),
    http.get(/\/locations/, () => {
      // Use concat to append new location cleanly
      return HttpResponse.json(
        mockLocations.concat([Object.assign({}, newLocation, { id: 'loc-3' })])
      )
    })
  )
}

function mockEditLocation(
  editId: string,
  updated: { name: string; address: string; virtual_url: string }
) {
  server.use(
    http.patch(/\/locations\/.*/, async ({ request }) => {
      const body = await request.json()
      return HttpResponse.json(Object.assign({}, body, { id: editId }))
    }),
    http.get(/\/locations/, () => {
      // Use filter + concat to update mockLocations cleanly
      return HttpResponse.json(
        mockLocations
          .filter(l => l.id !== editId)
          .concat([Object.assign({}, updated, { id: editId })])
      )
    })
  )
}

function mockDeleteLocation(deleteId: string) {
  server.use(
    http.delete(/\/locations\/.*/, () => HttpResponse.json({ success: true })),
    http.get(/\/locations/, () =>
      HttpResponse.json(mockLocations.filter(l => l.id !== deleteId))
    )
  )
}

describe('AdminLocations (TDD First - Failing)', () => {
  afterAll(() => server.resetHandlers())

  it('shows loading spinner', async () => {
    // By not mocking GET, loading will show
    render(<AdminLocations />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders a list of locations', async () => {
    mockGetLocations()
    render(<AdminLocations />)
    for (const l of mockLocations) {
      await waitFor(() => expect(screen.getByText(l.name)).toBeInTheDocument())
      expect(screen.getByText(l.address)).toBeInTheDocument()
    }
  })

  it('can open and submit create location form', async () => {
    mockGetLocations()
    render(<AdminLocations />)
    fireEvent.click(screen.getByText(/add location/i))
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'My Test Loc' } })
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '789 New' } })
    fireEvent.change(screen.getByLabelText(/virtual url/i), { target: { value: 'https://example.com/' } })
    mockCreateLocation({ name: 'My Test Loc', address: '789 New', virtual_url: 'https://example.com/' })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(screen.getByText('My Test Loc')).toBeInTheDocument())
  })

  it('shows validation error if form fields missing', async () => {
    mockGetLocations()
    render(<AdminLocations />)
    fireEvent.click(screen.getByText(/add location/i))
    // Don't fill required fields
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() =>
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    )
  })

  it('can edit a location', async () => {
    mockGetLocations()
    render(<AdminLocations />)
    await waitFor(() => expect(screen.getByText('Main Hall')).toBeInTheDocument())
    // Instead of using exact: false, grab all edit buttons and pick the first for edit
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    fireEvent.click(editButtons[0])
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Main Hall Updated' } })
    mockEditLocation('loc-1', { name: 'Main Hall Updated', address: '123 Main St', virtual_url: 'https://zoom.com/main' })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(screen.getByText('Main Hall Updated')).toBeInTheDocument())
  })

  it('can delete a location with confirmation', async () => {
    mockGetLocations()
    render(<AdminLocations />)
    await waitFor(() => expect(screen.getByText('West Room')).toBeInTheDocument())
    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[1])
    // Simulate confirm dialog
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    mockDeleteLocation('loc-2')
    await waitFor(() => expect(screen.queryByText('West Room')).not.toBeInTheDocument())
  })

  it('handles fetch error gracefully', async () => {
    server.use(http.get(/\/locations/, () => HttpResponse.error()))
    render(<AdminLocations />)
    await waitFor(() => expect(screen.getByTestId('error-message')).toBeInTheDocument())
  })
})
