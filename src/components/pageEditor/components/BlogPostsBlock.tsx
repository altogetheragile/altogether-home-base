import React from 'react';
import { ContentBlock } from '@/types/page';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { UnifiedContentCard } from '@/components/content/UnifiedContentCard';
import { adaptBlogPostToUnifiedContent } from '@/utils/contentAdapters';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface BlogPostsBlockProps {
  block: ContentBlock;
}

export const BlogPostsBlock: React.FC<BlogPostsBlockProps> = ({ block }) => {
  const { settings } = useSiteSettings();
  const content = block.content || {};
  
  // Don't render if blog is disabled
  if (!settings?.show_blog) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Blog is currently unavailable</p>
      </div>
    );
  }
  
  const title = content.title || 'Latest Blog Posts';
  const limit = content.limit || 6;
  const showViewAll = content.showViewAll !== false;
  const excludeIds: string[] = content.excludeIds || [];

  const { data: posts, isLoading, error } = useBlogPosts({ limit, sortBy: 'newest' });
  const displayed = (posts || []).filter((p: any) => !excludeIds.includes(p.id)).slice(0, limit);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-64" />
          {showViewAll && <Skeleton className="h-10 w-24" />}
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Unable to load blog posts</p>
        </div>
      </div>
    );
  }

  if (!displayed || displayed.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">{title}</h2>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No blog posts available at the moment</p>
          {showViewAll && (
            <Button asChild variant="outline" className="mt-4">
              <Link to="/blog">Browse Blog</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {showViewAll && (
          <Button asChild variant="outline" className="flex items-center gap-1">
            <Link to="/blog">View All</Link>
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {displayed.map((post: any) => (
          <UnifiedContentCard key={post.id} content={adaptBlogPostToUnifiedContent(post)} />
        ))}
      </div>
    </div>
  );
};
