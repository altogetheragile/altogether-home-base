import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Eye } from 'lucide-react';
import { BlogMetadata } from '@/types/content';

interface BlogContentRendererProps {
  metadata: BlogMetadata;
  createdAt: string;
  viewCount?: number;
}

export const BlogContentRenderer: React.FC<BlogContentRendererProps> = ({ 
  metadata, 
  createdAt, 
  viewCount 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Featured Image */}
      {metadata.featured_image_url && (
        <div className="aspect-video w-full overflow-hidden rounded-lg">
          <img
            src={metadata.featured_image_url}
            alt="Blog post featured image"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Excerpt */}
      {metadata.excerpt && (
        <p className="text-sm text-muted-foreground line-clamp-3">
          {metadata.excerpt}
        </p>
      )}

      {/* Tags */}
      {metadata.blog_tags && metadata.blog_tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {metadata.blog_tags.slice(0, 3).map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
      
      {/* Meta Information */}
      <div className="flex items-center text-sm text-muted-foreground gap-4 border-t border-border pt-3">
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(metadata.published_at || createdAt)}</span>
        </div>
        {metadata.estimated_reading_time && (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{metadata.estimated_reading_time} min read</span>
          </div>
        )}
        {viewCount && viewCount > 0 && (
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{viewCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};