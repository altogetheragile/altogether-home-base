import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/** The mark, and the way back to the site it belongs to.
 *
 *  It was a bar of its own above the strip, then a wordmark and an email address inside it. The mark
 *  does the wordmark's job in a fifth of the room and says whose game this is, so it is the mark and
 *  nothing else - and it is the link home, which is the only thing anybody ever clicked it for.
 *
 *  Its own file rather than the page's, because the shell renders it and the page renders the shell:
 *  taking it from the page would be a circle, and a circular import of a component is the kind that
 *  fails as a blank screen rather than as an error.
 */
export function GameLinks({ variant = 'mark' }: {
  /** `mark` is the strip's one glyph; `home` is the same link with its name beside it, for the
   *  screens that have room for a word; `menu` is the row inside the game menu, where signing in
   *  belongs - it is done once, and it is not part of playing. */
  variant?: 'mark' | 'home' | 'menu';
}) {
  // Only the menu row knows about who is signed in, and it is its own component so that knowing
  // costs nothing anywhere else. `useAuth` used to be called at the top of this function for all
  // three variants, so the mark in the board's strip - a link to "/" with no opinion about anybody
  // - could not be rendered outside an AuthProvider.
  if (variant === 'menu') return <WhoIsPlaying />;
  // The same link, said in words as well as in the mark.
  //
  // Reported while looking at the way in: "how can I navigate to / from the game - there is no
  // header at all." The board has this mark in its strip and the two screens BEFORE the board had
  // nothing whatever: no strip, no header, no link. A player who opened the game and decided not to
  // play had the browser's back button and nothing the page offered.
  //
  // A bare 皆 is the right size for the strip and the wrong thing to be somebody's only way out: it
  // says whose game this is, and it does not say "this is the way back". Where there is room for
  // the name there is room to be understood, so the way-in screens get both.
  if (variant === 'home') {
    return (
      <Link to="/" data-part="way-home" title="Back to Altogether Agile"
        className="flex shrink-0 items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground">
        {/* The mark and its name, and no arrow. It had one, and the Product Goal screen puts this
            beside "&larr; How the zoo works" - two back-arrows in a row, one leaving the game and one
            moving about inside it, which is two different journeys drawn as the same gesture. A
            wordmark at the top left is already understood to be the way home. */}
        <span className="text-base font-bold leading-none">皆</span>
        <span className="text-[11px] font-semibold">Altogether Agile</span>
      </Link>
    );
  }
  return (
    <Link to="/" aria-label="Back to Altogether Agile" title="Back to Altogether Agile"
      className="shrink-0 select-none text-lg font-bold leading-none opacity-90 transition-opacity hover:opacity-100">
      皆
    </Link>
  );
}

/** Signed in as whom, or the way to be. Inside the game menu, because signing in is done once and
 *  is not part of playing. */
function WhoIsPlaying() {
  const { user } = useAuth();
  return user
    ? <div className="px-2 py-1.5 text-[11px] text-muted-foreground">Signed in as {user.email}</div>
    : <Link to="/auth" className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium hover:bg-muted/60">Sign in</Link>;
}
