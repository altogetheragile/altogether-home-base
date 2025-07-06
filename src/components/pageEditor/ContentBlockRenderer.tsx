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
    console.log('Styles for block:', block.id, styles); // Debug log
    
    // Helper function to get font size
    const getTitleFontSize = (styles: any) => {
      if (styles.titleFontSize === 'custom' && styles.customTitleFontSize) {
        return styles.customTitleFontSize;
      }
      return styles.titleFontSize || 'text-4xl md:text-6xl';
    };

    const getSubtitleFontSize = (styles: any) => {
      if (styles.subtitleFontSize === 'custom' && styles.customSubtitleFontSize) {
        return styles.customSubtitleFontSize;
      }
      return styles.subtitleFontSize || 'text-xl md:text-2xl';
    };

    const getContentFontSize = (styles: any) => {
      // For content that's not specifically title/subtitle, use the legacy fontSize or subtitle size as fallback
      return styles.fontSize || styles.subtitleFontSize || '';
    };

    const getTitleSpacing = (styles: any) => {
      return styles.titleSpacing || 'mb-8';
    };

    const renderButtons = (content: any, styles: any) => {
      const buttons = content?.buttons || [];
      const hasLegacyCTA = content?.ctaText && content?.ctaLink;
      
      if (buttons.length === 0 && !hasLegacyCTA) return null;
      
      const buttonSpacing = styles.buttonsSpacing || 'gap-4';
      
      return (
        <div className={`flex flex-wrap ${buttonSpacing} justify-center`}>
          {/* Legacy CTA button for hero sections */}
          {hasLegacyCTA && (
            <Button 
              variant={styles.ctaVariant || 'secondary'} 
              size={styles.buttonsSize || 'lg'} 
              asChild
              className={`${styles.ctaFontWeight || ''}`}
              style={{
                ...(styles.ctaBackgroundColor && styles.ctaBackgroundColor !== 'default' && {
                  backgroundColor: styles.ctaBackgroundColor
                }),
                ...(styles.ctaTextColor && styles.ctaTextColor !== 'default' && {
                  color: styles.ctaTextColor
                })
              }}
            >
              <a href={content.ctaLink}>
                {content.ctaText}
              </a>
            </Button>
          )}
          
          {/* New multi-button system */}
          {buttons.map((button: any, index: number) => (
            button.text && button.link ? (
              <Button 
                key={index}
                variant={button.variant === 'default' ? (styles.buttonsVariant || 'default') : button.variant} 
                size={styles.buttonsSize || 'lg'} 
                asChild
                className={`${styles.buttonsFontWeight || ''} min-w-[140px]`}
                style={{
                  ...(styles.buttonsBackgroundColor && styles.buttonsBackgroundColor !== 'default' && {
                    backgroundColor: styles.buttonsBackgroundColor
                  }),
                  ...(styles.buttonsTextColor && styles.buttonsTextColor !== 'default' && {
                    color: styles.buttonsTextColor
                  })
                }}
              >
                <a href={button.link}>
                  {button.text}
                </a>
              </Button>
            ) : null
          ))}
        </div>
      );
    };
    
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
    
    // Handle background based on backgroundType
    const backgroundType = styles.backgroundType || 'default';
    
    if (backgroundType === 'solid' && styles.customBackgroundColor && styles.customBackgroundColor !== 'default') {
      inlineStyles.backgroundColor = styles.customBackgroundColor;
    } else if (backgroundType === 'none') {
      inlineStyles.backgroundColor = 'transparent';
    } else if (styles.customBackgroundColor && styles.customBackgroundColor !== 'default' && backgroundType !== 'default') {
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

    // Shared height function for all block types
    const getHeightClass = (height: string, blockType: string) => {
      switch (height) {
        case 'small': return blockType === 'hero' ? 'py-12 min-h-[240px]' : 'py-6';
        case 'medium': return blockType === 'hero' ? 'py-16 min-h-[400px]' : 'py-12';
        case 'large': return blockType === 'hero' ? 'py-20 min-h-[480px]' : 'py-16';
        case 'xl': return blockType === 'hero' ? 'py-24 min-h-[560px]' : 'py-20';
        case '2xl': return blockType === 'hero' ? 'py-28 min-h-[640px]' : 'py-24';
        case 'screen': return blockType === 'hero' ? 'py-32 min-h-screen' : 'py-32';
        default: return blockType === 'hero' ? 'py-20 min-h-[320px]' : 'py-8';
      }
    };

    // Shared background image handler
    const getBackgroundStyles = (content: any) => {
      if (!content?.backgroundImage) return {};
      
      if (content.parallax) {
        return {
          backgroundImage: `url(${content.backgroundImage})`,
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        };
      } else {
        return {
          backgroundImage: `url(${content.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        };
      }
    };

    switch (block.type) {
      case 'hero':        
        // Determine background styles
        let heroBackgroundClasses = '';
        let heroBackgroundStyles: React.CSSProperties = {};
        
        if (block.content.backgroundImage) {
          heroBackgroundStyles = getBackgroundStyles(block.content);
          heroBackgroundClasses = 'relative';
        } else if (backgroundType === 'default' || backgroundType === 'gradient') {
          heroBackgroundClasses = 'bg-gradient-to-r from-primary to-primary-glow';
        }
        
        return (
          <div 
            className={`relative ${heroBackgroundClasses} text-white px-8 text-center rounded-lg ${getHeightClass(block.content.height, 'hero')} flex items-center justify-center ${styleClasses}`}
            style={{...inlineStyles, ...heroBackgroundStyles}}
          >
            {/* Dark overlay for background images to ensure text readability */}
            {block.content.backgroundImage && (
              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
            )}
             <div className="relative z-10 max-w-4xl mx-auto">
              <h1 className={`${getTitleFontSize(styles)} font-bold ${getTitleSpacing(styles)}`}>
                {block.content.title || 'Hero Title'}
              </h1>
              <p className={`${getSubtitleFontSize(styles)} mb-8 opacity-90`}>
                {block.content.subtitle || 'Hero subtitle'}
              </p>
               {renderButtons(block.content, styles)}
             </div>
           </div>
         );

      case 'section':
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
            <div className={`relative z-10 ${block.content.backgroundImage ? '' : ''}`}>
              {block.content.title && (
                <h2 className={`${getTitleFontSize(styles)} font-bold ${getTitleSpacing(styles)} text-center`}>
                  {block.content.title}
                </h2>
              )}
              {block.content.content && (
                <div className={`prose ${getContentFontSize(styles) ? '' : 'prose-lg'} mx-auto max-w-4xl mb-8`}>
                  <p className={getContentFontSize(styles) || ''}>{block.content.content}</p>
                </div>
              )}
              {renderButtons(block.content, styles)}
            </div>
          </div>
        );

      case 'text':
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
            <div className="relative z-10">
              {block.content.title && (
                <h3 className={`${getTitleFontSize(styles)} font-semibold ${getTitleSpacing(styles)}`}>
                  {block.content.title}
                </h3>
              )}
              {block.content.content && (
                <div className="prose max-w-none mb-8">
                  <p className={getContentFontSize(styles) || ''}>{block.content.content}</p>
                </div>
              )}
              {renderButtons(block.content, styles)}
            </div>
          </div>
        );

      case 'image':
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

      case 'video':
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