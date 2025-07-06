import React from 'react'
import { render as rtlRender } from '@testing-library/react'

// ✅ VERIFIED PATTERN 1: Simple Component Test (No Context)
// Use this for components that don't need QueryClient, Router, or Auth context
export const renderSimpleComponent = (ui: React.ReactElement) => {
  return rtlRender(ui)
}