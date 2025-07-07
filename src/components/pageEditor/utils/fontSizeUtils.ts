// Helper functions for managing responsive font sizes in content blocks

export const getTitleFontSize = (styles: any) => {
  // Handle custom pixel values with proper mobile-first responsive scaling
  if (styles.customTitleFontSize) {
    const pixelSize = parseInt(styles.customTitleFontSize);
    if (pixelSize && pixelSize > 0) {
      // Mobile-first approach: mobile (60%), tablet (80%), desktop (100%)
      const mobileSize = Math.max(28, Math.round(pixelSize * 0.6));
      const tabletSize = Math.max(32, Math.round(pixelSize * 0.8));
      return `text-[${mobileSize}px] sm:text-[${Math.round(mobileSize * 1.1)}px] md:text-[${tabletSize}px] lg:text-[${pixelSize}px]`;
    }
  }
  
  // Handle 'custom' type with customTitleFontSize
  if (styles.titleFontSize === 'custom' && styles.customTitleFontSize) {
    const pixelSize = parseInt(styles.customTitleFontSize) || 48;
    const mobileSize = Math.max(28, Math.round(pixelSize * 0.6));
    const tabletSize = Math.max(32, Math.round(pixelSize * 0.8));
    return `text-[${mobileSize}px] sm:text-[${Math.round(mobileSize * 1.1)}px] md:text-[${tabletSize}px] lg:text-[${pixelSize}px]`;
  }
  
  // Handle predefined Tailwind classes with mobile-first responsive scaling
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
  
  return fontSize || 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl';
};

export const getSubtitleFontSize = (styles: any) => {
  // Handle custom pixel values with proper mobile-first responsive scaling
  if (styles.customSubtitleFontSize) {
    const pixelSize = parseInt(styles.customSubtitleFontSize);
    if (pixelSize && pixelSize > 0) {
      // Mobile-first approach: mobile (65%), tablet (85%), desktop (100%)
      const mobileSize = Math.max(18, Math.round(pixelSize * 0.65));
      const tabletSize = Math.max(20, Math.round(pixelSize * 0.85));
      return `text-[${mobileSize}px] sm:text-[${Math.round(mobileSize * 1.1)}px] md:text-[${tabletSize}px] lg:text-[${pixelSize}px]`;
    }
  }
  
  // Handle 'custom' type with customSubtitleFontSize
  if (styles.subtitleFontSize === 'custom' && styles.customSubtitleFontSize) {
    const pixelSize = parseInt(styles.customSubtitleFontSize) || 24;
    const mobileSize = Math.max(18, Math.round(pixelSize * 0.65));
    const tabletSize = Math.max(20, Math.round(pixelSize * 0.85));
    return `text-[${mobileSize}px] sm:text-[${Math.round(mobileSize * 1.1)}px] md:text-[${tabletSize}px] lg:text-[${pixelSize}px]`;
  }
  
  // Handle predefined Tailwind classes with mobile-first responsive scaling
  const fontSize = styles.subtitleFontSize;
  if (fontSize && !fontSize.includes('sm:')) {
    switch (fontSize) {
      case 'text-3xl': return 'text-lg sm:text-xl md:text-2xl lg:text-3xl';
      case 'text-2xl': return 'text-base sm:text-lg md:text-xl lg:text-2xl';
      case 'text-xl': return 'text-sm sm:text-base md:text-lg lg:text-xl';
      case 'text-lg': return 'text-sm sm:text-sm md:text-base lg:text-lg';
      default: return fontSize;
    }
  }
  
  return fontSize || 'text-base sm:text-lg md:text-xl lg:text-2xl';
};

export const getContentFontSize = (styles: any) => {
  // Handle custom content font sizes with mobile-first responsive scaling
  if (styles.customContentFontSize) {
    const pixelSize = parseInt(styles.customContentFontSize);
    if (pixelSize && pixelSize > 0) {
      const mobileSize = Math.max(14, Math.round(pixelSize * 0.8));
      const tabletSize = Math.max(16, Math.round(pixelSize * 0.9));
      return `text-[${mobileSize}px] sm:text-[${Math.round(mobileSize * 1.1)}px] md:text-[${tabletSize}px] lg:text-[${pixelSize}px]`;
    }
  }
  
  // Use fontSize or subtitleFontSize with responsive scaling
  const fontSize = styles.fontSize || styles.subtitleFontSize;
  if (fontSize && !fontSize.includes('sm:')) {
    switch (fontSize) {
      case 'text-2xl': return 'text-base sm:text-lg md:text-xl lg:text-2xl';
      case 'text-xl': return 'text-sm sm:text-base md:text-lg lg:text-xl';
      case 'text-lg': return 'text-sm sm:text-sm md:text-base lg:text-lg';
      case 'text-base': return 'text-sm sm:text-sm md:text-base lg:text-base';
      default: return fontSize;
    }
  }
  
  return fontSize || 'text-sm sm:text-base md:text-lg';
};

export const getTitleSpacing = (styles: any) => {
  return styles.titleSpacing || 'mb-3 sm:mb-4 md:mb-6 lg:mb-8';
};