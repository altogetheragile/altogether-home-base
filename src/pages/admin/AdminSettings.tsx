import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Settings, Navigation, Route, Globe } from 'lucide-react';

export default function AdminSettings() {
  const { settings, isLoading, updateSettings } = useSiteSettings();
  
  const [localSettings, setLocalSettings] = useState({
    show_events: settings?.show_events ?? false,
    show_knowledge: settings?.show_knowledge ?? false,
    show_blog: settings?.show_blog ?? false,
    show_ai_tools: settings?.show_ai_tools ?? true,
    show_contact: settings?.show_contact ?? true,
    show_admin_routes: settings?.show_admin_routes ?? true,
    show_protected_projects: settings?.show_protected_projects ?? true,
    show_dynamic_pages: settings?.show_dynamic_pages ?? true,
  });

  // Update local state when settings load
  useState(() => {
    if (settings) {
      setLocalSettings({
        show_events: settings.show_events ?? false,
        show_knowledge: settings.show_knowledge ?? false,
        show_blog: settings.show_blog ?? false,
        show_ai_tools: settings.show_ai_tools ?? true,
        show_contact: settings.show_contact ?? true,
        show_admin_routes: settings.show_admin_routes ?? true,
        show_protected_projects: settings.show_protected_projects ?? true,
        show_dynamic_pages: settings.show_dynamic_pages ?? true,
      });
    }
  });

  const handleToggle = (key: keyof typeof localSettings) => {
    setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    updateSettings(localSettings);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Site Settings</h1>
          <p className="text-muted-foreground">Control which pages and features are visible on your site</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            <CardTitle>Navigation Features</CardTitle>
          </div>
          <CardDescription>
            Toggle which pages appear in the main navigation menu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_events" className="text-base font-medium">Events</Label>
              <p className="text-sm text-muted-foreground">Show events page and navigation link</p>
            </div>
            <Switch
              id="show_events"
              checked={localSettings.show_events}
              onCheckedChange={() => handleToggle('show_events')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_knowledge" className="text-base font-medium">Knowledge Base</Label>
              <p className="text-sm text-muted-foreground">Show knowledge base page and navigation link</p>
            </div>
            <Switch
              id="show_knowledge"
              checked={localSettings.show_knowledge}
              onCheckedChange={() => handleToggle('show_knowledge')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_blog" className="text-base font-medium">Blog</Label>
              <p className="text-sm text-muted-foreground">Show blog page and navigation link</p>
            </div>
            <Switch
              id="show_blog"
              checked={localSettings.show_blog}
              onCheckedChange={() => handleToggle('show_blog')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_ai_tools" className="text-base font-medium">AI Tools</Label>
              <p className="text-sm text-muted-foreground">Show AI tools dropdown in navigation</p>
            </div>
            <Switch
              id="show_ai_tools"
              checked={localSettings.show_ai_tools}
              onCheckedChange={() => handleToggle('show_ai_tools')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_contact" className="text-base font-medium">Contact</Label>
              <p className="text-sm text-muted-foreground">Show contact page and navigation link</p>
            </div>
            <Switch
              id="show_contact"
              checked={localSettings.show_contact}
              onCheckedChange={() => handleToggle('show_contact')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            <CardTitle>System Routes</CardTitle>
          </div>
          <CardDescription>
            Control access to advanced features and routing systems
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_admin_routes" className="text-base font-medium">Admin Routes</Label>
              <p className="text-sm text-muted-foreground">Enable admin dashboard and management pages</p>
            </div>
            <Switch
              id="show_admin_routes"
              checked={localSettings.show_admin_routes}
              onCheckedChange={() => handleToggle('show_admin_routes')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_protected_projects" className="text-base font-medium">Protected Projects</Label>
              <p className="text-sm text-muted-foreground">Enable project canvas and BMC features</p>
            </div>
            <Switch
              id="show_protected_projects"
              checked={localSettings.show_protected_projects}
              onCheckedChange={() => handleToggle('show_protected_projects')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_dynamic_pages" className="text-base font-medium">Dynamic Pages</Label>
              <p className="text-sm text-muted-foreground">Enable CMS-driven dynamic page system</p>
            </div>
            <Switch
              id="show_dynamic_pages"
              checked={localSettings.show_dynamic_pages}
              onCheckedChange={() => handleToggle('show_dynamic_pages')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
