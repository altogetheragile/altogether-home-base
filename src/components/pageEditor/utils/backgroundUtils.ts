// Helper functions for managing background styles in content blocks

export const getHeightClass = (height: string, blockType: string, customHeight?: string) => {
  if (height === 'custom' && customHeight) {
    return ''; // Return empty class when using custom inline height
  }
  
  switch (height) {
    case 'small': return blockType === 'hero' ? 'py-12 min-h-[240px]' : 'py-6';
    case 'medium': return blockType === 'hero' ? 'py-16 min-h-[400px]' : 'py-12';
    case 'large': return blockType === 'hero' ? 'py-20 min-h-[480px]' : 'py-16';
    case 'xl': return blockType === 'hero' ? 'py-24 min-h-[560px]' : 'py-20';
    case '2xl': return blockType === 'hero' ? 'py-28 min-h-[640px]' : 'py-24';
    case 'screen': return blockType === 'hero' ? 'py-32 min-h-screen' : 'py-32';
    default: return blockType === 'hero' ? 'py-20 min-h-[320px]' : 'py-8';
  }
};

export const getBackgroundStyles = (content: any) => {
  const styles: React.CSSProperties = {};
  
  if (content?.backgroundImage) {
    styles.backgroundImage = `url(${content.backgroundImage})`;
    styles.backgroundSize = content.backgroundSize || 'cover';
    styles.backgroundPosition = content.backgroundPosition || 'center';
    styles.backgroundRepeat = 'no-repeat';
    
    if (content.parallax) {
      styles.backgroundAttachment = 'fixed';
    }
  }
  
  // Add custom height if specified
  if (content?.height === 'custom' && content?.customHeight) {
    styles.height = content.customHeight;
  }
  
  return styles;
};

export const getInlineStyles = (styles: any) => {
  const inlineStyles: React.CSSProperties = {};
  
  // Handle background based on backgroundType
  const backgroundType = styles.backgroundType || 'default';
  
  if (backgroundType === 'solid' && styles.customBackgroundColor && styles.customBackgroundColor !== 'default') {
    inlineStyles.backgroundColor = styles.customBackgroundColor;
  } else if (backgroundType === 'none') {
    inlineStyles.backgroundColor = 'transparent';
  } else if (styles.customBackgroundColor && styles.customBackgroundColor !== 'default' && backgroundType !== 'default') {
    inlineStyles.backgroundColor = styles.customBackgroundColor;
  }
  
  if (styles.customTextColor && styles.customTextColor !== 'default') {
    inlineStyles.color = styles.customTextColor;
  }
  if (styles.customBorderColor && styles.customBorderColor !== 'default') {
    inlineStyles.borderColor = styles.customBorderColor;
    inlineStyles.borderWidth = styles.borderWidth || '2px';
    inlineStyles.borderStyle = 'solid';
  } else if (styles.borderColor && styles.borderColor !== 'default') {
    // Handle Tailwind border color classes
    inlineStyles.borderWidth = styles.borderWidth || '2px';
    inlineStyles.borderStyle = 'solid';
  }

  return inlineStyles;
};

export const getStyleClasses = (styles: any) => {
  // Ensure styles is an object and all values are strings
  const safeStyles = styles || {};
  
  const classes = [
    typeof safeStyles.fontFamily === 'string' ? safeStyles.fontFamily : '',
    typeof safeStyles.backgroundColor === 'string' ? safeStyles.backgroundColor : '',
    typeof safeStyles.textColor === 'string' ? safeStyles.textColor : '',
    typeof safeStyles.padding === 'string' ? safeStyles.padding : '',
    typeof safeStyles.textAlign === 'string' ? safeStyles.textAlign : '',
    typeof safeStyles.fontSize === 'string' ? safeStyles.fontSize : '',
    typeof safeStyles.fontWeight === 'string' ? safeStyles.fontWeight : '',
  ].filter(Boolean);
  
  // Add border classes if borderColor is set
  if (typeof safeStyles.borderColor === 'string' && safeStyles.borderColor) {
    classes.push(safeStyles.borderColor);
    classes.push('border-2'); // Add border width class
  }
  
  return classes.join(' ');
};