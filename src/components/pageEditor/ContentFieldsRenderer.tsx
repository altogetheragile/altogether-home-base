import React, { useState } from 'react';
import { ContentBlock } from '@/types/page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Plus, Trash2 } from 'lucide-react';

interface ContentFieldsRendererProps {
  blockType: ContentBlock['type'];
  content: any;
  onContentChange: (key: string, value: any) => void;
}

export const ContentFieldsRenderer: React.FC<ContentFieldsRendererProps> = ({
  blockType,
  content,
  onContentChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${blockType}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('hero-backgrounds')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('hero-backgrounds')
        .getPublicUrl(filePath);

      onContentChange('backgroundImage', publicUrl);
      toast({
        title: "Success",
        description: "Background image uploaded successfully",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeBackgroundImage = () => {
    onContentChange('backgroundImage', '');
  };

  const renderHeightControl = () => (
    <div>
      <Label htmlFor={`${blockType}-height`}>Height</Label>
      <Select
        value={content?.height || 'default'}
        onValueChange={(value) => onContentChange('height', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select height" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default</SelectItem>
          <SelectItem value="small">Small</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="large">Large</SelectItem>
          <SelectItem value="xl">Extra Large</SelectItem>
          <SelectItem value="2xl">2X Large</SelectItem>
          {blockType === 'hero' && <SelectItem value="screen">Full Screen</SelectItem>}
        </SelectContent>
      </Select>
    </div>
  );

  const renderBackgroundImageControl = () => (
    <div>
      <Label>Background Image</Label>
      {content?.backgroundImage ? (
        <div className="space-y-2">
          <div className="relative">
            <img 
              src={content.backgroundImage} 
              alt="Background" 
              className="w-full h-32 object-cover rounded-md"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={removeBackgroundImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Click the X to remove the current background image
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => document.getElementById(`${blockType}-bg-upload`)?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </Button>
            <input
              id={`${blockType}-bg-upload`}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Upload a background image (max 5MB)
          </p>
        </div>
      )}
    </div>
  );

  const renderParallaxControl = () => (
    <div className="flex items-center space-x-2">
      <input
        id={`${blockType}-parallax`}
        type="checkbox"
        checked={content?.parallax || false}
        onChange={(e) => onContentChange('parallax', e.target.checked)}
        className="rounded border-gray-300"
      />
      <Label htmlFor={`${blockType}-parallax`}>Enable parallax effect (requires background image)</Label>
    </div>
  );

  const renderButtonsControl = () => {
    const buttons = content?.buttons || [];
    
    const addButton = () => {
      const newButtons = [...buttons, { text: '', link: '', variant: 'default' }];
      onContentChange('buttons', newButtons);
    };

    const removeButton = (index: number) => {
      const newButtons = buttons.filter((_: any, i: number) => i !== index);
      onContentChange('buttons', newButtons);
    };

    const updateButton = (index: number, field: string, value: string) => {
      const newButtons = [...buttons];
      newButtons[index] = { ...newButtons[index], [field]: value };
      onContentChange('buttons', newButtons);
    };

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label>Buttons</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addButton}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Button
          </Button>
        </div>
        {buttons.length > 0 && (
          <div className="space-y-3">
            {buttons.map((button: any, index: number) => (
              <div key={index} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Button {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeButton(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`button-${index}-text`}>Button Text</Label>
                    <Input
                      id={`button-${index}-text`}
                      value={button.text || ''}
                      onChange={(e) => updateButton(index, 'text', e.target.value)}
                      placeholder="Button text"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`button-${index}-link`}>Link</Label>
                    <Input
                      id={`button-${index}-link`}
                      value={button.link || ''}
                      onChange={(e) => updateButton(index, 'link', e.target.value)}
                      placeholder="/example"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`button-${index}-variant`}>Style</Label>
                    <Select
                      value={button.variant || 'default'}
                      onValueChange={(value) => updateButton(index, 'variant', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select button style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Use Global Default</SelectItem>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="secondary">Secondary</SelectItem>
                        <SelectItem value="outline">Outline</SelectItem>
                        <SelectItem value="ghost">Ghost</SelectItem>
                        <SelectItem value="destructive">Destructive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`button-${index}-size`}>Size</Label>
                    <Select
                      value={button.size || 'default'}
                      onValueChange={(value) => updateButton(index, 'size', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select button size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Use Global Default</SelectItem>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                        <SelectItem value="xl">Extra Large</SelectItem>
                        <SelectItem value="2xl">2X Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  switch (blockType) {
    case 'hero':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="hero-title">Title</Label>
            <Input
              id="hero-title"
              value={content?.title || ''}
              onChange={(e) => onContentChange('title', e.target.value)}
              placeholder="Hero title"
            />
          </div>
          <div>
            <Label htmlFor="hero-subtitle">Subtitle</Label>
            <Input
              id="hero-subtitle"
              value={content?.subtitle || ''}
              onChange={(e) => onContentChange('subtitle', e.target.value)}
              placeholder="Hero subtitle"
            />
          </div>
          {renderHeightControl()}
          {renderBackgroundImageControl()}
          <div>
            <Label htmlFor="hero-cta-text">Call to Action Text</Label>
            <Input
              id="hero-cta-text"
              value={content?.ctaText || ''}
              onChange={(e) => onContentChange('ctaText', e.target.value)}
              placeholder="Button text"
            />
          </div>
          <div>
            <Label htmlFor="hero-cta-link">Call to Action Link</Label>
            <Input
              id="hero-cta-link"
              value={content?.ctaLink || ''}
              onChange={(e) => onContentChange('ctaLink', e.target.value)}
              placeholder="/events"
            />
          </div>
          {renderButtonsControl()}
          {renderParallaxControl()}
        </div>
      );

    case 'section':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="section-title">Section Title</Label>
            <Input
              id="section-title"
              value={content?.title || ''}
              onChange={(e) => onContentChange('title', e.target.value)}
              placeholder="Section title"
            />
          </div>
          <div>
            <Label htmlFor="section-content">Content</Label>
            <Textarea
              id="section-content"
              value={content?.content || ''}
              onChange={(e) => onContentChange('content', e.target.value)}
              placeholder="Section content"
              rows={6}
            />
          </div>
          {renderHeightControl()}
          {renderBackgroundImageControl()}
          {renderButtonsControl()}
          {renderParallaxControl()}
        </div>
      );

    case 'text':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="text-title">Title (Optional)</Label>
            <Input
              id="text-title"
              value={content?.title || ''}
              onChange={(e) => onContentChange('title', e.target.value)}
              placeholder="Text block title"
            />
          </div>
          <div>
            <Label htmlFor="text-content">Content</Label>
            <Textarea
              id="text-content"
              value={content?.content || ''}
              onChange={(e) => onContentChange('content', e.target.value)}
              placeholder="Text content"
              rows={8}
            />
          </div>
          {renderHeightControl()}
          {renderBackgroundImageControl()}
          {renderButtonsControl()}
          {renderParallaxControl()}
        </div>
      );

    case 'image':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="image-src">Image URL</Label>
            <Input
              id="image-src"
              value={content?.src || ''}
              onChange={(e) => onContentChange('src', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <Label htmlFor="image-alt">Alt Text</Label>
            <Input
              id="image-alt"
              value={content?.alt || ''}
              onChange={(e) => onContentChange('alt', e.target.value)}
              placeholder="Image description"
            />
          </div>
          <div>
            <Label htmlFor="image-caption">Caption (Optional)</Label>
            <Input
              id="image-caption"
              value={content?.caption || ''}
              onChange={(e) => onContentChange('caption', e.target.value)}
              placeholder="Image caption"
            />
          </div>
          {renderHeightControl()}
          {renderBackgroundImageControl()}
          {renderButtonsControl()}
          {renderParallaxControl()}
        </div>
      );

    case 'video':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="video-url">Video URL</Label>
            <Input
              id="video-url"
              value={content?.url || ''}
              onChange={(e) => onContentChange('url', e.target.value)}
              placeholder="https://www.youtube.com/embed/..."
            />
          </div>
          <div>
            <Label htmlFor="video-title">Title (Optional)</Label>
            <Input
              id="video-title"
              value={content?.title || ''}
              onChange={(e) => onContentChange('title', e.target.value)}
              placeholder="Video title"
            />
          </div>
          {renderHeightControl()}
          {renderBackgroundImageControl()}
          {renderButtonsControl()}
          {renderParallaxControl()}
        </div>
      );

    default:
      return null;
  }
};