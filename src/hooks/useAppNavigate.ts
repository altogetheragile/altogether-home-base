import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSiteOwned } from '@/config/siteOwnedRoutes';

/** Navigate, leaving the app when the URL belongs to the Site.
 *
 *  The counterpart to AppLink, for the places that navigate in code rather than by a link. The App
 *  does not declare routes for the Site's URLs, so `navigate('/')` matches nothing and React Router
 *  falls through to Not Found. That is what happened after signing in: the redirect went to `/`,
 *  the router had no such route, and the person who had just signed in got a 404 with a working
 *  session behind it.
 *
 *  Links were converted when the routes were removed. These were missed, because a link is visible
 *  in the markup and a redirect is not. */
export function useAppNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (to: string | number, options?: { replace?: boolean }) => {
      // navigate(-1) and friends are history moves, not destinations. Nothing to decide.
      if (typeof to === 'number') {
        navigate(to);
        return;
      }
      if (isSiteOwned(to)) {
        if (options?.replace) window.location.replace(to);
        else window.location.assign(to);
        return;
      }
      navigate(to, options);
    },
    [navigate],
  );
}
