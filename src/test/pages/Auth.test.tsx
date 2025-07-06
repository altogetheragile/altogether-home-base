
import { describe, it, expect, vi, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithRouter } from '@/test/utils/verified-patterns'
import Auth from '@/pages/Auth'
import { server } from '../mocks/server'
import React from 'react'

const mockNavigate = vi.fn()
const mockSignIn = vi.fn()
const mockSignUp = vi.fn()

// Mock Radix UI Tabs to avoid async rendering issues
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue, ...props }: any) => (
    <div data-testid="tabs-root" data-default-value={defaultValue} {...props}>{children}</div>
  ),
  TabsList: ({ children, ...props }: any) => (
    <div data-testid="tabs-list" {...props}>{children}</div>
  ),
  TabsTrigger: ({ children, value, ...props }: any) => (
    <button
      role="tab"
      data-testid={`tab-trigger-${value}`}
      onClick={() => {
        const event = new CustomEvent('tabChange', { detail: { value } });
        document.dispatchEvent(event)
      }}
      {...props}
    >
      {children}
    </button>
  ),
  TabsContent: ({ children, value, ...props }: any) => (
    <div data-testid={`tab-content-${value}`} {...props}>{children}</div>
  ),
}))

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null })
  }
})

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})
afterAll(() => server.close())

describe('Auth Page Integration', () => {
  beforeEach(() => {
    mockSignIn.mockResolvedValue({ error: null })
    mockSignUp.mockResolvedValue({ error: null })
  })

  it('should sign in with valid credentials', async () => {
    renderWithRouter(<Auth />)

    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    const signInButton = screen.getByTestId('signin-submit-button')
    fireEvent.click(signInButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('should sign up a new user', async () => {
    renderWithRouter(<Auth />)

    // Switch to sign up tab
    const signUpTrigger = screen.getByTestId('tab-trigger-signup')
    fireEvent.click(signUpTrigger)
    // Fill the form
    const fullNameInput = screen.getByTestId('fullname-input')
    const emailInput = screen.getByTestId('email-signup-input')
    const passwordInput = screen.getByTestId('password-signup-input')
    fireEvent.change(fullNameInput, { target: { value: 'New User' } })
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
    const signUpButton = screen.getByTestId('signup-submit-button')
    fireEvent.click(signUpButton)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('newuser@example.com', 'newpassword123', 'New User')
    })
  })
})
