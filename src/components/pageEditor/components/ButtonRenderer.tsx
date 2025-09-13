import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ButtonRendererProps {
  content: any;
  styles: any;
}

export const ButtonRenderer: React.FC<ButtonRendererProps> = ({ content, styles }) => {
  // Ensure content and styles are safely accessed
  const safeContent = content || {};
  const safeStyles = styles || {};
  
  const buttons = Array.isArray(safeContent.buttons) ? safeContent.buttons : [];
  const hasLegacyCTA = typeof safeContent.ctaText === 'string' && typeof safeContent.ctaLink === 'string' && safeContent.ctaText && safeContent.ctaLink;
  
  if (buttons.length === 0 && !hasLegacyCTA) return null;
  
  // Ensure buttonSpacing is a string
  const buttonSpacing = typeof safeStyles.buttonsSpacing === 'string' ? safeStyles.buttonsSpacing : 'gap-4';
  
  return (
    <div className={`flex flex-wrap ${buttonSpacing} justify-center`}>
      {/* Legacy CTA button for hero sections */}
      {hasLegacyCTA && (
        <Button 
          variant={typeof safeStyles.buttonsVariant === 'string' ? safeStyles.buttonsVariant : 'default'} 
          size={typeof safeStyles.buttonsSize === 'string' ? safeStyles.buttonsSize : 'lg'} 
          asChild
          className={`${typeof safeStyles.ctaFontWeight === 'string' ? safeStyles.ctaFontWeight : ''} w-[200px]`}
          style={{
            ...(safeStyles.ctaBackgroundColor && typeof safeStyles.ctaBackgroundColor === 'string' && safeStyles.ctaBackgroundColor !== 'default' && {
              backgroundColor: safeStyles.ctaBackgroundColor
            }),
            ...(safeStyles.ctaTextColor && typeof safeStyles.ctaTextColor === 'string' && safeStyles.ctaTextColor !== 'default' && {
              color: safeStyles.ctaTextColor
            })
          }}
        >
          <Link to={String(safeContent.ctaLink)}>
            {String(safeContent.ctaText)}
          </Link>
        </Button>
      )}
      
      {/* New multi-button system */}
      {buttons.map((button: any, index: number) => {
        // Ensure button is an object with required string properties
        if (!button || typeof button !== 'object' || typeof button.text !== 'string' || typeof button.link !== 'string' || !button.text || !button.link) {
          return null;
        }
        
        return (
          <Button 
            key={index}
            variant={button.variant === 'default' ? (typeof safeStyles.buttonsVariant === 'string' ? safeStyles.buttonsVariant : 'default') : (typeof button.variant === 'string' ? button.variant : 'default')} 
            size={typeof safeStyles.buttonsSize === 'string' ? safeStyles.buttonsSize : 'lg'} 
            asChild
            className={`${typeof safeStyles.buttonsFontWeight === 'string' ? safeStyles.buttonsFontWeight : ''} w-[200px]`}
            style={{
              ...(safeStyles.buttonsBackgroundColor && typeof safeStyles.buttonsBackgroundColor === 'string' && safeStyles.buttonsBackgroundColor !== 'default' && {
                backgroundColor: safeStyles.buttonsBackgroundColor
              }),
              ...(safeStyles.buttonsTextColor && typeof safeStyles.buttonsTextColor === 'string' && safeStyles.buttonsTextColor !== 'default' && {
                color: safeStyles.buttonsTextColor
              })
            }}
          >
            <Link to={String(button.link)}>
              {String(button.text)}
            </Link>
          </Button>
        );
      })}
    </div>
  );
};