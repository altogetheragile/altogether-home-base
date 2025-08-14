import '@testing-library/jest-dom'

// Mock clipboard API globally for tests
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

// Declare vi globally for test setup
declare global {
  const vi: any;
}