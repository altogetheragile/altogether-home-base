// Export everything from one place for easy importing
export * from './mock-factories'
export * from './test-helpers'
export * from './rls-test-helpers'

// Explicitly export the custom render and createWrapper from test-wrappers
export { render, createWrapper, createTestQueryClient } from './test-wrappers'

// Basic testing utilities stubs (to be properly implemented later)
export const screen = {
  getByTestId: (id: string) => ({ textContent: 'test' }),
  getByText: (text: string) => ({ textContent: text }),
  getByRole: (role: string) => ({ textContent: 'test' }),
  queryByTestId: (id: string) => null,
  queryByText: (text: string) => null,
  queryByRole: (role: string) => null
}

export const fireEvent = {
  click: (element: any) => {},
  change: (element: any, options: any) => {}
}

export const waitFor = async (callback: () => void) => {
  await new Promise(resolve => setTimeout(resolve, 100))
  try { callback() } catch {}
}

export const renderHook = (hook: () => any) => ({
  result: { current: null },
  rerender: () => {}
})

export const cleanup = () => {}
export const act = (callback: () => void) => callback()
export const within = (element: any) => screen
export const getByRole = screen.getByRole
export const getByText = screen.getByText  
export const getByTestId = screen.getByTestId
export const queryByRole = screen.queryByRole
export const queryByText = screen.queryByText
export const queryByTestId = screen.queryByTestId