import React from 'react';
import { usePage } from '@/hooks/usePages';
import { ContentBlockRenderer } from './pageEditor/ContentBlockRenderer';
import Navigation from './Navigation';
import Footer from './Footer';
import { useUserRole } from '@/hooks/useUserRole';
import Events from '@/pages/Events';
import Blog from '@/pages/Blog';
import Knowledge from '@/pages/Knowledge';

// Map special page slugs to their custom components
const SPECIAL_PAGE_COMPONENTS: Record<string, React.ComponentType> = {
  'events': Events,
  'blog': Blog,
  'knowledge': Knowledge,
};

interface DynamicPageRendererProps {
  slug: string;
}

export const DynamicPageRenderer: React.FC<DynamicPageRendererProps> = ({ slug }) => {
  const { data: page, isLoading } = usePage(slug);
  const { data: role, isLoading: roleLoading } = useUserRole();
  const isAdmin = role === 'admin';

  if (isLoading || roleLoading) {
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

  // Page doesn't exist
  if (!page) {
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

  // Page exists but is unpublished - NOBODY can view (including admins)
  if (!page.is_published) {
    if (import.meta.env.DEV) {
      console.log(`🔒 Page "${slug}" is unpublished - blocking access for all users`);
    }
    
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

  // Page is published but not in main menu - only admins can access
  if (page.show_in_main_menu === false && !isAdmin) {
    if (import.meta.env.DEV) {
      console.log(`🔒 Page "${slug}" is not in main menu and user is not admin - blocking access`);
    }
    
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

  // Check if this is a special page that should use a custom component
  const SpecialComponent = SPECIAL_PAGE_COMPONENTS[slug];
  if (SpecialComponent) {
    return <SpecialComponent />;
  }

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
      </div>
      <Footer />
    </div>
  );
};