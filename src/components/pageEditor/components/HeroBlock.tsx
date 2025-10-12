import React, { useMemo } from 'react';
import { ContentBlock } from '@/types/page';
import { ButtonRenderer } from './ButtonRenderer';
import { SafeText, textOrEmpty, isNonEmptyString } from '@/lib/safe';
import { useDynamicFontSize, getTitleSpacing } from '../../../hooks/useDynamicFontSize';
import { getHeightClass, getBackgroundStyles, getInlineStyles, getStyleClasses } from '../utils/backgroundUtils';

interface HeroBlockProps {
  block: ContentBlock;
}

export const HeroBlock: React.FC<HeroBlockProps> = React.memo(({ block }) => {
  // Ensure block.content exists with safe defaults - normalize to prevent object-in-JSX issues
  const content = (block.content && typeof block.content === 'object') ? block.content : {};
  const styles = useMemo(() => (content.styles && typeof content.styles === 'object') ? content.styles : {}, [content.styles]);
  const { titleSize, subtitleSize, titleStyle, subtitleStyle } = useDynamicFontSize(styles);
  const inlineStyles = getInlineStyles(styles);
  const styleClasses = getStyleClasses(styles);
  
  // Safe string extraction
  const safeTitle = textOrEmpty(content.title) || 'Hero Title';
  const safeSubtitle = textOrEmpty(content.subtitle) || 'Hero subtitle';
  
  // Determine background styles
  let heroBackgroundClasses = '';
  let heroBackgroundStyles: React.CSSProperties = {};
  const backgroundType = styles.backgroundType || 'default';
  
  if (isNonEmptyString(content.backgroundImage)) {
    heroBackgroundStyles = getBackgroundStyles(content);
    heroBackgroundClasses = 'relative';
  } else if (backgroundType === 'default' || backgroundType === 'gradient') {
    heroBackgroundClasses = 'bg-gradient-to-r from-primary to-primary-glow';
  }
  
  return (
    <div 
      className={`relative ${heroBackgroundClasses} text-white px-4 sm:px-6 md:px-8 text-center rounded-lg ${getHeightClass(content.height, 'hero', content.customHeight)} flex items-center justify-center ${styleClasses} w-full max-w-full overflow-hidden`}
      style={{...inlineStyles, ...heroBackgroundStyles}}
    >
      {/* Dark overlay for background images to ensure text readability */}
      {isNonEmptyString(content.backgroundImage) && content.overlayOpacity > 0 && (
        <div 
          className="absolute inset-0 rounded-lg" 
          style={{
            backgroundColor: content.overlayColor || '#000000',
            opacity: (content.overlayOpacity || 0) / 100
          }}
        ></div>
      )}
      <div className="relative z-10 max-w-4xl mx-auto px-2 sm:px-4 py-6 sm:py-8 md:py-16 space-y-3 sm:space-y-4 md:space-y-6 w-full">
        <SafeText
          as="h1"
          value={safeTitle}
          className={`${titleSize} font-bold leading-tight text-center`}
        />
        <SafeText
          as="p"
          value={safeSubtitle}
          className={`${subtitleSize} opacity-90 leading-relaxed text-center max-w-3xl mx-auto`}
        />
        <div className="text-center pt-2">
          <ButtonRenderer content={content} styles={styles} />
        </div>
      </div>
    </div>
  );
});