import { useLayoutEffect, useMemo } from 'react';

const updateDynamicFontSize = (variable: string, size: string | number) => {
  const pixelSize = typeof size === 'string' ? parseInt(size.replace('px', '')) : size;
  if (pixelSize && pixelSize > 0) {
    // More aggressive mobile scaling: mobile (35%), tablet (65%), desktop (100%)
    const mobileSize = Math.max(14, Math.round(pixelSize * 0.35));
    const tabletSize = Math.max(18, Math.round(pixelSize * 0.65));
    const clampValue = `clamp(${mobileSize}px, ${Math.round(pixelSize / 24)}rem + 1vw, ${pixelSize}px)`;
    
    // Only update if the value has changed
    const currentValue = document.documentElement.style.getPropertyValue(variable);
    if (currentValue !== clampValue) {
      document.documentElement.style.setProperty(variable, clampValue);
    }
  }
};

export const useDynamicFontSize = (styles: any) => {
  const fontSizes = useMemo(() => {
    const titleSize = getTitleFontSizeValue(styles);
    const subtitleSize = getSubtitleFontSizeValue(styles);
    const contentSize = getContentFontSizeValue(styles);
    
    return { titleSize, subtitleSize, contentSize };
  }, [styles.customTitleFontSize, styles.titleFontSize, styles.customSubtitleFontSize, styles.subtitleFontSize, styles.customContentFontSize, styles.fontSize]);

  useLayoutEffect(() => {
    // Handle custom title font size
    if (styles.customTitleFontSize && typeof styles.customTitleFontSize === 'string') {
      const pixelValue = parseInt(styles.customTitleFontSize.replace('px', ''));
      if (pixelValue && pixelValue > 0) {
        updateDynamicFontSize('--lovable-title-size', pixelValue);
      }
    } else if (styles.titleFontSize && styles.titleFontSize.includes('[') && styles.titleFontSize.includes('px]')) {
      const match = styles.titleFontSize.match(/text-\[(\d+)px\]/);
      if (match) {
        updateDynamicFontSize('--lovable-title-size', parseInt(match[1]));
      }
    }

    // Handle custom subtitle font size
    if (styles.customSubtitleFontSize && typeof styles.customSubtitleFontSize === 'string') {
      const pixelValue = parseInt(styles.customSubtitleFontSize.replace('px', ''));
      if (pixelValue && pixelValue > 0) {
        updateDynamicFontSize('--lovable-subtitle-size', pixelValue);
      }
    } else if (styles.subtitleFontSize && styles.subtitleFontSize.includes('[') && styles.subtitleFontSize.includes('px]')) {
      const match = styles.subtitleFontSize.match(/text-\[(\d+)px\]/);
      if (match) {
        updateDynamicFontSize('--lovable-subtitle-size', parseInt(match[1]));
      }
    }

    // Handle custom content font size
    if (styles.customContentFontSize && typeof styles.customContentFontSize === 'string') {
      const pixelValue = parseInt(styles.customContentFontSize.replace('px', ''));
      if (pixelValue && pixelValue > 0) {
        updateDynamicFontSize('--lovable-content-size', pixelValue);
      }
    } else {
      const fontSize = styles.fontSize || styles.subtitleFontSize;
      if (fontSize && fontSize.includes('[') && fontSize.includes('px]')) {
        const match = fontSize.match(/text-\[(\d+)px\]/);
        if (match) {
          updateDynamicFontSize('--lovable-content-size', parseInt(match[1]));
        }
      }
    }
  }, [styles.customTitleFontSize, styles.titleFontSize, styles.customSubtitleFontSize, styles.subtitleFontSize, styles.customContentFontSize, styles.fontSize]);

  return fontSizes;
};

// Pure functions without side effects
const getTitleFontSizeValue = (styles: any): string => {
  if (styles.customTitleFontSize && typeof styles.customTitleFontSize === 'string') {
    const pixelValue = parseInt(styles.customTitleFontSize.replace('px', ''));
    if (pixelValue && pixelValue > 0) {
      return 'text-[length:var(--lovable-title-size)]';
    }
  }
  
  const fontSize = styles.titleFontSize;
  if (fontSize && fontSize.includes('[') && fontSize.includes('px]')) {
    return 'text-[length:var(--lovable-title-size)]';
  }
  
  if (fontSize) {
    switch (fontSize) {
      case 'text-6xl': return 'text-2xl sm:text-3xl md:text-5xl lg:text-6xl';
      case 'text-5xl': return 'text-xl sm:text-2xl md:text-4xl lg:text-5xl';
      case 'text-4xl': return 'text-lg sm:text-xl md:text-3xl lg:text-4xl';
      case 'text-3xl': return 'text-base sm:text-lg md:text-2xl lg:text-3xl';
      case 'text-2xl': return 'text-sm sm:text-base md:text-xl lg:text-2xl';
      default: return fontSize;
    }
  }
  
  return 'text-xl sm:text-2xl md:text-3xl lg:text-4xl';
};

const getSubtitleFontSizeValue = (styles: any): string => {
  if (styles.customSubtitleFontSize && typeof styles.customSubtitleFontSize === 'string') {
    const pixelValue = parseInt(styles.customSubtitleFontSize.replace('px', ''));
    if (pixelValue && pixelValue > 0) {
      return 'text-[length:var(--lovable-subtitle-size)]';
    }
  }
  
  const fontSize = styles.subtitleFontSize;
  if (fontSize && fontSize.includes('[') && fontSize.includes('px]')) {
    return 'text-[length:var(--lovable-subtitle-size)]';
  }
  
  if (fontSize) {
    switch (fontSize) {
      case 'text-3xl': return 'text-lg sm:text-xl md:text-2xl lg:text-3xl';
      case 'text-2xl': return 'text-base sm:text-lg md:text-xl lg:text-2xl';
      case 'text-xl': return 'text-sm sm:text-base md:text-lg lg:text-xl';
      case 'text-lg': return 'text-sm sm:text-sm md:text-base lg:text-lg';
      default: return fontSize;
    }
  }
  
  return 'text-base sm:text-lg md:text-xl';
};

const getContentFontSizeValue = (styles: any): string => {
  if (styles.customContentFontSize && typeof styles.customContentFontSize === 'string') {
    const pixelValue = parseInt(styles.customContentFontSize.replace('px', ''));
    if (pixelValue && pixelValue > 0) {
      return 'text-[length:var(--lovable-content-size)]';
    }
  }
  
  const fontSize = styles.fontSize || styles.subtitleFontSize;
  if (fontSize && fontSize.includes('[') && fontSize.includes('px]')) {
    return 'text-[length:var(--lovable-content-size)]';
  }
  
  if (fontSize) {
    switch (fontSize) {
      case 'text-2xl': return 'text-sm sm:text-base md:text-lg lg:text-xl';
      case 'text-xl': return 'text-sm sm:text-sm md:text-base lg:text-lg';
      case 'text-lg': return 'text-xs sm:text-sm md:text-base lg:text-lg';
      case 'text-base': return 'text-xs sm:text-sm md:text-sm lg:text-base';
      default: return fontSize;
    }
  }
  
  return 'text-sm sm:text-base';
};

export const getTitleSpacing = (styles: any) => {
  return styles.titleSpacing || 'mb-4 sm:mb-6 md:mb-8';
};