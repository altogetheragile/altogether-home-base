
// Export everything from one place for easy importing
export * from './mock-factories'
export * from './test-helpers'

// Explicitly export the custom render and createWrapper from test-wrappers
export { render, createWrapper, createTestQueryClient } from './test-wrappers'

// Re-export testing library utilities (excluding render to avoid conflict)
export {
  screen,
  fireEvent,
  waitFor,
  renderHook,
  cleanup,
  act,
  within,
  getByRole,
  getByText,
  getByTestId,
  queryByRole,
  queryByText,
  queryByTestId
} from '@testing-library/react'
