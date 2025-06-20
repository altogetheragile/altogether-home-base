
import { authHandlers } from './authHandlers'
import { eventHandlers } from './eventHandlers'
import { locationHandlers } from './locationHandlers'
import { profileHandlers } from './profileHandlers'
import { instructorHandlers } from './instructorHandlers'
import { edgeHandlers } from './edgeHandlers'
import { errorHandlers } from './errorHandlers'

export const handlers = [
  ...authHandlers,
  ...eventHandlers,
  ...locationHandlers,
  ...profileHandlers,
  ...instructorHandlers,
  ...edgeHandlers,
  ...errorHandlers
]
