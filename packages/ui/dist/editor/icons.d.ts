import { LucideIcon } from 'lucide-react';

declare const ICONS: Record<string, LucideIcon>;
declare const ICON_NAMES: string[];
/** An unknown name renders nothing rather than throwing. A page should not go down because
 *  somebody typed an icon name that no longer exists. */
declare function iconByName(name: string | undefined | null): LucideIcon | null;

export { ICONS, ICON_NAMES, iconByName };
