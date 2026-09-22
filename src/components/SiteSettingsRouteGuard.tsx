import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

/** Every module that can be switched off. One name per flag column on `site_settings`, and the
 *  guard reads `show_<feature>`, so adding a module here means adding the column and nothing else.
 *
 *  The list is the product's shape: these are the parts a site can be sold or spun up without. Not
 *  listed, and deliberately: auth, the legal pages and the admin area. A switch that can hide the
 *  way back in is a footgun, not a feature. */
export type GatedFeature =
  | 'events' | 'blog' | 'knowledge' | 'exams' | 'bookings'
  | 'about' | 'coaching' | 'contact' | 'testimonials' | 'dashboard'
  | 'ai_tools' | 'protected_projects' | 'dynamic_pages'
  | 'flow_game' | 'zoo_game' | 'scrum_game';

interface SiteSettingsRouteGuardProps {
  feature: GatedFeature;
  children: React.ReactNode;
}

export const SiteSettingsRouteGuard: React.FC<SiteSettingsRouteGuardProps> = ({
  feature,
  children
}) => {
  const { settings, isLoading } = useSiteSettings();
  const { loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const { data: userRole, isLoading: roleLoading } = useUserRole();

  const wantsPreview = searchParams.get('preview') === 'true';
  const isAdminPreview = wantsPreview && userRole === 'admin';

  // Wait for auth + role to resolve before deciding on preview access
  if (isLoading || (wantsPreview && (authLoading || roleLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const isEnabled = settings?.[`show_${feature}` as keyof typeof settings];

  if (!isEnabled && !isAdminPreview) {
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
