import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from './ColorPicker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StyleTemplateManager } from './StyleTemplateManager';

interface StyleFieldsRendererProps {
  styles: any;
  onStyleChange: (key: string, value: any) => void;
  onResetToDefault: () => void;
}

export const StyleFieldsRenderer: React.FC<StyleFieldsRendererProps> = ({
  styles,
  onStyleChange,
  onResetToDefault,
}) => {
  const handleLoadTemplate = (templateStyles: Record<string, any>) => {
    Object.entries(templateStyles).forEach(([key, value]) => {
      onStyleChange(key, value);
    });
  };

  return (
    <div className="space-y-6">
      {/* Template Manager */}
      <div className="pb-4 border-b">
        <h4 className="text-sm font-medium mb-3">Style Templates</h4>
        <StyleTemplateManager
          currentStyles={styles}
          onLoadTemplate={handleLoadTemplate}
        />
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Colors</h4>
        <Tabs defaultValue="custom" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom">Custom Colors</TabsTrigger>
            <TabsTrigger value="preset">Preset Styles</TabsTrigger>
          </TabsList>
          
          <TabsContent value="custom" className="space-y-4">
            <div>
              <Label htmlFor="background-type">Background Type</Label>
              <Select
                value={styles.backgroundType || 'default'}
                onValueChange={(value) => onStyleChange('backgroundType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select background type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="solid">Solid Color</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="none">No Background</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(styles.backgroundType === 'solid' || styles.backgroundType === 'gradient') && (
              <ColorPicker
                label="Background Color"
                value={styles.customBackgroundColor || 'default'}
                onChange={(color) => onStyleChange('customBackgroundColor', color)}
              />
            )}
            
            <ColorPicker
              label="Text Color"
              value={styles.customTextColor || 'default'}
              onChange={(color) => onStyleChange('customTextColor', color)}
            />
            
            <ColorPicker
              label="Border Color"
              value={styles.customBorderColor || 'default'}
              onChange={(color) => onStyleChange('customBorderColor', color)}
            />
          </TabsContent>
          
          <TabsContent value="preset" className="space-y-3">
            <div>
              <Label htmlFor="bg-color">Background</Label>
              <Select
                value={styles.backgroundColor || 'default'}
                onValueChange={(value) => onStyleChange('backgroundColor', value === 'default' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select background" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="bg-background">Background</SelectItem>
                  <SelectItem value="bg-card">Card</SelectItem>
                  <SelectItem value="bg-muted">Muted</SelectItem>
                  <SelectItem value="bg-primary">Primary</SelectItem>
                  <SelectItem value="bg-secondary">Secondary</SelectItem>
                  <SelectItem value="bg-accent">Accent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="text-color">Text</Label>
              <Select
                value={styles.textColor || 'default'}
                onValueChange={(value) => onStyleChange('textColor', value === 'default' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select text color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="text-foreground">Foreground</SelectItem>
                  <SelectItem value="text-muted-foreground">Muted</SelectItem>
                  <SelectItem value="text-primary">Primary</SelectItem>
                  <SelectItem value="text-secondary-foreground">Secondary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Spacing & Layout</h4>
        <div className="space-y-3">
          <div>
            <Label htmlFor="padding">Padding</Label>
            <Select
              value={styles.padding || 'default'}
              onValueChange={(value) => onStyleChange('padding', value === 'default' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select padding" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="p-4">Small (16px)</SelectItem>
                <SelectItem value="p-8">Medium (32px)</SelectItem>
                <SelectItem value="p-12">Large (48px)</SelectItem>
                <SelectItem value="p-16">Extra Large (64px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="alignment">Text Alignment</Label>
            <Select
              value={styles.textAlign || 'default'}
              onValueChange={(value) => onStyleChange('textAlign', value === 'default' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select alignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="text-left">Left</SelectItem>
                <SelectItem value="text-center">Center</SelectItem>
                <SelectItem value="text-right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="title-spacing">Title-Subtitle Spacing</Label>
            <Select
              value={styles.titleSpacing || 'default'}
              onValueChange={(value) => onStyleChange('titleSpacing', value === 'default' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select spacing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="mb-2">Very Small (8px)</SelectItem>
                <SelectItem value="mb-4">Small (16px)</SelectItem>
                <SelectItem value="mb-6">Medium (24px)</SelectItem>
                <SelectItem value="mb-8">Large (32px)</SelectItem>
                <SelectItem value="mb-12">Extra Large (48px)</SelectItem>
                <SelectItem value="mb-16">Huge (64px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Typography</h4>
        <div className="space-y-3">
          <div>
            <Label htmlFor="font-family">Font Family</Label>
            <Select
              value={styles.fontFamily || 'default'}
              onValueChange={(value) => onStyleChange('fontFamily', value === 'default' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select font family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (System)</SelectItem>
                <SelectItem value="font-sans">Sans Serif</SelectItem>
                <SelectItem value="font-serif">Serif</SelectItem>
                <SelectItem value="font-mono">Monospace</SelectItem>
                <SelectItem value="font-inter">Inter</SelectItem>
                <SelectItem value="font-roboto">Roboto</SelectItem>
                <SelectItem value="font-open-sans">Open Sans</SelectItem>
                <SelectItem value="font-lato">Lato</SelectItem>
                <SelectItem value="font-montserrat">Montserrat</SelectItem>
                <SelectItem value="font-playfair">Playfair Display</SelectItem>
                <SelectItem value="font-merriweather">Merriweather</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Selected fonts will load from Google Fonts
            </p>
          </div>
          <div>
            <Label htmlFor="title-font-size">Title Font Size</Label>
            <div className="space-y-2">
              <Select
                value={styles.titleFontSize || 'default'}
                onValueChange={(value) => onStyleChange('titleFontSize', value === 'default' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select title font size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="text-[14px]">14</SelectItem>
                  <SelectItem value="text-[16px]">16</SelectItem>
                  <SelectItem value="text-[18px]">18</SelectItem>
                  <SelectItem value="text-[21px]">21</SelectItem>
                  <SelectItem value="text-[24px]">24</SelectItem>
                  <SelectItem value="text-[28px]">28</SelectItem>
                  <SelectItem value="text-[32px]">32</SelectItem>
                  <SelectItem value="text-[36px]">36</SelectItem>
                  <SelectItem value="text-[42px]">42</SelectItem>
                  <SelectItem value="text-[48px]">48</SelectItem>
                  <SelectItem value="text-[56px]">56</SelectItem>
                  <SelectItem value="text-[64px]">64</SelectItem>
                  <SelectItem value="text-[72px]">72</SelectItem>
                  <SelectItem value="text-[80px]">80</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {styles.titleFontSize === 'custom' && (
                <Input
                  placeholder="e.g., text-5xl or text-[48px]"
                  value={styles.customTitleFontSize || ''}
                  onChange={(e) => onStyleChange('customTitleFontSize', e.target.value)}
                />
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="subtitle-font-size">Subtitle Font Size</Label>
            <div className="space-y-2">
              <Select
                value={styles.subtitleFontSize || 'default'}
                onValueChange={(value) => onStyleChange('subtitleFontSize', value === 'default' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subtitle font size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="text-[12px]">12</SelectItem>
                  <SelectItem value="text-[14px]">14</SelectItem>
                  <SelectItem value="text-[16px]">16</SelectItem>
                  <SelectItem value="text-[18px]">18</SelectItem>
                  <SelectItem value="text-[21px]">21</SelectItem>
                  <SelectItem value="text-[24px]">24</SelectItem>
                  <SelectItem value="text-[28px]">28</SelectItem>
                  <SelectItem value="text-[32px]">32</SelectItem>
                  <SelectItem value="text-[36px]">36</SelectItem>
                  <SelectItem value="text-[42px]">42</SelectItem>
                  <SelectItem value="text-[48px]">48</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {styles.subtitleFontSize === 'custom' && (
                <Input
                  placeholder="e.g., text-2xl or text-[24px]"
                  value={styles.customSubtitleFontSize || ''}
                  onChange={(e) => onStyleChange('customSubtitleFontSize', e.target.value)}
                />
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="font-weight">Font Weight</Label>
            <Select
              value={styles.fontWeight || 'default'}
              onValueChange={(value) => onStyleChange('fontWeight', value === 'default' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select font weight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="font-light">Light</SelectItem>
                <SelectItem value="font-normal">Normal</SelectItem>
                <SelectItem value="font-medium">Medium</SelectItem>
                <SelectItem value="font-semibold">Semi Bold</SelectItem>
                <SelectItem value="font-bold">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Buttons</h4>
        <div className="space-y-3">
          <div>
            <Label htmlFor="buttons-variant">Default Button Style</Label>
              <Select
                value={styles.buttonsVariant || 'default'}
                onValueChange={(value) => onStyleChange('buttonsVariant', value === 'default' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select button style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="ghost">Ghost</SelectItem>
                  <SelectItem value="destructive">Destructive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="buttons-size">Default Button Size</Label>
              <Select
                value={styles.buttonsSize || 'default'}
                onValueChange={(value) => onStyleChange('buttonsSize', value === 'default' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select button size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                  <SelectItem value="2xl">2X Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ColorPicker
              label="Default Button Background"
              value={styles.buttonsBackgroundColor || 'default'}
              onChange={(color) => onStyleChange('buttonsBackgroundColor', color)}
            />
            <ColorPicker
              label="Default Button Text Color"
              value={styles.buttonsTextColor || 'default'}
              onChange={(color) => onStyleChange('buttonsTextColor', color)}
            />
            <div>
              <Label htmlFor="buttons-font-weight">Button Text Weight</Label>
              <Select
                value={styles.buttonsFontWeight || 'default'}
                onValueChange={(value) => onStyleChange('buttonsFontWeight', value === 'default' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font weight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="font-normal">Normal</SelectItem>
                  <SelectItem value="font-medium">Medium</SelectItem>
                  <SelectItem value="font-semibold">Semi Bold</SelectItem>
                  <SelectItem value="font-bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="buttons-spacing">Button Spacing</Label>
              <Select
                value={styles.buttonsSpacing || 'default'}
                onValueChange={(value) => onStyleChange('buttonsSpacing', value === 'default' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select spacing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (16px)</SelectItem>
                  <SelectItem value="gap-2">Small (8px)</SelectItem>
                  <SelectItem value="gap-6">Large (24px)</SelectItem>
                  <SelectItem value="gap-8">Extra Large (32px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={onResetToDefault}
          className="w-full"
        >
          Reset to Default
        </Button>
      </div>
    </div>
  );
};