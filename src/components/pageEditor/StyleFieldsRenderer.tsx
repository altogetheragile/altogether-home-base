import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
        <h4 className="text-sm font-medium mb-3">Background & Colors</h4>
        <div className="space-y-3">
          <div>
            <Label htmlFor="bg-color">Background Color</Label>
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
                <SelectItem value="bg-popover">Popover</SelectItem>
                <SelectItem value="bg-muted">Muted</SelectItem>
                <SelectItem value="bg-muted/50">Muted Light</SelectItem>
                <SelectItem value="bg-primary">Primary</SelectItem>
                <SelectItem value="bg-primary/10">Primary Light</SelectItem>
                <SelectItem value="bg-primary/5">Primary Subtle</SelectItem>
                <SelectItem value="bg-secondary">Secondary</SelectItem>
                <SelectItem value="bg-secondary/50">Secondary Light</SelectItem>
                <SelectItem value="bg-accent">Accent</SelectItem>
                <SelectItem value="bg-accent/50">Accent Light</SelectItem>
                <SelectItem value="bg-destructive">Destructive</SelectItem>
                <SelectItem value="bg-destructive/10">Destructive Light</SelectItem>
                <SelectItem value="bg-gradient-to-r from-primary to-primary/80">Primary Gradient</SelectItem>
                <SelectItem value="bg-gradient-to-r from-secondary to-accent">Secondary Gradient</SelectItem>
                <SelectItem value="bg-gradient-to-br from-primary/10 to-accent/10">Subtle Gradient</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="text-color">Text Color</Label>
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
                <SelectItem value="text-card-foreground">Card</SelectItem>
                <SelectItem value="text-popover-foreground">Popover</SelectItem>
                <SelectItem value="text-primary">Primary</SelectItem>
                <SelectItem value="text-primary-foreground">Primary Foreground</SelectItem>
                <SelectItem value="text-secondary-foreground">Secondary</SelectItem>
                <SelectItem value="text-accent-foreground">Accent</SelectItem>
                <SelectItem value="text-destructive">Destructive</SelectItem>
                <SelectItem value="text-destructive-foreground">Destructive Foreground</SelectItem>
                <SelectItem value="text-primary/80">Primary Muted</SelectItem>
                <SelectItem value="text-secondary-foreground/80">Secondary Muted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="border-color">Border & Accent</Label>
            <Select
              value={styles.borderColor || 'default'}
              onValueChange={(value) => onStyleChange('borderColor', value === 'default' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select border style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">No Border</SelectItem>
                <SelectItem value="border border-border">Default Border</SelectItem>
                <SelectItem value="border border-primary">Primary Border</SelectItem>
                <SelectItem value="border border-secondary">Secondary Border</SelectItem>
                <SelectItem value="border border-accent">Accent Border</SelectItem>
                <SelectItem value="border border-muted">Muted Border</SelectItem>
                <SelectItem value="border-2 border-primary">Primary Bold</SelectItem>
                <SelectItem value="border-l-4 border-primary">Left Accent</SelectItem>
                <SelectItem value="border-t-4 border-primary">Top Accent</SelectItem>
                <SelectItem value="shadow-sm">Light Shadow</SelectItem>
                <SelectItem value="shadow-md">Medium Shadow</SelectItem>
                <SelectItem value="shadow-lg">Large Shadow</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
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
            <Label htmlFor="font-size">Font Size</Label>
            <Select
              value={styles.fontSize || 'default'}
              onValueChange={(value) => onStyleChange('fontSize', value === 'default' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select font size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="text-sm">Small</SelectItem>
                <SelectItem value="text-base">Base</SelectItem>
                <SelectItem value="text-lg">Large</SelectItem>
                <SelectItem value="text-xl">Extra Large</SelectItem>
                <SelectItem value="text-2xl">2X Large</SelectItem>
              </SelectContent>
            </Select>
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