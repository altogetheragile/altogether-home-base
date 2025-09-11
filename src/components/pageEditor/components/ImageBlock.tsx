import React, { useMemo } from 'react';
import { ContentBlock } from '@/types/page';
import { useDynamicFontSize } from '../../../hooks/useDynamicFontSize';
import { getHeightClass, getBackgroundStyles, getInlineStyles, getStyleClasses } from '../utils/backgroundUtils';

interface ImageBlockProps {
  block: ContentBlock;
}

export const ImageBlock: React.FC<ImageBlockProps> = React.memo(({ block }) => {
  const styles = useMemo(() => block.content?.styles || {}, [block.content?.styles]);
  // Use useDynamicFontSize for consistent hook patterns across all block types
  useDynamicFontSize(styles);
  const inlineStyles = getInlineStyles(styles);
  const styleClasses = getStyleClasses(styles);
  const imageBackgroundStyles = getBackgroundStyles(block.content);

  return (
    <div 
      className={`relative ${getHeightClass(block.content.height, 'image')} ${styleClasses}`} 
      style={{...inlineStyles, ...imageBackgroundStyles}}
    >
      {/* Dark overlay for background images */}
      {block.content.backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
      )}
      <div className="relative z-10">
        {block.content.src ? (
          <div className="text-center">
            <img
              src={block.content.src}
              alt={block.content.alt || ''}
              className="max-w-full h-auto mx-auto rounded-lg shadow-md"
            />
            {block.content.caption && (
              <p className={`text-sm mt-2 ${block.content.backgroundImage ? 'text-white' : 'text-muted-foreground'}`}>
                {block.content.caption}
              </p>
            )}
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