import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Eye, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BlogPost } from '@/hooks/useBlogPosts';

interface BlogCardProps {
  post: BlogPost;
}

export const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      {post.featured_image_url && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardHeader className="flex-none">
        <div className="flex items-start justify-between gap-2 mb-2">
          {post.blog_categories && (
            <Badge 
              variant="secondary" 
              style={{ 
                backgroundColor: `${post.blog_categories.color}20`, 
                color: post.blog_categories.color 
              }}
            >
              {post.blog_categories.name}
            </Badge>
          )}
          {post.is_featured && (
            <Badge variant="default">Featured</Badge>
          )}
        </div>
        
        <CardTitle className="text-xl leading-tight">
          <Link 
            to={`/blog/${post.slug}`} 
            className="hover:text-primary transition-colors"
          >
            {post.title}
          </Link>
        </CardTitle>
        
        {post.excerpt && (
          <CardDescription className="text-sm">
            {post.excerpt}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {/* Tags */}
        {post.blog_tags && post.blog_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {post.blog_tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Meta Information */}
        <div className="flex items-center text-sm text-muted-foreground mb-4 gap-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(post.published_at || post.created_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{post.estimated_reading_time} min read</span>
          </div>
          {post.view_count > 0 && (
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{post.view_count}</span>
            </div>
          )}
        </div>
        
        {/* Read More Button */}
        <div className="mt-auto">
          <Button variant="outline" className="w-full" asChild>
            <Link to={`/blog/${post.slug}`}>
              Read More
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};