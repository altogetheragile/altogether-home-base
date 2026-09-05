import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/** The way back to the site, and who is signed in.
 *
 *  These were a bar of their own above the game's strip: two headers, two visual registers, and
 *  seventy pixels spent saying where you are twice. They ride IN the strip now, so the strip is the
 *  only thing above the tabs.
 *
 *  Their own file rather than the page's, because the shell renders them and the page renders the
 *  shell - taking them from the page would be a circle, and a circular import of a component is the
 *  kind that fails as a blank screen rather than as an error.
 */
export function GameLinks() {
  const { user } = useAuth();
  return (
    <div className="flex items-center gap-2 text-xs">
      <Link to="/" aria-label="Back to Altogether Agile" title="Back to Altogether Agile"
        className="flex items-center gap-1 font-semibold opacity-80 hover:opacity-100">
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Altogether Agile</span>
      </Link>
      {user
        ? <span className="hidden max-w-[18vw] truncate opacity-70 lg:inline" title={user.email}>{user.email}</span>
        : <Link to="/auth" className="rounded-md border border-white/25 px-2 py-0.5 font-medium opacity-80 hover:opacity-100">Sign in</Link>}
    </div>
  );
}
