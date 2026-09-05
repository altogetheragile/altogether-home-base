import { createContext, useContext, useEffect, type ReactNode } from 'react';

// What the game has to say, and where it stands to say it. The pieces that are not components, in
// their own file: a hook exported beside a component is a file fast refresh cannot reload.

export type GameNote = {
  id: string;
  title: string;
  /** Who is talking, not how urgent it is - the refusals are the teaching, not warnings. */
  tone?: 'rule' | 'team' | 'coach';
  body: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
};

export type NotesCtx = { notes: GameNote[]; mount: () => void; unmount: () => void };

export const NotesContext = createContext<NotesCtx>({ notes: [], mount: () => {}, unmount: () => {} });

export const useGameNotes = () => useContext(NotesContext);

/** An action bar tells the dock it exists, so the notes go in its pill rather than in one of
 *  their own beside it. */
export function useDockPresence() {
  const { mount, unmount } = useGameNotes();
  useEffect(() => { mount(); return unmount; }, [mount, unmount]);
}

/** Where the dock stands. One place, every screen: bottom right, whatever screen you are on. */
export const DOCK_POSITION = 'fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] justify-end';
/** The pill itself - the action bar and the notes-only fallback are the same shape. */
export const DOCK_PILL = 'pointer-events-auto flex items-center gap-3 rounded-full border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur';
