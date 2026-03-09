import React from 'react';
import { ContentBlock } from '@/types/page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ButtonsArrayEditor } from './components/ButtonsArrayEditor';
import { BackgroundImageControl } from './components/BackgroundImageControl';

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
          <BackgroundImageControl blockType={blockType} content={content} onContentChange={onContentChange} />
          <ButtonsArrayEditor content={content} onContentChange={onContentChange} />
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
          <BackgroundImageControl blockType={blockType} content={content} onContentChange={onContentChange} />
          <ButtonsArrayEditor content={content} onContentChange={onContentChange} />
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
          <BackgroundImageControl blockType={blockType} content={content} onContentChange={onContentChange} />
          <ButtonsArrayEditor content={content} onContentChange={onContentChange} />
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
          <BackgroundImageControl blockType={blockType} content={content} onContentChange={onContentChange} />
          <ButtonsArrayEditor content={content} onContentChange={onContentChange} />
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
          <BackgroundImageControl blockType={blockType} content={content} onContentChange={onContentChange} />
          <ButtonsArrayEditor content={content} onContentChange={onContentChange} />
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