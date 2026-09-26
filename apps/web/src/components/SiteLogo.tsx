import { logoOf, wordmarkOf, type BrandLogoOverrides } from '@altogether/ui/brand';
import { colors as c, fonts } from '@/lib/brand';

/** The mark in the header and the footer.
 *
 *  An image when the site has uploaded one, and the site's own name otherwise. It does not fall
 *  back to this repository's lockup, because a site that has not chosen a logo should look
 *  unfinished rather than look like Altogether Agile. */
export function SiteLogo({
  brand, companyName, height, className,
}: {
  brand: BrandLogoOverrides;
  companyName?: string | null;
  height: number;
  className?: string;
}) {
  const logo = logoOf(brand, companyName);

  if (logo.mode === 'image') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo.src} alt={companyName ?? 'Home'} className={className} style={{ height, width: 'auto' }} />;
  }

  const mark = wordmarkOf(brand, companyName);
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', height,
    fontFamily: fonts.sans,
    fontWeight: 800, whiteSpace: 'nowrap',
  };

  if (mark.twoTone) {
    return (
      <span
        className={className}
        style={{
          ...base,
          // Capitals and open spacing: the same two rules as this site's own lettering, taken
          // from the name and the palette rather than from a file somebody has to commission.
          fontSize: Math.round(height * 0.46), letterSpacing: '0.01em', textTransform: 'uppercase',
          color: c.deepTeal,
        }}
      >
        {mark.first}{mark.gap ? '\u00a0' : ''}<span style={{ color: c.orange }}>{mark.second}</span>
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{ ...base, fontSize: Math.round(height * 0.52), letterSpacing: '-0.02em', color: c.deepTeal }}
    >
      {logo.text}
    </span>
  );
}
