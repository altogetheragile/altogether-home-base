// Helper functions for managing font sizes in content blocks

export const getTitleFontSize = (styles: any) => {
  // Handle direct pixel values or custom font sizes
  if (styles.customTitleFontSize) {
    const pixelSize = parseInt(styles.customTitleFontSize);
    if (pixelSize) {
      // Much larger mobile sizes for better readability
      if (pixelSize >= 40) {
        return 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl';
      } else if (pixelSize >= 30) {
        return 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl';
      } else {
        return 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl';
      }
    }
  }
  
  if (styles.titleFontSize === 'custom' && styles.customTitleFontSize) {
    return 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl';
  }
  
  // Convert non-responsive Tailwind classes to responsive ones with much larger mobile sizes
  const fontSize = styles.titleFontSize;
  if (fontSize && !fontSize.includes('sm:')) {
    switch (fontSize) {
      case 'text-6xl': return 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl';
      case 'text-5xl': return 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl';
      case 'text-4xl': return 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl';
      case 'text-3xl': return 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl';
      case 'text-2xl': return 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl';
      default: return fontSize;
    }
  }
  
  return fontSize || 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl';
};

export const getSubtitleFontSize = (styles: any) => {
  // Handle direct pixel values or custom font sizes
  if (styles.customSubtitleFontSize) {
    const pixelSize = parseInt(styles.customSubtitleFontSize);
    if (pixelSize) {
      // Much larger mobile sizes for better readability
      if (pixelSize >= 30) {
        return 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl';
      } else if (pixelSize >= 20) {
        return 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl';
      } else {
        return 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl';
      }
    }
  }
  
  if (styles.subtitleFontSize === 'custom' && styles.customSubtitleFontSize) {
    return 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl';
  }
  
  // Convert non-responsive Tailwind classes to responsive ones with much larger mobile sizes
  const fontSize = styles.subtitleFontSize;
  if (fontSize && !fontSize.includes('sm:')) {
    switch (fontSize) {
      case 'text-3xl': return 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl';
      case 'text-2xl': return 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl';
      case 'text-xl': return 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl';
      case 'text-lg': return 'text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl';
      default: return fontSize;
    }
  }
  
  return fontSize || 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl';
};

export const getContentFontSize = (styles: any) => {
  // For content that's not specifically title/subtitle, use the legacy fontSize or subtitle size as fallback
  return styles.fontSize || styles.subtitleFontSize || '';
};

export const getTitleSpacing = (styles: any) => {
  return styles.titleSpacing || 'mb-4 sm:mb-6 md:mb-8';
};