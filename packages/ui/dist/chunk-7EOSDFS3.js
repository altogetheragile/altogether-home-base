import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// src/lib/cn.ts
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export { cn };
