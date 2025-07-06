import React from 'react';
import { ContentBlock } from '@/types/page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
        </div>
      );

    default:
      return null;
  }
};