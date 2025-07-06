// Helper functions for managing font sizes in content blocks

export const getTitleFontSize = (styles: any) => {
  if (styles.titleFontSize === 'custom' && styles.customTitleFontSize) {
    // For custom pixel sizes, use smaller mobile sizes
    const pixelSize = parseInt(styles.customTitleFontSize);
    if (pixelSize && pixelSize > 30) {
      return 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl';
    }
    return styles.customTitleFontSize;
  }
  
  // Convert non-responsive Tailwind classes to responsive ones
  const fontSize = styles.titleFontSize;
  if (fontSize && !fontSize.includes('sm:')) {
    switch (fontSize) {
      case 'text-6xl': return 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl';
      case 'text-5xl': return 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl';
      case 'text-4xl': return 'text-xl sm:text-2xl md:text-3xl lg:text-4xl';
      case 'text-3xl': return 'text-lg sm:text-xl md:text-2xl lg:text-3xl';
      case 'text-2xl': return 'text-base sm:text-lg md:text-xl lg:text-2xl';
      default: return fontSize;
    }
  }
  
  return fontSize || 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl';
};

export const getSubtitleFontSize = (styles: any) => {
  if (styles.subtitleFontSize === 'custom' && styles.customSubtitleFontSize) {
    // For custom pixel sizes, use smaller mobile sizes
    const pixelSize = parseInt(styles.customSubtitleFontSize);
    if (pixelSize && pixelSize > 20) {
      return 'text-base sm:text-lg md:text-xl lg:text-2xl';
    }
    return styles.customSubtitleFontSize;
  }
  
  // Convert non-responsive Tailwind classes to responsive ones
  const fontSize = styles.subtitleFontSize;
  if (fontSize && !fontSize.includes('sm:')) {
    switch (fontSize) {
      case 'text-3xl': return 'text-lg sm:text-xl md:text-2xl lg:text-3xl';
      case 'text-2xl': return 'text-base sm:text-lg md:text-xl lg:text-2xl';
      case 'text-xl': return 'text-sm sm:text-base md:text-lg lg:text-xl';
      case 'text-lg': return 'text-sm sm:text-base md:text-lg';
      default: return fontSize;
    }
  }
  
  return fontSize || 'text-base sm:text-lg md:text-xl lg:text-2xl';
};

export const getContentFontSize = (styles: any) => {
  // For content that's not specifically title/subtitle, use the legacy fontSize or subtitle size as fallback
  return styles.fontSize || styles.subtitleFontSize || '';
};

export const getTitleSpacing = (styles: any) => {
  return styles.titleSpacing || 'mb-4 sm:mb-6 md:mb-8';
};