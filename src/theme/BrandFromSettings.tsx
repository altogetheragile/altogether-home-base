import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { applyBrandCssVars } from './brandCssVars';

/** Repaints the app in this site's brand once `site_settings` has loaded.
 *
 *  Renders nothing. It exists because the App is client-rendered: the palette cannot be known
 *  before the first paint, so the app starts in the default brand (index.css and the startup call
 *  in App.tsx) and this corrects it. On altogetheragile.com there is nothing to correct.
 *
 *  The Site does not need an equivalent. It is server-rendered, so its palette is already right
 *  in the HTML. */
export function BrandFromSettings() {
  const { settings } = useSiteSettings();
  const brand = (settings as { brand?: unknown } | undefined)?.brand;

  useEffect(() => {
    if (brand) applyBrandCssVars(brand as Parameters<typeof applyBrandCssVars>[0]);
  }, [brand]);

  return null;
}
