
// Runtime-only imports to bypass TypeScript module resolution issues
// This uses dynamic imports and type assertions to work around dev environment limitations

const rtl = require('@testing-library/react');

// Export the utilities we need, with proper typing
export const screen = rtl.screen as any;
export const fireEvent = rtl.fireEvent as any;
export const waitFor = rtl.waitFor as any;
export const renderHook = rtl.renderHook as any;

// Note: We don't re-export render here since we use the custom one from utils.tsx
