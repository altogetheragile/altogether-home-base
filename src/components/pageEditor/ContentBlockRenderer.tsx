import React from 'react';
import { ContentBlock } from '@/types/page';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ContentBlockRendererProps {
  block: ContentBlock;
  isEditing?: boolean;
  onEdit?: (block: ContentBlock) => void;
  onDelete?: (blockId: string) => void;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
}

export const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({
  block,
  isEditing = false,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const renderContent = () => {
    const styles = block.content?.styles || {};
    const styleClasses = [
      styles.backgroundColor || '',
      styles.textColor || '',
      styles.borderColor || '',
      styles.padding || '',
      styles.textAlign || '',
      styles.fontSize || '',
      styles.fontWeight || '',
    ].filter(Boolean).join(' ');

    // Generate inline styles for custom colors
    const inlineStyles: React.CSSProperties = {};
    if (styles.customBackgroundColor && styles.customBackgroundColor !== 'default') {
      inlineStyles.backgroundColor = styles.customBackgroundColor;
    }
    if (styles.customTextColor && styles.customTextColor !== 'default') {
      inlineStyles.color = styles.customTextColor;
    }
    if (styles.customBorderColor && styles.customBorderColor !== 'default') {
      inlineStyles.borderColor = styles.customBorderColor;
      if (!styleClasses.includes('border')) {
        inlineStyles.borderWidth = '1px';
        inlineStyles.borderStyle = 'solid';
      }
    }

    switch (block.type) {
      case 'hero':
        return (
          <div 
            className={`relative bg-gradient-to-r from-primary to-primary-glow text-white py-20 px-8 text-center rounded-lg ${styleClasses}`}
            style={inlineStyles}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {block.content.title || 'Hero Title'}
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {block.content.subtitle || 'Hero subtitle'}
            </p>
            {block.content.ctaText && (
              <Button variant="secondary" size="lg" asChild>
                <a href={block.content.ctaLink || '#'}>
                  {block.content.ctaText}
                </a>
              </Button>
            )}
          </div>
        );

      case 'section':
        return (
          <div className={`py-12 ${styleClasses}`} style={inlineStyles}>
            {block.content.title && (
              <h2 className="text-3xl font-bold mb-6 text-center">
                {block.content.title}
              </h2>
            )}
            {block.content.content && (
              <div className="prose prose-lg mx-auto max-w-4xl">
                <p>{block.content.content}</p>
              </div>
            )}
          </div>
        );

      case 'text':
        return (
          <div className={`py-8 ${styleClasses}`} style={inlineStyles}>
            {block.content.title && (
              <h3 className="text-2xl font-semibold mb-4">
                {block.content.title}
              </h3>
            )}
            {block.content.content && (
              <div className="prose max-w-none">
                <p>{block.content.content}</p>
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div className={`py-8 ${styleClasses}`} style={inlineStyles}>
            {block.content.src ? (
              <div className="text-center">
                <img
                  src={block.content.src}
                  alt={block.content.alt || ''}
                  className="max-w-full h-auto mx-auto rounded-lg shadow-md"
                />
                {block.content.caption && (
                  <p className="text-sm text-muted-foreground mt-2">
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
        );

      case 'video':
        return (
          <div className={`py-8 ${styleClasses}`} style={inlineStyles}>
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
        );

      default:
        return (
          <div className="py-4 px-6 bg-muted rounded-lg">
            <p className="text-muted-foreground">Unknown content type: {block.type}</p>
          </div>
        );
    }
  };

  if (!isEditing) {
    return <div className={!block.is_visible ? 'opacity-50' : ''}>{renderContent()}</div>;
  }

  return (
    <Card className={`relative group ${!block.is_visible ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        {renderContent()}
        
        {/* Edit Controls */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1 bg-background border rounded-md p-1 shadow-md">
            {onMoveUp && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMoveUp(block.id)}
                className="h-6 w-6 p-0"
                title="Move up"
              >
                ↑
              </Button>
            )}
            {onMoveDown && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMoveDown(block.id)}
                className="h-6 w-6 p-0"
                title="Move down"
              >
                ↓
              </Button>
            )}
            {onEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(block)}
                className="h-6 w-6 p-0"
                title="Edit"
              >
                ✏️
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(block.id)}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                title="Delete"
              >
                🗑️
              </Button>
            )}
          </div>
        </div>

        {/* Block Info */}
        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-background border rounded px-2 py-1 text-xs text-muted-foreground">
            {block.type} #{block.position}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};