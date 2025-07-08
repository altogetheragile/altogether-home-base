// Simple and reliable font size utilities using CSS custom properties

const updateDynamicFontSize = (variable: string, size: string | number) => {
  const pixelSize = typeof size === 'string' ? parseInt(size) : size;
  if (pixelSize && pixelSize > 0) {
    // Use CSS clamp for responsive scaling: mobile (60%), tablet (80%), desktop (100%)
    const mobileSize = Math.max(16, Math.round(pixelSize * 0.6));
    const tabletSize = Math.max(20, Math.round(pixelSize * 0.8));
    const clampValue = `clamp(${mobileSize}px, ${Math.round(pixelSize / 16)}rem + 1vw, ${pixelSize}px)`;
    document.documentElement.style.setProperty(variable, clampValue);
  }
};

export const getTitleFontSize = (styles: any) => {
  console.log('Getting title font size with styles:', styles);
  
  // Handle custom pixel values first
  if (styles.customTitleFontSize) {
    updateDynamicFontSize('--dynamic-title-size', styles.customTitleFontSize);
    return 'text-[length:var(--dynamic-title-size)]';
  }
  
  // Handle predefined sizes with simple responsive mapping
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
  
  // Default responsive title size
  return 'text-xl sm:text-2xl md:text-3xl lg:text-4xl';
};

export const getSubtitleFontSize = (styles: any) => {
  console.log('Getting subtitle font size with styles:', styles);
  
  // Handle custom pixel values first
  if (styles.customSubtitleFontSize) {
    updateDynamicFontSize('--dynamic-subtitle-size', styles.customSubtitleFontSize);
    return 'text-[length:var(--dynamic-subtitle-size)]';
  }
  
  // Handle predefined sizes with simple responsive mapping
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
  
  // Default responsive subtitle size
  return 'text-base sm:text-lg md:text-xl';
};

export const getContentFontSize = (styles: any) => {
  console.log('Getting content font size with styles:', styles);
  
  // Handle custom content font sizes
  if (styles.customContentFontSize) {
    updateDynamicFontSize('--dynamic-content-size', styles.customContentFontSize);
    return 'text-[length:var(--dynamic-content-size)]';
  }
  
  // Use fontSize or subtitleFontSize with responsive scaling
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
  
  // Default responsive content size
  return 'text-sm sm:text-base';
};

export const getTitleSpacing = (styles: any) => {
  return styles.titleSpacing || 'mb-4 sm:mb-6 md:mb-8';
};