import { createContext, useContext } from 'react';

// Who is looking at this screen, as a team member.
//
// Alone it is nobody in particular, and every screen falls back to the first Developer as it always
// has. In a shared game it is the player at this browser, so "you" on the rail, the band, the
// stand-up and the thread is them and not Ada. The reducer has its own way of knowing (`asMember`),
// because it runs on every browser; this is the screen's.
export const YouContext = createContext<string | null>(null);

/** The member id of whoever is looking, or null playing alone. */
export const useYou = (): string | null => useContext(YouContext);
