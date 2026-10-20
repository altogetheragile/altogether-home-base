import React from 'react';
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

/** How each module is named in Admin, for the banner an admin sees on a module that is off. */
const FEATURE_NAMES: Record<GatedFeature, string> = {
  events: 'Events', blog: 'Blog', knowledge: 'Knowledge', exams: 'Exams', bookings: 'Bookings',
  about: 'About', coaching: 'Coaching', contact: 'Contact', testimonials: 'Testimonials',
  dashboard: 'Dashboard', ai_tools: 'AI Tools', protected_projects: 'Projects',
  dynamic_pages: 'Dynamic Pages', flow_game: 'Flow Game', zoo_game: 'Zoo Game', scrum_game: 'Scrum Game',
};

/** A module that is switched off is a 404 to the public and open to an admin, with a banner saying
 *  so. It used to need `?preview=true` on the address, which no link carried: an initiative's own
 *  "+ Product Vision Canvas" took its admin to "Page Not Found", and every step of trying an
 *  unfinished module meant editing the URL by hand. Switching the module on to get round that would
 *  have shown the unfinished work to everyone. */
export const SiteSettingsRouteGuard: React.FC<SiteSettingsRouteGuardProps> = ({
  feature,
  children
}) => {
  const { settings, isLoading } = useSiteSettings();
  const { loading: authLoading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();

  const isEnabled = settings?.[`show_${feature}` as keyof typeof settings];

  // Only a module that is off needs to know who is asking, so only that waits for the role.
  if (isLoading || (!isEnabled && (authLoading || roleLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isEnabled) return <>{children}</>;

  if (userRole === 'admin') {
    return (
      <>
        <div role="status" className="bg-amber-100 text-amber-900 text-sm text-center px-4 py-1.5">
          Hidden from the public: {FEATURE_NAMES[feature]} is switched off in Admin.
        </div>
        {children}
      </>
    );
  }

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
};
