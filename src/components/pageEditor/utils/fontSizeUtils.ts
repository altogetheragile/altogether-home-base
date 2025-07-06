// Helper functions for managing font sizes in content blocks

export const getTitleFontSize = (styles: any) => {
  // Handle direct pixel values or custom font sizes
  if (styles.customTitleFontSize) {
    const pixelSize = parseInt(styles.customTitleFontSize);
    if (pixelSize) {
      // Use larger, more readable mobile sizes
      if (pixelSize >= 40) {
        return 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl';
      } else if (pixelSize >= 30) {
        return 'text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl';
      } else {
        return 'text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl';
      }
    }
  }
  
  if (styles.titleFontSize === 'custom' && styles.customTitleFontSize) {
    return 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl';
  }
  
  // Convert non-responsive Tailwind classes to responsive ones with readable mobile sizes
  const fontSize = styles.titleFontSize;
  if (fontSize && !fontSize.includes('sm:')) {
    switch (fontSize) {
      case 'text-6xl': return 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl';
      case 'text-5xl': return 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl';
      case 'text-4xl': return 'text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl';
      case 'text-3xl': return 'text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl';
      case 'text-2xl': return 'text-base sm:text-lg md:text-xl lg:text-2xl';
      default: return fontSize;
    }
  }
  
  return fontSize || 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl';
};

export const getSubtitleFontSize = (styles: any) => {
  // Handle direct pixel values or custom font sizes
  if (styles.customSubtitleFontSize) {
    const pixelSize = parseInt(styles.customSubtitleFontSize);
    if (pixelSize) {
      // Use larger, more readable mobile sizes
      if (pixelSize >= 30) {
        return 'text-base sm:text-lg md:text-xl lg:text-2xl';
      } else if (pixelSize >= 20) {
        return 'text-base sm:text-lg md:text-xl';
      } else {
        return 'text-sm sm:text-base md:text-lg';
      }
    }
  }
  
  if (styles.subtitleFontSize === 'custom' && styles.customSubtitleFontSize) {
    return 'text-base sm:text-lg md:text-xl lg:text-2xl';
  }
  
  // Convert non-responsive Tailwind classes to responsive ones with readable mobile sizes
  const fontSize = styles.subtitleFontSize;
  if (fontSize && !fontSize.includes('sm:')) {
    switch (fontSize) {
      case 'text-3xl': return 'text-lg sm:text-xl md:text-2xl lg:text-3xl';
      case 'text-2xl': return 'text-base sm:text-lg md:text-xl lg:text-2xl';
      case 'text-xl': return 'text-base sm:text-lg md:text-xl';
      case 'text-lg': return 'text-base sm:text-lg';
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