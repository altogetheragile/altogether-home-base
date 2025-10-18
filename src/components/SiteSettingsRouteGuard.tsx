import React from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface SiteSettingsRouteGuardProps {
  feature: 'events' | 'blog' | 'knowledge';
  children: React.ReactNode;
}

export const SiteSettingsRouteGuard: React.FC<SiteSettingsRouteGuardProps> = ({ 
  feature, 
  children 
}) => {
  const { settings, isLoading } = useSiteSettings();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  const isEnabled = settings?.[`show_${feature}` as keyof typeof settings];
  
  if (!isEnabled) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  return <>{children}</>;
};
