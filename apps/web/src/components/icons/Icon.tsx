import { iconByName } from '@altogether/ui/editor/icons';

/** Renders the icon a site chose, or nothing at all. Used wherever an icon is content rather
 *  than decoration the design insists on. */
export function Icon({ name, size = 20, className }: { name?: string | null; size?: number; className?: string }) {
  const Glyph = iconByName(name);
  return Glyph ? <Glyph size={size} className={className} aria-hidden /> : null;
}
