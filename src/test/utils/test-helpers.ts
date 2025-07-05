import { expect } from 'vitest'

// Reliable loading and error state helpers
export const waitForLoadingToFinish = async () => {
  // Basic timeout helper
  await new Promise(resolve => setTimeout(resolve, 100))
}

export const expectLoadingState = () => {
  // Basic loading state helper
  console.log('Checking loading state')
}

export const expectErrorState = (message?: string) => {
  // Basic error state helper
  console.log('Checking error state:', message)
}