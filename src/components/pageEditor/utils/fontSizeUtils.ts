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
  return styles.titleFontSize || 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl';
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
  return styles.subtitleFontSize || 'text-base sm:text-lg md:text-xl lg:text-2xl';
};

export const getContentFontSize = (styles: any) => {
  // For content that's not specifically title/subtitle, use the legacy fontSize or subtitle size as fallback
  return styles.fontSize || styles.subtitleFontSize || '';
};

export const getTitleSpacing = (styles: any) => {
  return styles.titleSpacing || 'mb-4 sm:mb-6 md:mb-8';
};