import React from 'react';
import { ContentBlock } from '@/types/page';
import { ButtonRenderer } from './ButtonRenderer';
import { getTitleFontSize, getContentFontSize, getTitleSpacing } from '../utils/fontSizeUtils';
import { getHeightClass, getBackgroundStyles, getInlineStyles, getStyleClasses } from '../utils/backgroundUtils';

interface TextBlockProps {
  block: ContentBlock;
}

export const TextBlock: React.FC<TextBlockProps> = ({ block }) => {
  const styles = block.content?.styles || {};
  const inlineStyles = getInlineStyles(styles);
  const styleClasses = getStyleClasses(styles);
  const textBackgroundStyles = getBackgroundStyles(block.content);

  return (
    <div 
      className={`relative ${getHeightClass(block.content.height, 'text')} ${styleClasses} ${block.content.backgroundImage ? 'text-white' : ''}`} 
      style={{...inlineStyles, ...textBackgroundStyles}}
    >
      {/* Dark overlay for background images to ensure text readability */}
      {block.content.backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
      )}
      <div className="relative z-10 py-6 sm:py-8 md:py-12">
        {block.content.title && (
          <h3 className={`${getTitleFontSize(styles)} font-semibold ${getTitleSpacing(styles)}`}>
            {block.content.title}
          </h3>
        )}
        {block.content.content && (
          <div className="prose max-w-none mb-6 sm:mb-8">
            <p className={`${getContentFontSize(styles)} leading-relaxed`}>{block.content.content}</p>
          </div>
        )}
        <ButtonRenderer content={block.content} styles={styles} />
      </div>
    </div>
  );
};