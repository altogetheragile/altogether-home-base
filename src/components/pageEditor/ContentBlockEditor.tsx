import React, { useState, useEffect } from 'react';
import { ContentBlock } from '@/types/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ContentBlockEditorProps {
  block: ContentBlock | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (blockData: Partial<ContentBlock>) => void;
}

export const ContentBlockEditor: React.FC<ContentBlockEditorProps> = ({
  block,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<ContentBlock>>({});
  const [activeTab, setActiveTab] = useState<'content' | 'style'>('content');

  useEffect(() => {
    if (block) {
      setFormData(block);
    } else {
      setFormData({
        type: 'text',
        content: {},
        is_visible: true,
      });
    }
  }, [block]);

  const handleContentChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...(prev.content || {}),
        [key]: value,
      },
    }));
  };

  const handleStyleChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...(prev.content || {}),
        styles: {
          ...(prev.content?.styles || {}),
          [key]: value,
        },
      },
    }));
  };

  const resetToDefault = () => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...(prev.content || {}),
        styles: {},
      },
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const renderStyleFields = () => {
    const styles = formData.content?.styles || {};
    
    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-3">Background & Colors</h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="bg-color">Background Color</Label>
              <Select
                value={styles.backgroundColor || 'default'}
                onValueChange={(value) => handleStyleChange('backgroundColor', value === 'default' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select background" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="bg-background">Background</SelectItem>
                  <SelectItem value="bg-muted">Muted</SelectItem>
                  <SelectItem value="bg-primary/5">Primary Light</SelectItem>
                  <SelectItem value="bg-secondary">Secondary</SelectItem>
                  <SelectItem value="bg-accent">Accent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="text-color">Text Color</Label>
              <Select
                value={styles.textColor || 'default'}
                onValueChange={(value) => handleStyleChange('textColor', value === 'default' ? '' : value)}
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
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3">Spacing & Layout</h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="padding">Padding</Label>
              <Select
                value={styles.padding || 'default'}
                onValueChange={(value) => handleStyleChange('padding', value === 'default' ? '' : value)}
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
                onValueChange={(value) => handleStyleChange('textAlign', value === 'default' ? '' : value)}
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
                onValueChange={(value) => handleStyleChange('fontSize', value === 'default' ? '' : value)}
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
                onValueChange={(value) => handleStyleChange('fontWeight', value === 'default' ? '' : value)}
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
            onClick={resetToDefault}
            className="w-full"
          >
            Reset to Default
          </Button>
        </div>
      </div>
    );
  };

  const renderContentFields = () => {
    switch (formData.type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="hero-title">Title</Label>
              <Input
                id="hero-title"
                value={formData.content?.title || ''}
                onChange={(e) => handleContentChange('title', e.target.value)}
                placeholder="Hero title"
              />
            </div>
            <div>
              <Label htmlFor="hero-subtitle">Subtitle</Label>
              <Input
                id="hero-subtitle"
                value={formData.content?.subtitle || ''}
                onChange={(e) => handleContentChange('subtitle', e.target.value)}
                placeholder="Hero subtitle"
              />
            </div>
            <div>
              <Label htmlFor="hero-cta-text">Call to Action Text</Label>
              <Input
                id="hero-cta-text"
                value={formData.content?.ctaText || ''}
                onChange={(e) => handleContentChange('ctaText', e.target.value)}
                placeholder="Button text"
              />
            </div>
            <div>
              <Label htmlFor="hero-cta-link">Call to Action Link</Label>
              <Input
                id="hero-cta-link"
                value={formData.content?.ctaLink || ''}
                onChange={(e) => handleContentChange('ctaLink', e.target.value)}
                placeholder="/events"
              />
            </div>
          </div>
        );

      case 'section':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="section-title">Section Title</Label>
              <Input
                id="section-title"
                value={formData.content?.title || ''}
                onChange={(e) => handleContentChange('title', e.target.value)}
                placeholder="Section title"
              />
            </div>
            <div>
              <Label htmlFor="section-content">Content</Label>
              <Textarea
                id="section-content"
                value={formData.content?.content || ''}
                onChange={(e) => handleContentChange('content', e.target.value)}
                placeholder="Section content"
                rows={6}
              />
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text-title">Title (Optional)</Label>
              <Input
                id="text-title"
                value={formData.content?.title || ''}
                onChange={(e) => handleContentChange('title', e.target.value)}
                placeholder="Text block title"
              />
            </div>
            <div>
              <Label htmlFor="text-content">Content</Label>
              <Textarea
                id="text-content"
                value={formData.content?.content || ''}
                onChange={(e) => handleContentChange('content', e.target.value)}
                placeholder="Text content"
                rows={8}
              />
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-src">Image URL</Label>
              <Input
                id="image-src"
                value={formData.content?.src || ''}
                onChange={(e) => handleContentChange('src', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <Label htmlFor="image-alt">Alt Text</Label>
              <Input
                id="image-alt"
                value={formData.content?.alt || ''}
                onChange={(e) => handleContentChange('alt', e.target.value)}
                placeholder="Image description"
              />
            </div>
            <div>
              <Label htmlFor="image-caption">Caption (Optional)</Label>
              <Input
                id="image-caption"
                value={formData.content?.caption || ''}
                onChange={(e) => handleContentChange('caption', e.target.value)}
                placeholder="Image caption"
              />
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                value={formData.content?.url || ''}
                onChange={(e) => handleContentChange('url', e.target.value)}
                placeholder="https://www.youtube.com/embed/..."
              />
            </div>
            <div>
              <Label htmlFor="video-title">Title (Optional)</Label>
              <Input
                id="video-title"
                value={formData.content?.title || ''}
                onChange={(e) => handleContentChange('title', e.target.value)}
                placeholder="Video title"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {block ? 'Edit Content Block' : 'Add Content Block'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'content' | 'style')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-6">
            <div>
              <Label htmlFor="block-type">Block Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: ContentBlock['type']) => 
                  setFormData(prev => ({ ...prev, type: value, content: {} }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">Hero Section</SelectItem>
                  <SelectItem value="section">Section</SelectItem>
                  <SelectItem value="text">Text Block</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {renderContentFields()}

            <div className="flex items-center space-x-2">
              <Switch
                id="visibility"
                checked={formData.is_visible}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_visible: checked }))
                }
              />
              <Label htmlFor="visibility">Visible on page</Label>
            </div>
          </TabsContent>
          
          <TabsContent value="style" className="space-y-6">
            {renderStyleFields()}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {block ? 'Update' : 'Add'} Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};