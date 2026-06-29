import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names (clsx + tailwind-merge). The canonical `cn` for the design
 *  system; consuming apps re-export their own from here so there's one implementation. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
