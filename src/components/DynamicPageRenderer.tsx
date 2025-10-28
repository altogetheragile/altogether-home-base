import React from 'react';
import { useParams } from 'react-router-dom';
import { usePage } from '@/hooks/usePages';
import { ContentBlockRenderer } from './pageEditor/ContentBlockRenderer';
import { BlockErrorBoundary } from './blocks/BlockErrorBoundary';
import Navigation from './Navigation';
import Footer from './Footer';
import { useUserRole } from '@/hooks/useUserRole';

// Reusable loading state component
const LoadingState = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Navigation />
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
    <Footer />
  </div>
);

// Reusable page not found component
const PageNotFoundState = () => (
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

interface DynamicPageRendererProps {
  slug?: string;
}

export const DynamicPageRenderer: React.FC<DynamicPageRendererProps> = ({ slug }) => {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const effectiveSlug = slug ?? paramSlug ?? 'home';
  
  const { data: role, isLoading: roleLoading } = useUserRole();
  const isAdmin = role === 'admin';

  // Query the database for CMS page
  const { data: page, isLoading } = usePage(effectiveSlug);

  if (isLoading || roleLoading) {
    return <LoadingState />;
  }

  // Page doesn't exist
  if (!page) {
    return <PageNotFoundState />;
  }

  // Page exists but is unpublished - NOBODY can view (including admins)
  if (!page.is_published) {
    if (import.meta.env.DEV) {
      console.log(`🔒 CMS page "${slug}" is unpublished - blocking access for all users`);
    }
    return <PageNotFoundState />;
  }

  // Page is published but not in main menu - only admins can access
  if (page.show_in_main_menu === false && !isAdmin) {
    if (import.meta.env.DEV) {
      console.log(`🔒 CMS page "${slug}" is not in main menu and user is not admin - blocking access`);
    }
    return <PageNotFoundState />;
  }

  // Render CMS page with content blocks
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="flex-1">
        {page.content_blocks
          .filter(block => block.is_visible)
          .sort((a, b) => a.position - b.position)
          .map((block) => (
            <div key={block.id} className="content-block-spacing">
              <BlockErrorBoundary blockId={block.id}>
                <ContentBlockRenderer block={block} />
              </BlockErrorBoundary>
            </div>
          ))}
      </div>
      <Footer />
    </div>
  );
};