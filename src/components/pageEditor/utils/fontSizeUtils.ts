// Helper functions for managing font sizes in content blocks

export const getTitleFontSize = (styles: any) => {
  // Handle direct pixel values or custom font sizes
  if (styles.customTitleFontSize) {
    const pixelSize = parseInt(styles.customTitleFontSize);
    if (pixelSize) {
      // Use more reasonable mobile sizes - not too small, not too big
      if (pixelSize >= 40) {
        return 'text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl';
      } else if (pixelSize >= 30) {
        return 'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl';
      } else {
        return 'text-sm sm:text-base md:text-lg lg:text-xl';
      }
    }
  }
  
  if (styles.titleFontSize === 'custom' && styles.customTitleFontSize) {
    return 'text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl';
  }
  
  // Convert non-responsive Tailwind classes to responsive ones with reasonable mobile sizes
  const fontSize = styles.titleFontSize;
  if (fontSize && !fontSize.includes('sm:')) {
    switch (fontSize) {
      case 'text-6xl': return 'text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl';
      case 'text-5xl': return 'text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl';
      case 'text-4xl': return 'text-base sm:text-lg md:text-xl lg:text-2xl';
      case 'text-3xl': return 'text-sm sm:text-base md:text-lg lg:text-xl';
      case 'text-2xl': return 'text-sm sm:text-base md:text-lg lg:text-xl';
      default: return fontSize;
    }
  }
  
  return fontSize || 'text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl';
};

export const getSubtitleFontSize = (styles: any) => {
  // Handle direct pixel values or custom font sizes
  if (styles.customSubtitleFontSize) {
    const pixelSize = parseInt(styles.customSubtitleFontSize);
    if (pixelSize) {
      // Use more reasonable mobile sizes - not too small, not too big
      if (pixelSize >= 30) {
        return 'text-sm sm:text-base md:text-lg lg:text-xl';
      } else if (pixelSize >= 20) {
        return 'text-sm sm:text-base md:text-lg';
      } else {
        return 'text-xs sm:text-sm md:text-base';
      }
    }
  }
  
  if (styles.subtitleFontSize === 'custom' && styles.customSubtitleFontSize) {
    return 'text-sm sm:text-base md:text-lg lg:text-xl';
  }
  
  // Convert non-responsive Tailwind classes to responsive ones with reasonable mobile sizes
  const fontSize = styles.subtitleFontSize;
  if (fontSize && !fontSize.includes('sm:')) {
    switch (fontSize) {
      case 'text-3xl': return 'text-base sm:text-lg md:text-xl lg:text-2xl';
      case 'text-2xl': return 'text-sm sm:text-base md:text-lg lg:text-xl';
      case 'text-xl': return 'text-sm sm:text-base md:text-lg lg:text-xl';
      case 'text-lg': return 'text-sm sm:text-base md:text-lg';
      default: return fontSize;
    }
  }
  
  return fontSize || 'text-sm sm:text-base md:text-lg lg:text-xl';
};

export const getContentFontSize = (styles: any) => {
  // For content that's not specifically title/subtitle, use the legacy fontSize or subtitle size as fallback
  return styles.fontSize || styles.subtitleFontSize || '';
};

export const getTitleSpacing = (styles: any) => {
  return styles.titleSpacing || 'mb-4 sm:mb-6 md:mb-8';
};