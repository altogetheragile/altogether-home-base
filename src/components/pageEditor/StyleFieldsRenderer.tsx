import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from './ColorPicker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  return (
    <div className="space-y-6">
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
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Typography</h4>
        <div className="space-y-3">
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
                  <SelectItem value="text-lg">Small</SelectItem>
                  <SelectItem value="text-xl">Medium</SelectItem>
                  <SelectItem value="text-2xl">Large</SelectItem>
                  <SelectItem value="text-3xl">Extra Large</SelectItem>
                  <SelectItem value="text-4xl">2X Large</SelectItem>
                  <SelectItem value="text-5xl">3X Large</SelectItem>
                  <SelectItem value="text-6xl">4X Large</SelectItem>
                  <SelectItem value="text-7xl">5X Large</SelectItem>
                  <SelectItem value="text-8xl">6X Large</SelectItem>
                  <SelectItem value="text-9xl">Huge</SelectItem>
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
                  <SelectItem value="text-sm">Extra Small</SelectItem>
                  <SelectItem value="text-base">Small</SelectItem>
                  <SelectItem value="text-lg">Medium</SelectItem>
                  <SelectItem value="text-xl">Large</SelectItem>
                  <SelectItem value="text-2xl">Extra Large</SelectItem>
                  <SelectItem value="text-3xl">2X Large</SelectItem>
                  <SelectItem value="text-4xl">3X Large</SelectItem>
                  <SelectItem value="text-5xl">4X Large</SelectItem>
                  <SelectItem value="text-6xl">5X Large</SelectItem>
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
        <h4 className="text-sm font-medium mb-3">Call to Action Button</h4>
        <div className="space-y-3">
          <div>
            <Label htmlFor="cta-variant">Button Style</Label>
            <Select
              value={styles.ctaVariant || 'default'}
              onValueChange={(value) => onStyleChange('ctaVariant', value === 'default' ? '' : value)}
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
            <Label htmlFor="cta-size">Button Size</Label>
            <Select
              value={styles.ctaSize || 'default'}
              onValueChange={(value) => onStyleChange('ctaSize', value === 'default' ? '' : value)}
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
            label="Button Background Color"
            value={styles.ctaBackgroundColor || 'default'}
            onChange={(color) => onStyleChange('ctaBackgroundColor', color)}
          />
          <ColorPicker
            label="Button Text Color"
            value={styles.ctaTextColor || 'default'}
            onChange={(color) => onStyleChange('ctaTextColor', color)}
          />
          <div>
            <Label htmlFor="cta-font-weight">Button Text Weight</Label>
            <Select
              value={styles.ctaFontWeight || 'default'}
              onValueChange={(value) => onStyleChange('ctaFontWeight', value === 'default' ? '' : value)}
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