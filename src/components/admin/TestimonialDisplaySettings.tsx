// Public testimonials display settings. Lives with the other Site Settings (in
// AdminSettings) rather than buried in the Feedback screen — it configures the public
// site, not feedback data. Writes site_settings immediately via useSiteSettings.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSiteSettings } from '@/hooks/useSiteSettings';

type ToggleField =
  | 'show_testimonial_name'
  | 'show_testimonial_first_name_only'
  | 'show_testimonial_company'
  | 'show_testimonial_rating_header';

export function TestimonialDisplaySettings() {
  const { settings, updateSettings } = useSiteSettings();
  const toggle = (field: ToggleField, value: boolean) => updateSettings({ [field]: value });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public Testimonial Display</CardTitle>
        <CardDescription>Control what information is shown on the public testimonials page</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-name">Show Name</Label>
            <p className="text-sm text-muted-foreground">Display attendee names on testimonial cards</p>
          </div>
          <Switch
            id="show-name"
            checked={settings?.show_testimonial_name ?? true}
            onCheckedChange={(checked) => toggle('show_testimonial_name', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="first-name-only">First Name Only</Label>
            <p className="text-sm text-muted-foreground">Show only first names instead of full names</p>
          </div>
          <Switch
            id="first-name-only"
            checked={settings?.show_testimonial_first_name_only ?? false}
            onCheckedChange={(checked) => toggle('show_testimonial_first_name_only', checked)}
            disabled={!(settings?.show_testimonial_name ?? true)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-company">Show Company</Label>
            <p className="text-sm text-muted-foreground">Display company and job title information</p>
          </div>
          <Switch
            id="show-company"
            checked={settings?.show_testimonial_company ?? true}
            onCheckedChange={(checked) => toggle('show_testimonial_company', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-ratings-header">Show Ratings Header</Label>
            <p className="text-sm text-muted-foreground">Display average rating in the page header</p>
          </div>
          <Switch
            id="show-ratings-header"
            checked={settings?.show_testimonial_rating_header ?? true}
            onCheckedChange={(checked) => toggle('show_testimonial_rating_header', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
