// DEPRECATED: This file is replaced by useDynamicFontSize hook
// These functions are kept for backward compatibility but should not be used
// Use useDynamicFontSize hook instead

export const getTitleFontSize = (styles: any) => {
  // Legacy function - use useDynamicFontSize hook instead
  const fontSize = styles.titleFontSize;
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

export const getSubtitleFontSize = (styles: any) => {
  // Legacy function - use useDynamicFontSize hook instead
  const fontSize = styles.subtitleFontSize;
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

export const getContentFontSize = (styles: any) => {
  // Legacy function - use useDynamicFontSize hook instead
  const fontSize = styles.fontSize || styles.subtitleFontSize;
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