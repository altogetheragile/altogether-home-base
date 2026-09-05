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
  /** `mark` is the strip's one glyph; `menu` is the row inside the game menu, where signing in
   *  belongs - it is done once, and it is not part of playing. */
  variant?: 'mark' | 'menu';
}) {
  const { user } = useAuth();
  if (variant === 'menu') {
    return user
      ? <div className="px-2 py-1.5 text-[11px] text-muted-foreground">Signed in as {user.email}</div>
      : <Link to="/auth" className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium hover:bg-muted/60">Sign in</Link>;
  }
  return (
    <Link to="/" aria-label="Back to Altogether Agile" title="Back to Altogether Agile"
      className="shrink-0 select-none text-lg font-bold leading-none opacity-90 transition-opacity hover:opacity-100">
      皆
    </Link>
  );
}
