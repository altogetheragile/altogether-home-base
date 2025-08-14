import React from 'react';
import { usePage } from '@/hooks/usePages';
import { ContentBlockRenderer } from './pageEditor/ContentBlockRenderer';
import { RecommendationsSection } from './recommendations/RecommendationsSection';
import Navigation from './Navigation';
import Footer from './Footer';

interface DynamicPageRendererProps {
  slug: string;
}

export const DynamicPageRenderer: React.FC<DynamicPageRendererProps> = ({ slug }) => {
  const { data: page, isLoading } = usePage(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!page || !page.is_published) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
            <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isHomePage = slug === 'home';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="flex-1">
        {page.content_blocks
          .filter(block => block.is_visible)
          .sort((a, b) => a.position - b.position)
          .map((block) => (
            <div key={block.id} className="content-block-spacing">
              <ContentBlockRenderer block={block} />
            </div>
          ))}
        
        {/* Add recommendations section for home page */}
        {isHomePage && (
          <div className="container mx-auto px-4 py-16 space-y-12">
            <RecommendationsSection
              title="Featured Techniques"
              contentType="technique"
              limit={6}
              showViewAll={true}
            />
            <RecommendationsSection
              title="Upcoming Events"
              contentType="event"
              limit={3}
              showViewAll={true}
            />
            <RecommendationsSection
              title="Latest Blog Posts"
              contentType="blog"
              limit={3}
              showViewAll={true}
            />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};