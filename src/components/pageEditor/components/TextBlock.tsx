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
      className={`relative px-4 sm:px-6 md:px-8 ${getHeightClass(block.content.height, 'text')} ${styleClasses} ${block.content.backgroundImage ? 'text-white' : ''} w-full max-w-full overflow-hidden`}
      style={{...inlineStyles, ...textBackgroundStyles}}
    >
      {/* Dark overlay for background images to ensure text readability */}
      {block.content.backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
      )}
      <div className="relative z-10 px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-12 space-y-3 sm:space-y-4 md:space-y-6 w-full max-w-4xl mx-auto">
        {block.content.title && (
          <h3 className={`${getTitleFontSize(styles)} font-semibold`}>
            {block.content.title}
          </h3>
        )}
        {block.content.content && (
          <div className="max-w-none px-2 sm:px-0">
            <p className={`${getContentFontSize(styles)} leading-relaxed`}>{block.content.content}</p>
          </div>
        )}
        <div>
          <ButtonRenderer content={block.content} styles={styles} />
        </div>
      </div>
    </div>
  );
};