// Helper functions for managing font sizes in content blocks

export const getTitleFontSize = (styles: any) => {
  if (styles.titleFontSize === 'custom' && styles.customTitleFontSize) {
    // For custom pixel sizes, use much smaller mobile sizes
    const pixelSize = parseInt(styles.customTitleFontSize);
    if (pixelSize && pixelSize > 30) {
      return 'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl';
    }
    return styles.customTitleFontSize;
  }
  
  // Convert non-responsive Tailwind classes to responsive ones with very small mobile sizes
  const fontSize = styles.titleFontSize;
  if (fontSize && !fontSize.includes('sm:')) {
    switch (fontSize) {
      case 'text-6xl': return 'text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl';
      case 'text-5xl': return 'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl';
      case 'text-4xl': return 'text-sm sm:text-base md:text-lg lg:text-xl';
      case 'text-3xl': return 'text-xs sm:text-sm md:text-base lg:text-lg';
      case 'text-2xl': return 'text-xs sm:text-sm md:text-base lg:text-lg';
      default: return fontSize;
    }
  }
  
  return fontSize || 'text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl';
};

export const getSubtitleFontSize = (styles: any) => {
  if (styles.subtitleFontSize === 'custom' && styles.customSubtitleFontSize) {
    // For custom pixel sizes, use much smaller mobile sizes
    const pixelSize = parseInt(styles.customSubtitleFontSize);
    if (pixelSize && pixelSize > 20) {
      return 'text-xs sm:text-sm md:text-base lg:text-lg';
    }
    return styles.customSubtitleFontSize;
  }
  
  // Convert non-responsive Tailwind classes to responsive ones with very small mobile sizes
  const fontSize = styles.subtitleFontSize;
  if (fontSize && !fontSize.includes('sm:')) {
    switch (fontSize) {
      case 'text-3xl': return 'text-sm sm:text-base md:text-lg lg:text-xl';
      case 'text-2xl': return 'text-xs sm:text-sm md:text-base lg:text-lg';
      case 'text-xl': return 'text-xs sm:text-sm md:text-base lg:text-lg';
      case 'text-lg': return 'text-xs sm:text-sm md:text-base';
      default: return fontSize;
    }
  }
  
  return fontSize || 'text-xs sm:text-sm md:text-base lg:text-lg';
};

export const getContentFontSize = (styles: any) => {
  // For content that's not specifically title/subtitle, use the legacy fontSize or subtitle size as fallback
  return styles.fontSize || styles.subtitleFontSize || '';
};

export const getTitleSpacing = (styles: any) => {
  return styles.titleSpacing || 'mb-4 sm:mb-6 md:mb-8';
};