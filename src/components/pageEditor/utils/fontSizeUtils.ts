// Font size utilities using CSS custom properties for responsive font scaling

const updateDynamicFontSize = (variable: string, size: string | number) => {
  const pixelSize = typeof size === 'string' ? parseInt(size.replace('px', '')) : size;
  if (pixelSize && pixelSize > 0) {
    // Create responsive scaling: mobile (70%), tablet (85%), desktop (100%)
    const mobileSize = Math.max(16, Math.round(pixelSize * 0.7));
    const tabletSize = Math.max(20, Math.round(pixelSize * 0.85));
    const clampValue = `clamp(${mobileSize}px, ${Math.round(pixelSize / 16)}rem + 2vw, ${pixelSize}px)`;
    document.documentElement.style.setProperty(variable, clampValue);
    console.log(`Updated ${variable} to ${clampValue}`);
  }
};

export const getTitleFontSize = (styles: any) => {
  console.log('Getting title font size with styles:', styles);
  
  // Handle custom pixel values first - check for actual pixel values
  if (styles.customTitleFontSize && typeof styles.customTitleFontSize === 'string') {
    const pixelValue = parseInt(styles.customTitleFontSize.replace('px', ''));
    if (pixelValue && pixelValue > 0) {
      updateDynamicFontSize('--lovable-title-size', pixelValue);
      return 'text-[length:var(--lovable-title-size)]';
    }
  }
  
  // Handle predefined sizes from titleFontSize that might have custom pixel values
  const fontSize = styles.titleFontSize;
  if (fontSize && fontSize.includes('[') && fontSize.includes('px]')) {
    // Extract pixel value from text-[80px] format
    const match = fontSize.match(/text-\[(\d+)px\]/);
    if (match) {
      const pixelValue = parseInt(match[1]);
      updateDynamicFontSize('--lovable-title-size', pixelValue);
      return 'text-[length:var(--lovable-title-size)]';
    }
  }
  
  // Handle predefined responsive sizes
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
  if (styles.customSubtitleFontSize && typeof styles.customSubtitleFontSize === 'string') {
    const pixelValue = parseInt(styles.customSubtitleFontSize.replace('px', ''));
    if (pixelValue && pixelValue > 0) {
      updateDynamicFontSize('--lovable-subtitle-size', pixelValue);
      return 'text-[length:var(--lovable-subtitle-size)]';
    }
  }
  
  // Handle predefined sizes from subtitleFontSize that might have custom pixel values
  const fontSize = styles.subtitleFontSize;
  if (fontSize && fontSize.includes('[') && fontSize.includes('px]')) {
    // Extract pixel value from text-[36px] format
    const match = fontSize.match(/text-\[(\d+)px\]/);
    if (match) {
      const pixelValue = parseInt(match[1]);
      updateDynamicFontSize('--lovable-subtitle-size', pixelValue);
      return 'text-[length:var(--lovable-subtitle-size)]';
    }
  }
  
  // Handle predefined responsive sizes
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
  if (styles.customContentFontSize && typeof styles.customContentFontSize === 'string') {
    const pixelValue = parseInt(styles.customContentFontSize.replace('px', ''));
    if (pixelValue && pixelValue > 0) {
      updateDynamicFontSize('--lovable-content-size', pixelValue);
      return 'text-[length:var(--lovable-content-size)]';
    }
  }
  
  // Use fontSize or subtitleFontSize with responsive scaling
  const fontSize = styles.fontSize || styles.subtitleFontSize;
  if (fontSize && fontSize.includes('[') && fontSize.includes('px]')) {
    // Extract pixel value from text-[18px] format
    const match = fontSize.match(/text-\[(\d+)px\]/);
    if (match) {
      const pixelValue = parseInt(match[1]);
      updateDynamicFontSize('--lovable-content-size', pixelValue);
      return 'text-[length:var(--lovable-content-size)]';
    }
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
  
  // Default responsive content size
  return 'text-sm sm:text-base';
};

export const getTitleSpacing = (styles: any) => {
  return styles.titleSpacing || 'mb-4 sm:mb-6 md:mb-8';
};