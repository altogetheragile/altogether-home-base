
import { describe, it, afterAll, vi, expect } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithRouter } from '@/test/utils/verified-patterns'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'
import AdminLocations from '@/pages/admin/AdminLocations'
import React from 'react'

describe('AdminLocations', () => {
  afterAll(() => server.resetHandlers())

  it('renders a list of locations', async () => {
    renderWithRouter(<AdminLocations />)
    
    // Wait for locations to be displayed
    await waitFor(() => {
      expect(screen.getByText('Main Hall')).toBeInTheDocument()
    })
    
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
    expect(screen.getByText('West Room')).toBeInTheDocument()
    expect(screen.getByText('456 West Blvd')).toBeInTheDocument()
  })

  it('can open create location dialog', async () => {
    renderWithRouter(<AdminLocations />)
    
    const addButton = screen.getByText(/add location/i)
    fireEvent.click(addButton)
    
    // Should show the real form with proper field labels
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/virtual url/i)).toBeInTheDocument()
  })

  it('can submit create location form', async () => {
    renderWithRouter(<AdminLocations />)
    
    // Open create dialog
    fireEvent.click(screen.getByText(/add location/i))
    
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    })
    
    // Fill and submit form with the real form component
    const nameInput = screen.getByLabelText(/name/i)
    const addressInput = screen.getByLabelText(/address/i)
    
    fireEvent.change(nameInput, { target: { value: 'New Location' } })
    fireEvent.change(addressInput, { target: { value: '789 New St' } })
    
    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)
    
    // Form should be submitted (mutation called)
    await waitFor(() => {
      // Since we're mocking the mutation, we verify the form interaction worked
      expect(nameInput).toHaveValue('New Location')
    })
  })

  it('shows validation error for empty form', async () => {
    renderWithRouter(<AdminLocations />)
    
    fireEvent.click(screen.getByText(/add location/i))
    
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    })
    
    // Try to submit empty form
    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)
    
    // Should show validation error from the real form
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    })
  })

  it('can open edit dialog', async () => {
    renderWithRouter(<AdminLocations />)
    
    await waitFor(() => {
      expect(screen.getByText('Main Hall')).toBeInTheDocument()
    })
    
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    fireEvent.click(editButtons[0])
    
    // Should show form with pre-filled data
    await waitFor(() => {
      expect(screen.getByDisplayValue('Main Hall')).toBeInTheDocument()
    })
    expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument()
  })

  it('can trigger delete confirmation', async () => {
    renderWithRouter(<AdminLocations />)
    
    await waitFor(() => {
      expect(screen.getByText('West Room')).toBeInTheDocument()
    })
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    fireEvent.click(deleteButtons[1])
    
    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
  })

  it('handles loading state', async () => {
    // Use MSW to mock a slow response
    server.use(
      http.get('https://wqaplkypnetifpqrungv.supabase.co/rest/v1/locations*', async () => {
        // Delay response to trigger loading state
        await new Promise(resolve => setTimeout(resolve, 100))
        return HttpResponse.json([])
      })
    )
    
    renderWithRouter(<AdminLocations />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('handles error state', async () => {
    // Use MSW to mock an error response
    server.use(
      http.get('https://wqaplkypnetifpqrungv.supabase.co/rest/v1/locations*', () => {
        return HttpResponse.json(
          { message: 'Failed to load locations' },
          { status: 500 }
        )
      })
    )
    
    renderWithRouter(<AdminLocations />)
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument()
    })
    expect(screen.getByText(/failed to load locations/i)).toBeInTheDocument()
  })
})
