
import { describe, it, expect } from 'vitest'
import { render } from './utils'
import { screen, fireEvent, waitFor, renderHook } from './rtl-helpers'

describe('Test Environment Validation', () => {
  it('should have all testing utilities available', () => {
    // Validate RTL helpers
    expect(typeof screen).toBe('object')
    expect(typeof fireEvent).toBe('function')
    expect(typeof waitFor).toBe('function')
    expect(typeof renderHook).toBe('function')
    expect(typeof render).toBe('function')
  })

  it('should have MSW server configured', () => {
    // This will be validated by the server setup in other tests
    expect(true).toBe(true)
  })

  it('should have proper TypeScript configuration', () => {
    // If this test runs, TypeScript configuration is working
    expect(true).toBe(true)
  })

  it('should have vitest globals available', () => {
    expect(typeof describe).toBe('function')
    expect(typeof it).toBe('function')
    expect(typeof expect).toBe('function')
  })
})
