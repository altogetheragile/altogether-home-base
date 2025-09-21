import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { UnifiedContent, isEventMetadata, isBlogMetadata, isKnowledgeMetadata } from '@/types/content';
import { EventContentRenderer } from './renderers/EventContentRenderer';
import { BlogContentRenderer } from './renderers/BlogContentRenderer';
import { KnowledgeContentRenderer } from './renderers/KnowledgeContentRenderer';

interface UnifiedContentCardProps {
  content: UnifiedContent;
  onAction?: (action: string, content: UnifiedContent) => void;
}

export const UnifiedContentCard: React.FC<UnifiedContentCardProps> = ({ 
  content, 
  onAction 
}) => {
  // Determine the primary color for the content type
  const getPrimaryColor = () => {
    if (content.content_type === 'event' && isEventMetadata(content.metadata)) {
      return content.metadata.event_template?.brand_color || '#3B82F6';
    }
    if (content.content_type === 'blog_post' && isBlogMetadata(content.metadata)) {
      return content.metadata.blog_categories?.color || '#10B981';
    }
    if (content.content_type === 'knowledge_item' && isKnowledgeMetadata(content.metadata)) {
      return content.metadata.knowledge_categories?.color || '#F59E0B';
    }
    return '#6366F1';
  };

  // Get the display title (knowledge items use 'name')
  const getDisplayTitle = () => {
    if (content.content_type === 'knowledge_item' && isKnowledgeMetadata(content.metadata)) {
      return content.metadata.name || content.title;
    }
    return content.title;
  };

  // Get the route path
  const getRoutePath = () => {
    const routes = {
      event: '/events',
      blog_post: '/blog',
      knowledge_item: '/knowledge'
    };
    return `${routes[content.content_type]}/${content.slug}`;
  };

  // Get action button text
  const getActionText = () => {
    const actions = {
      event: 'View Details',
      blog_post: 'Read More',
      knowledge_item: 'Learn More'
    };
    return actions[content.content_type];
  };

  const primaryColor = getPrimaryColor();

  return (
    <Card className="group border-border hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
      {/* Content-type branded header accent */}
      <div 
        className="h-1 w-full"
        style={{ backgroundColor: primaryColor }}
      />
      
      <CardHeader className="flex-none">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap gap-2">
            {/* Content type badge */}
            <Badge 
              variant="secondary"
              style={{ 
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
                borderColor: `${primaryColor}30`
              }}
            >
              {content.content_type.replace('_', ' ')}
            </Badge>
            
            {/* Featured badge */}
            {content.is_featured && (
              <Badge variant="default">
                Featured
              </Badge>
            )}
          </div>
        </div>
        
        <CardTitle className="text-xl group-hover:text-primary transition-colors leading-tight">
          <Link 
            to={getRoutePath()} 
            className="hover:text-primary transition-colors"
          >
            {getDisplayTitle()}
          </Link>
        </CardTitle>
        
        {content.description && (
          <CardDescription className="line-clamp-3 leading-relaxed">
            {content.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 mb-6">
          {/* Type-specific content renderers */}
          {content.content_type === 'event' && isEventMetadata(content.metadata) && (
            <EventContentRenderer metadata={content.metadata} />
          )}
          
          {content.content_type === 'blog_post' && isBlogMetadata(content.metadata) && (
            <BlogContentRenderer 
              metadata={content.metadata} 
              createdAt={content.created_at}
              viewCount={content.view_count}
            />
          )}
          
          {content.content_type === 'knowledge_item' && isKnowledgeMetadata(content.metadata) && (
            <KnowledgeContentRenderer 
              metadata={content.metadata} 
              updatedAt={content.updated_at}
              viewCount={content.view_count}
            />
          )}
        </div>
        
        {/* Action Button */}
        <div className="flex-none">
          <Button 
            variant="outline" 
            className="w-full hover:shadow-md transition-shadow"
            style={{
              borderColor: `${primaryColor}30`,
              color: primaryColor
            }}
            asChild
          >
            <Link to={getRoutePath()}>
              {getActionText()}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};