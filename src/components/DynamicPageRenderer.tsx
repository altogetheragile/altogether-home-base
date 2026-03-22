import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/config/featureFlags';
import { usePage } from '@/hooks/usePages';
import { ContentBlockRenderer } from './pageEditor/ContentBlockRenderer';
import { BlockErrorBoundary } from './blocks/BlockErrorBoundary';
import Navigation from './Navigation';
import Footer from './Footer';
import NotFound from '@/pages/NotFound';
import { useUserRole } from '@/hooks/useUserRole';

// Reusable loading state component
const LoadingState = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Navigation />
    <div id="main-content" className="flex-1 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
    return <NotFound />;
  }

  // Page exists but is unpublished - NOBODY can view (including admins)
  if (!page.is_published) {
    return <NotFound />;
  }

  // Page is published but not in main menu - only admins can access
  if (page.show_in_main_menu === false && !isAdmin) {
    return <NotFound />;
  }

  const pageTitle = page.title ? `${page.title} — Altogether Agile` : 'Altogether Agile';

  // Render CMS page with content blocks
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        {page.description && <meta name="description" content={page.description} />}
        <link rel="canonical" href={`${SITE_URL}/${effectiveSlug}`} />
        <meta property="og:title" content={pageTitle} />
        {page.description && <meta property="og:description" content={page.description} />}
        <meta property="og:url" content={`${SITE_URL}/${effectiveSlug}`} />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navigation />
      <div id="main-content" className="flex-1">
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