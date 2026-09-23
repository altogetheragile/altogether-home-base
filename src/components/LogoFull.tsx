import { useSiteSettings } from '@/hooks/useSiteSettings';
import { resolveImages } from '@altogether/ui/brand';

/** The lockup, from this site's brand rather than this repository's.
 *
 *  Falls back to the file in public/ while settings load and whenever a site has not set one, so
 *  it never renders empty. */
const LogoFull = ({ height = 48 }: { height?: number; light?: boolean }) => {
  const { settings } = useSiteSettings();
  const { logo } = resolveImages((settings as { brand?: unknown } | undefined)?.brand as Parameters<typeof resolveImages>[0]);
  const name = (settings as { company_name?: string | null } | undefined)?.company_name ?? 'Altogether Agile';
  return <img src={logo} alt={name} style={{ height }} className="w-auto" />;
};

export default LogoFull;
