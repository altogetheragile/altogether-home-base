
import { describe, it, expect } from 'vitest'
import { render } from './utils'
import { screen, fireEvent, waitFor } from '@testing-library/react'

describe('Testing Library Import Sanity Check', () => {
  it('should successfully import screen, fireEvent, and waitFor', () => {
    expect(typeof screen).toBe('object')
    expect(typeof fireEvent).toBe('function')
    expect(typeof waitFor).toBe('function')
    expect(typeof render).toBe('function')
  })
})
