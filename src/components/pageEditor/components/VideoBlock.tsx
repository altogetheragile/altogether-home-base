import React, { useMemo } from 'react';
import { ContentBlock } from '@/types/page';
import { SafeText, textOrEmpty, isNonEmptyString } from '@/lib/safe';
import { useDynamicFontSize } from '../../../hooks/useDynamicFontSize';
import { getHeightClass, getBackgroundStyles, getInlineStyles, getStyleClasses } from '../utils/backgroundUtils';

interface VideoBlockProps {
  block: ContentBlock;
}

export const VideoBlock: React.FC<VideoBlockProps> = React.memo(({ block }) => {
  // Ensure block.content exists with safe defaults - normalize to prevent object-in-JSX issues
  const content = (block.content && typeof block.content === 'object') ? block.content : {};
  const styles = useMemo(() => (content.styles && typeof content.styles === 'object') ? content.styles : {}, [content.styles]);
  // Use useDynamicFontSize for consistent hook patterns across all block types
  useDynamicFontSize(styles);
  const inlineStyles = getInlineStyles(styles);
  const styleClasses = getStyleClasses(styles);
  const videoBackgroundStyles = getBackgroundStyles(content);

  return (
    <div 
      className={`relative ${getHeightClass(content.height, 'video')} ${styleClasses}`} 
      style={{...inlineStyles, ...videoBackgroundStyles}}
    >
      {/* Dark overlay for background images */}
      {isNonEmptyString(content.backgroundImage) && (
        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
      )}
      <div className="relative z-10">
        {isNonEmptyString(content.url) ? (
          <div className="aspect-video">
            <iframe
              src={String(content.url)}
              className="w-full h-full rounded-lg"
              allowFullScreen
              title={textOrEmpty(content.title) || 'Video'}
            />
          </div>
        ) : (
          <div className="aspect-video border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">No video URL provided</p>
          </div>
        )}
      </div>
    </div>
  );
});