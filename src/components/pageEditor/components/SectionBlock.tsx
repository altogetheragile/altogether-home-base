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
      className={`relative ${getHeightClass(block.content.height, 'section')} ${styleClasses} ${block.content.backgroundImage ? 'text-white' : ''} w-full max-w-full overflow-hidden`} 
      style={{...inlineStyles, ...sectionBackgroundStyles}}
    >
      {/* Dark overlay for background images to ensure text readability */}
      {block.content.backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
      )}
      <div className="relative z-10 px-2 sm:px-4 md:px-6 py-6 sm:py-8 md:py-16 space-y-3 sm:space-y-4 md:space-y-8 w-full max-w-6xl mx-auto">
        {block.content.title && (
          <h2 className={`${getTitleFontSize(styles)} font-bold text-center`}>
            {block.content.title}
          </h2>
        )}
        {block.content.content && (
          <div className="mx-auto max-w-4xl px-2 sm:px-4">
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