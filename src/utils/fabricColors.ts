import React from 'react';

// Utility to resolve CSS variables to actual colors for Fabric.js
export interface FabricColors {
  background: string;
  foreground: string;
  card: string;
  accent: string;
  accentForeground: string;
  border: string;
}

export const resolveFabricColors = (): FabricColors => {
  // Get computed styles from document root
  const computedStyle = getComputedStyle(document.documentElement);
  
  // Helper to convert HSL values to a proper color string
  const resolveHSL = (variableName: string): string => {
    const hslValues = computedStyle.getPropertyValue(variableName).trim();
    if (hslValues) {
      return `hsl(${hslValues})`;
    }
    // Fallback colors if CSS variables are not available
    const fallbacks: Record<string, string> = {
      '--background': 'hsl(0, 0%, 100%)',
      '--foreground': 'hsl(0, 0%, 3.9%)',
      '--card': 'hsl(0, 0%, 100%)',
      '--accent': 'hsl(210, 40%, 98%)',
      '--accent-foreground': 'hsl(0, 0%, 9%)',
      '--border': 'hsl(214.3, 31.8%, 91.4%)',
    };
    return fallbacks[variableName] || 'hsl(0, 0%, 50%)';
  };

  return {
    background: resolveHSL('--background'),
    foreground: resolveHSL('--foreground'),
    card: resolveHSL('--card'),
    accent: resolveHSL('--accent'),
    accentForeground: resolveHSL('--accent-foreground'),
    border: resolveHSL('--border'),
  };
};

// Hook to detect theme changes and provide updated colors
export const useFabricColors = (callback?: (colors: FabricColors) => void) => {
  const getColors = () => resolveFabricColors();
  
  // Listen for theme changes (class changes on html element)
  React.useEffect(() => {
    if (!callback) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // Theme changed, update colors
          setTimeout(() => callback(getColors()), 0);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [callback]);

  return getColors;
};