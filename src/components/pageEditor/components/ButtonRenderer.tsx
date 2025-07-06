import React from 'react';
import { Button } from '@/components/ui/button';

interface ButtonRendererProps {
  content: any;
  styles: any;
}

export const ButtonRenderer: React.FC<ButtonRendererProps> = ({ content, styles }) => {
  const buttons = content?.buttons || [];
  const hasLegacyCTA = content?.ctaText && content?.ctaLink;
  
  if (buttons.length === 0 && !hasLegacyCTA) return null;
  
  const buttonSpacing = styles.buttonsSpacing || 'gap-4';
  
  return (
    <div className={`flex flex-wrap ${buttonSpacing} justify-center`}>
      {/* Legacy CTA button for hero sections */}
      {hasLegacyCTA && (
        <Button 
          variant={styles.buttonsVariant || 'default'} 
          size={styles.buttonsSize || 'lg'} 
          asChild
          className={`${styles.ctaFontWeight || ''} w-[200px]`}
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
            className={`${styles.buttonsFontWeight || ''} w-[200px]`}
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