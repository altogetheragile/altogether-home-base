import React from 'react';
import { ContentBlock } from '@/types/page';
import { ButtonRenderer } from './ButtonRenderer';
import { getTitleFontSize, getContentFontSize, getTitleSpacing } from '../utils/fontSizeUtils';
import { getHeightClass, getBackgroundStyles, getInlineStyles, getStyleClasses } from '../utils/backgroundUtils';

interface SectionBlockProps {
  block: ContentBlock;
}

export const SectionBlock: React.FC<SectionBlockProps> = ({ block }) => {
  const styles = block.content?.styles || {};
  const inlineStyles = getInlineStyles(styles);
  const styleClasses = getStyleClasses(styles);
  const sectionBackgroundStyles = getBackgroundStyles(block.content);

  return (
    <div 
      className={`relative ${getHeightClass(block.content.height, 'section')} ${styleClasses} ${block.content.backgroundImage ? 'text-white' : ''}`} 
      style={{...inlineStyles, ...sectionBackgroundStyles}}
    >
      {/* Dark overlay for background images to ensure text readability */}
      {block.content.backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
      )}
      <div className="relative z-10 py-8 sm:py-12 md:py-16 space-y-6 sm:space-y-8">
        {block.content.title && (
          <h2 className={`${getTitleFontSize(styles)} font-bold text-center`}>
            {block.content.title}
          </h2>
        )}
        {block.content.content && (
          <div className="mx-auto max-w-4xl">
            <p className={`${getContentFontSize(styles)} leading-relaxed text-center`}>{block.content.content}</p>
          </div>
        )}
        <div className="text-center">
          <ButtonRenderer content={block.content} styles={styles} />
        </div>
      </div>
    </div>
  );
};