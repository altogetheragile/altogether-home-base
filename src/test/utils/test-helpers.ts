
import { screen, waitFor } from '@testing-library/react'
import { expect } from 'vitest'

// Reliable loading and error state helpers
export const waitForLoadingToFinish = async () => {
  // Wait for loading spinner to disappear
  await waitFor(() => {
    expect(screen.queryByTestId('loading-spinner')).toBeNull()
  })
}

export const expectLoadingState = () => {
  expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
}

export const expectErrorState = (message?: string) => {
  const errorElement = screen.getByTestId('error-message')
  expect(errorElement).toBeInTheDocument()
  if (message) {
    expect(errorElement).toHaveTextContent(message)
  }
}
