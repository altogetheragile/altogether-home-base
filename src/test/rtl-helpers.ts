
// Explicitly re-export only known-good parts of RTL
// This bypasses TypeScript's module resolution issues
import * as rtl from '@testing-library/react'

export const screen = rtl.screen
export const fireEvent = rtl.fireEvent
export const waitFor = rtl.waitFor
export const renderHook = rtl.renderHook

// Note: We don't re-export render here since we use the custom one from utils.tsx
