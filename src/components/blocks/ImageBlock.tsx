import React, { useMemo } from 'react';
import { ContentBlock } from '@/types/page';
import { SafeText, textOrEmpty, isNonEmptyString } from '@/lib/safe';
import { useDynamicFontSize } from '../../../hooks/useDynamicFontSize';
import { getHeightClass, getBackgroundStyles, getInlineStyles, getStyleClasses } from '../utils/backgroundUtils';

interface ImageBlockProps {
  block: ContentBlock;
}

export const ImageBlock: React.FC<ImageBlockProps> = React.memo(({ block }) => {
  // Ensure block.content exists with safe defaults - normalize to prevent object-in-JSX issues
  const content = (block.content && typeof block.content === 'object') ? block.content : {};
  const styles = useMemo(() => (content.styles && typeof content.styles === 'object') ? content.styles : {}, [content.styles]);
  // Use useDynamicFontSize for consistent hook patterns across all block types
  useDynamicFontSize(styles);
  const inlineStyles = getInlineStyles(styles);
  const styleClasses = getStyleClasses(styles);
  const imageBackgroundStyles = getBackgroundStyles(content);

  return (
    <div 
      className={`relative ${getHeightClass(content.height, 'image')} ${styleClasses}`} 
      style={{...inlineStyles, ...imageBackgroundStyles}}
    >
      {/* Dark overlay for background images */}
      {isNonEmptyString(content.backgroundImage) && (
        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
      )}
      <div className="relative z-10">
        {isNonEmptyString(content.src) ? (
          <div className="text-center">
            <img
              src={String(content.src)}
              alt={textOrEmpty(content.alt)}
              className="max-w-full h-auto mx-auto rounded-lg shadow-md"
            />
            <SafeText
              as="p"
              value={content.caption}
              className={`text-sm mt-2 ${isNonEmptyString(content.backgroundImage) ? 'text-white' : 'text-muted-foreground'}`}
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No image selected</p>
          </div>
        )}
      </div>
    </div>
  );
});