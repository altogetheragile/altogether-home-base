import { useSiteSettings } from '@/hooks/useSiteSettings';
import { logoOf, wordmarkOf } from '@altogether/ui/brand';
import { colors } from '@/theme/colors';

/** The mark in the App's header.
 *
 *  An image when this site has uploaded one, and the site's own name otherwise. It does not fall
 *  back to this repository's lockup: a site that has not chosen a logo should look unfinished
 *  rather than look like Altogether Agile, which is what standing up a second site showed. */
const LogoFull = ({ height = 48 }: { height?: number; light?: boolean }) => {
  const { settings } = useSiteSettings();
  const s = settings as { brand?: unknown; company_name?: string | null } | undefined;
  const logo = logoOf(s?.brand as Parameters<typeof logoOf>[0], s?.company_name);

  if (logo.mode === 'image') {
    return <img src={logo.src} alt={s?.company_name ?? 'Home'} style={{ height }} className="w-auto" />;
  }
  // The same wordmark as the Site's header (apps/web SiteLogo). Two components because the two
  // apps do not share a React tree, one rule because they share @altogether/ui/brand.
  const mark = wordmarkOf(s?.brand as Parameters<typeof wordmarkOf>[0], s?.company_name);
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', height,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontWeight: 800, whiteSpace: 'nowrap',
  };

  if (mark.twoTone) {
    return (
      <span
        style={{
          ...base,
          fontSize: Math.round(height * 0.40), letterSpacing: '0.01em', textTransform: 'uppercase',
          color: colors.deepTeal,
        }}
      >
        {mark.first}{mark.gap ? '\u00a0' : ''}<span style={{ color: colors.orange }}>{mark.second}</span>
      </span>
    );
  }

  return (
    <span
      style={{ ...base, fontSize: Math.round(height * 0.44), letterSpacing: '-0.02em', color: colors.deepTeal }}
    >
      {logo.text}
    </span>
  );
};

export default LogoFull;
