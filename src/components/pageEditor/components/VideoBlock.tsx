import React from 'react';
import { ContentBlock } from '@/types/page';
import { getHeightClass, getBackgroundStyles, getInlineStyles, getStyleClasses } from '../utils/backgroundUtils';

interface VideoBlockProps {
  block: ContentBlock;
}

export const VideoBlock: React.FC<VideoBlockProps> = ({ block }) => {
  const styles = block.content?.styles || {};
  const inlineStyles = getInlineStyles(styles);
  const styleClasses = getStyleClasses(styles);
  const videoBackgroundStyles = getBackgroundStyles(block.content);

  return (
    <div 
      className={`relative ${getHeightClass(block.content.height, 'video')} ${styleClasses}`} 
      style={{...inlineStyles, ...videoBackgroundStyles}}
    >
      {/* Dark overlay for background images */}
      {block.content.backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
      )}
      <div className="relative z-10">
        {block.content.url ? (
          <div className="aspect-video">
            <iframe
              src={block.content.url}
              className="w-full h-full rounded-lg"
              allowFullScreen
              title={block.content.title || 'Video'}
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
};