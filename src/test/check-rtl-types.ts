
import * as rtl from '@testing-library/react'

console.log({
  hasScreen: typeof rtl.screen,
  hasFireEvent: typeof rtl.fireEvent,
  hasWaitFor: typeof rtl.waitFor,
  hasRender: typeof rtl.render,
})

// This file helps diagnose TypeScript's ability to resolve RTL exports
export {}
