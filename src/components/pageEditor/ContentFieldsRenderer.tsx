import React, { useState } from 'react';
import { ContentBlock } from '@/types/page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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

      console.log(`Starting background image upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) for ${blockType} block`);

      const { error: uploadError } = await supabase.storage
        .from('hero-backgrounds')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Supabase storage upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('hero-backgrounds')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        console.error('Failed to get public URL for background image:', filePath);
        throw new Error('Failed to get public URL for uploaded background image');
      }

      console.log(`Background image upload successful: ${publicUrl}`);
      onContentChange('backgroundImage', publicUrl);
      toast({
        title: "Upload Successful",
        description: `Background image "${file.name}" uploaded successfully`,
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      const errorCode = error?.error || error?.code || 'UNKNOWN';
      
      console.error('Background image upload error details:', {
        message: errorMessage,
        code: errorCode,
        fileName: file.name,
        fileSize: file.size,
        blockType,
        bucket: 'hero-backgrounds',
        error
      });

      let userFriendlyMessage = "Failed to upload background image.";
      
      if (errorMessage.includes('The resource already exists')) {
        userFriendlyMessage = "A file with this name already exists. Please rename your file and try again.";
      } else if (errorMessage.includes('exceeded') || errorMessage.includes('limit')) {
        userFriendlyMessage = "File size exceeds the allowed limit (5MB max).";
      } else if (errorMessage.includes('Invalid') || errorMessage.includes('format')) {
        userFriendlyMessage = "Invalid file format or corrupted image file.";
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userFriendlyMessage = "Network error. Please check your connection and try again.";
      } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        userFriendlyMessage = "Permission denied. Please contact support.";
      } else if (errorCode === 'STORAGE_OBJECT_NOT_FOUND') {
        userFriendlyMessage = "Storage bucket not found. Please contact support.";
      }

      toast({
        title: "Upload Failed",
        description: `${userFriendlyMessage} Error: ${errorMessage}`,
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
    <div className="space-y-2">
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
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>
      {content?.height === 'custom' && (
        <div>
          <Label htmlFor={`${blockType}-custom-height`}>Custom Height</Label>
          <Input
            id={`${blockType}-custom-height`}
            value={content?.customHeight || ''}
            onChange={(e) => onContentChange('customHeight', e.target.value)}
            placeholder="e.g., 500px, 80vh, auto"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter any valid CSS height value
          </p>
        </div>
      )}
    </div>
  );

  const renderBackgroundImageControl = () => (
    <div className="space-y-3">
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
      
      {/* Background Image Properties */}
      {content?.backgroundImage && (
        <div className="space-y-3 pt-2 border-t">
          <div>
            <Label htmlFor={`${blockType}-bg-position`}>Background Position</Label>
            <Select
              value={content?.backgroundPosition || 'center'}
              onValueChange={(value) => onContentChange('backgroundPosition', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="bottom">Bottom</SelectItem>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="top left">Top Left</SelectItem>
                <SelectItem value="top right">Top Right</SelectItem>
                <SelectItem value="bottom left">Bottom Left</SelectItem>
                <SelectItem value="bottom right">Bottom Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor={`${blockType}-bg-size`}>Background Size</Label>
            <Select
              value={content?.backgroundSize || 'cover'}
              onValueChange={(value) => onContentChange('backgroundSize', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Cover (fill area)</SelectItem>
                <SelectItem value="contain">Contain (fit area)</SelectItem>
                <SelectItem value="auto">Auto (original size)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${blockType}-overlay-opacity`}>
              Overlay Opacity: {content?.overlayOpacity || 0}%
            </Label>
            <input
              id={`${blockType}-overlay-opacity`}
              type="range"
              min="0"
              max="100"
              value={content?.overlayOpacity || 0}
              onChange={(e) => onContentChange('overlayOpacity', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          {content?.overlayOpacity > 0 && (
            <div>
              <Label htmlFor={`${blockType}-overlay-color`}>Overlay Color</Label>
              <Input
                id={`${blockType}-overlay-color`}
                type="color"
                value={content?.overlayColor || '#000000'}
                onChange={(e) => onContentChange('overlayColor', e.target.value)}
              />
            </div>
          )}
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
      const newButtons = [...buttons, { text: '', link: '', variant: 'default', visible: true }];
      onContentChange('buttons', newButtons);
    };

    const removeButton = (index: number) => {
      const newButtons = buttons.filter((_: any, i: number) => i !== index);
      onContentChange('buttons', newButtons);
    };

    const updateButton = (index: number, field: string, value: string | boolean) => {
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
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Button {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`button-${index}-visible`}
                        checked={button.visible !== false}
                        onCheckedChange={(checked) => updateButton(index, 'visible', checked)}
                      />
                      <Label htmlFor={`button-${index}-visible`} className="text-xs text-muted-foreground cursor-pointer">
                        Visible
                      </Label>
                    </div>
                  </div>
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

    case 'knowledge-items':
    case 'events-list':
    case 'blog-posts':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="section-title">Section Title</Label>
            <Input
              id="section-title"
              value={content?.title || ''}
              onChange={(e) => onContentChange('title', e.target.value)}
              placeholder={
                blockType === 'knowledge-items' ? 'Knowledge Items' :
                blockType === 'events-list' ? 'Upcoming Events' :
                'Latest Blog Posts'
              }
            />
          </div>
          <div>
            <Label htmlFor="item-limit">Number of Items</Label>
            <Input
              id="item-limit"
              type="number"
              min="1"
              max="12"
              value={content?.limit || 6}
              onChange={(e) => onContentChange('limit', parseInt(e.target.value) || 6)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              How many items to show (1-12)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-view-all"
              checked={content?.showViewAll !== false}
              onCheckedChange={(checked) => onContentChange('showViewAll', checked)}
            />
            <Label htmlFor="show-view-all">Show "View All" button</Label>
          </div>
        </div>
      );

    case 'recommendations':
      return (
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg mb-4">
            <p className="text-sm text-muted-foreground">
              This block displays mixed content from multiple sources. 
              For single content type sections, use the specific block types 
              (Knowledge Items, Events List, or Blog Posts).
            </p>
          </div>
          <div>
            <Label htmlFor="recommendations-title">Section Title</Label>
            <Input
              id="recommendations-title"
              value={content?.title || ''}
              onChange={(e) => onContentChange('title', e.target.value)}
              placeholder="Recommended for You"
            />
          </div>
          <div>
            <Label>Content Types</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Select one or more content types to recommend
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contentType-technique"
                  checked={content?.contentTypes?.includes('technique') ?? false}
                  onCheckedChange={(checked) => {
                    const currentTypes = content?.contentTypes || [];
                    const newTypes = checked
                      ? [...currentTypes.filter((t: string) => t !== 'technique'), 'technique']
                      : currentTypes.filter((t: string) => t !== 'technique');
                    onContentChange('contentTypes', newTypes);
                  }}
                />
                <Label htmlFor="contentType-technique" className="font-normal cursor-pointer">
                  Knowledge Items
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contentType-event"
                  checked={content?.contentTypes?.includes('event') ?? false}
                  onCheckedChange={(checked) => {
                    const currentTypes = content?.contentTypes || [];
                    const newTypes = checked
                      ? [...currentTypes.filter((t: string) => t !== 'event'), 'event']
                      : currentTypes.filter((t: string) => t !== 'event');
                    onContentChange('contentTypes', newTypes);
                  }}
                />
                <Label htmlFor="contentType-event" className="font-normal cursor-pointer">
                  Events
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contentType-blog"
                  checked={content?.contentTypes?.includes('blog') ?? false}
                  onCheckedChange={(checked) => {
                    const currentTypes = content?.contentTypes || [];
                    const newTypes = checked
                      ? [...currentTypes.filter((t: string) => t !== 'blog'), 'blog']
                      : currentTypes.filter((t: string) => t !== 'blog');
                    onContentChange('contentTypes', newTypes);
                  }}
                />
                <Label htmlFor="contentType-blog" className="font-normal cursor-pointer">
                  Blog Posts
                </Label>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="recommendations-limit">Number of Items</Label>
            <Input
              id="recommendations-limit"
              type="number"
              min="1"
              max="12"
              value={content?.limit || 6}
              onChange={(e) => onContentChange('limit', parseInt(e.target.value) || 6)}
              placeholder="6"
            />
            <p className="text-xs text-muted-foreground mt-1">
              How many items to show (1-12)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="recommendations-show-view-all"
              checked={content?.showViewAll !== false}
              onCheckedChange={(checked) => onContentChange('showViewAll', checked)}
            />
            <Label htmlFor="recommendations-show-view-all">Show "View All" button</Label>
          </div>
        </div>
      );

    case 'testimonials-carousel':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="testimonials-title">Section Title</Label>
            <Input
              id="testimonials-title"
              value={content?.title || ''}
              onChange={(e) => onContentChange('title', e.target.value)}
              placeholder="What Our Attendees Say"
            />
          </div>
          <div>
            <Label htmlFor="testimonials-limit">Number of Items</Label>
            <Input
              id="testimonials-limit"
              type="number"
              min="1"
              max="12"
              value={content?.limit || 6}
              onChange={(e) => onContentChange('limit', parseInt(e.target.value) || 6)}
              placeholder="6"
            />
            <p className="text-xs text-muted-foreground mt-1">
              How many testimonials to show (1-12)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="testimonials-autoplay"
              checked={content?.autoPlay !== false}
              onCheckedChange={(checked) => onContentChange('autoPlay', checked)}
            />
            <Label htmlFor="testimonials-autoplay">Enable auto-play</Label>
          </div>
          {content?.autoPlay !== false && (
            <div>
              <Label htmlFor="testimonials-delay">Auto-play Delay (milliseconds)</Label>
              <Input
                id="testimonials-delay"
                type="number"
                min="1000"
                max="10000"
                step="1000"
                value={content?.autoPlayDelay || 4000}
                onChange={(e) => onContentChange('autoPlayDelay', parseInt(e.target.value) || 4000)}
                placeholder="4000"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Time between slides (1000ms = 1 second)
              </p>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Switch
              id="testimonials-arrows"
              checked={content?.showArrows !== false}
              onCheckedChange={(checked) => onContentChange('showArrows', checked)}
            />
            <Label htmlFor="testimonials-arrows">Show navigation arrows</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="testimonials-dots"
              checked={content?.showDots || false}
              onCheckedChange={(checked) => onContentChange('showDots', checked)}
            />
            <Label htmlFor="testimonials-dots">Show dots indicators</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="testimonials-only-featured"
              checked={content?.onlyFeatured || false}
              onCheckedChange={(checked) => onContentChange('onlyFeatured', checked)}
            />
            <Label htmlFor="testimonials-only-featured">Show only featured testimonials</Label>
          </div>
          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-3">Display Options</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="testimonials-show-names"
                  checked={content?.showNames !== false}
                  onCheckedChange={(checked) => onContentChange('showNames', checked)}
                />
                <Label htmlFor="testimonials-show-names">Show names</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="testimonials-show-companies"
                  checked={content?.showCompanies !== false}
                  onCheckedChange={(checked) => onContentChange('showCompanies', checked)}
                />
                <Label htmlFor="testimonials-show-companies">Show companies</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="testimonials-show-job-titles"
                  checked={content?.showJobTitles !== false}
                  onCheckedChange={(checked) => onContentChange('showJobTitles', checked)}
                />
                <Label htmlFor="testimonials-show-job-titles">Show job titles</Label>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};