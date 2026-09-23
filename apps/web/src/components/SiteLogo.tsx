import { logoOf } from '@altogether/ui/brand';
import { colors as c } from '@/lib/brand';

/** The mark in the header and the footer.
 *
 *  An image when the site has uploaded one, and the site's own name otherwise. It does not fall
 *  back to this repository's lockup, because a site that has not chosen a logo should look
 *  unfinished rather than look like Altogether Agile. */
export function SiteLogo({
  brand, companyName, height, className,
}: {
  brand: Parameters<typeof logoOf>[0];
  companyName?: string | null;
  height: number;
  className?: string;
}) {
  const logo = logoOf(brand, companyName);

  if (logo.mode === 'image') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo.src} alt={companyName ?? 'Home'} className={className} style={{ height, width: 'auto' }} />;
  }

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', height,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontWeight: 800, fontSize: Math.round(height * 0.52), letterSpacing: '-0.02em',
        color: c.deepTeal, whiteSpace: 'nowrap',
      }}
    >
      {logo.text}
    </span>
  );
}
