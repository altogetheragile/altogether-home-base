import React from 'react';
import { ContentBlock } from '@/types/page';
import { ButtonRenderer } from './ButtonRenderer';
import { useDynamicFontSize, getTitleSpacing } from '../../../hooks/useDynamicFontSize';
import { getHeightClass, getBackgroundStyles, getInlineStyles, getStyleClasses } from '../utils/backgroundUtils';

interface HeroBlockProps {
  block: ContentBlock;
}

export const HeroBlock: React.FC<HeroBlockProps> = ({ block }) => {
  const styles = block.content?.styles || {};
  const { titleSize, subtitleSize } = useDynamicFontSize(styles);
  const inlineStyles = getInlineStyles(styles);
  const styleClasses = getStyleClasses(styles);
  
  // Determine background styles
  let heroBackgroundClasses = '';
  let heroBackgroundStyles: React.CSSProperties = {};
  const backgroundType = styles.backgroundType || 'default';
  
  if (block.content.backgroundImage) {
    heroBackgroundStyles = getBackgroundStyles(block.content);
    heroBackgroundClasses = 'relative';
  } else if (backgroundType === 'default' || backgroundType === 'gradient') {
    heroBackgroundClasses = 'bg-gradient-to-r from-primary to-primary-glow';
  }
  
  return (
    <div 
      className={`relative ${heroBackgroundClasses} text-white px-4 sm:px-6 md:px-8 text-center rounded-lg ${getHeightClass(block.content.height, 'hero')} flex items-center justify-center ${styleClasses} w-full max-w-full overflow-hidden`}
      style={{...inlineStyles, ...heroBackgroundStyles}}
    >
      {/* Dark overlay for background images to ensure text readability */}
      {block.content.backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
      )}
      <div className="relative z-10 max-w-4xl mx-auto px-2 sm:px-4 py-6 sm:py-8 md:py-16 space-y-3 sm:space-y-4 md:space-y-6 w-full">
        <h1 className={`${titleSize} font-bold leading-tight text-center`}>
          {block.content.title || 'Hero Title'}
        </h1>
        <p className={`${subtitleSize} opacity-90 leading-relaxed text-center max-w-3xl mx-auto`}>
          {block.content.subtitle || 'Hero subtitle'}
        </p>
        <div className="text-center pt-2">
          <ButtonRenderer content={block.content} styles={styles} />
        </div>
      </div>
    </div>
  );
};