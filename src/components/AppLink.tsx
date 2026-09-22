import { Link } from 'react-router-dom';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { isSiteOwned } from '@/config/siteOwnedRoutes';

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string;
  children: ReactNode;
};

/** A link that leaves the app when the URL belongs to the Site.
 *
 *  React Router would happily render something of its own at /about without ever asking the
 *  server, which is how this site came to have two About pages rendered to different people
 *  depending on how they arrived. A plain <a> is the point: the server answers, and there is one
 *  implementation of every public URL. */
export function AppLink({ to, children, ...rest }: AppLinkProps) {
  return isSiteOwned(to)
    ? <a href={to} {...rest}>{children}</a>
    : <Link to={to} {...rest}>{children}</Link>;
}
