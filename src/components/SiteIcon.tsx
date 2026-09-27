import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { resolveImages } from '@altogether/ui/brand';
import { pointTheIconAt, removeTheIcon } from './tabIcon';

// The tab icon, set from the database rather than from whatever the prerenderer built into the
// shell at the last deploy. The reasoning, and the two pure functions this uses, are in
// ./siteIcon.ts - kept out of this file because exporting anything but a component from a
// component file trips react-refresh, and the warning budget is a hard gate.

export function SiteIcon() {
  const { settings, isLoading } = useSiteSettings();
  const brand = (settings as { brand?: Parameters<typeof resolveImages>[0] } | undefined)?.brand;
  const favicon = resolveImages(brand).favicon;

  useEffect(() => {
    // Nothing until the settings are in. Before they arrive there is no icon to read, and acting
    // on that would take this site's own icon away for as long as the query takes and then put
    // it back: a blink on every page load, for no reason.
    if (isLoading) return;
    if (favicon) pointTheIconAt(document, favicon);
    else removeTheIcon(document);
  }, [favicon, isLoading]);

  return null;
}

export default SiteIcon;
