import { createContext, useContext, ReactNode } from 'react';
import { getScheme, PrioritisationScheme, SchemeId } from '@/config/prioritisationSchemes';

// The active prioritisation scheme for the backlog, provided by the backlog page
// so the edit dialog and cards can render the right priority UI without threading
// the scheme through every component. Defaults to simple.
const SchemeContext = createContext<SchemeId>('simple');

export function SchemeProvider({ scheme, children }: { scheme: SchemeId; children: ReactNode }) {
  return <SchemeContext.Provider value={scheme}>{children}</SchemeContext.Provider>;
}

export function useActiveScheme(): PrioritisationScheme {
  return getScheme(useContext(SchemeContext));
}
