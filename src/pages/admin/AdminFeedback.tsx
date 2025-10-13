import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FeedbackImportManager from "@/components/admin/feedback/FeedbackImportManager";
import FeedbackManagementTable from "@/components/admin/feedback/FeedbackManagementTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const AdminFeedback = () => {
  const { settings, updateSettings } = useSiteSettings();

  const handleToggle = (field: 'show_testimonial_name' | 'show_testimonial_company' | 'show_testimonial_rating_header', value: boolean) => {
    updateSettings({ [field]: value });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Course Feedback Management</h1>
        <p className="text-muted-foreground">Manage course feedback, testimonials, and reviews</p>
      </div>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList>
          <TabsTrigger value="manage">Manage Feedback</TabsTrigger>
          <TabsTrigger value="import">Import Feedback</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Public Testimonial Display Settings</CardTitle>
              <CardDescription>
                Control what information is shown on the public testimonials page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-name">Show Name</Label>
                  <p className="text-sm text-muted-foreground">
                    Display attendee names on testimonial cards
                  </p>
                </div>
                <Switch 
                  id="show-name"
                  checked={settings?.show_testimonial_name ?? true}
                  onCheckedChange={(checked) => handleToggle('show_testimonial_name', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-company">Show Company</Label>
                  <p className="text-sm text-muted-foreground">
                    Display company and job title information
                  </p>
                </div>
                <Switch 
                  id="show-company"
                  checked={settings?.show_testimonial_company ?? true}
                  onCheckedChange={(checked) => handleToggle('show_testimonial_company', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-ratings-header">Show Ratings Header</Label>
                  <p className="text-sm text-muted-foreground">
                    Display average rating in the page header
                  </p>
                </div>
                <Switch 
                  id="show-ratings-header"
                  checked={settings?.show_testimonial_rating_header ?? true}
                  onCheckedChange={(checked) => handleToggle('show_testimonial_rating_header', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <FeedbackManagementTable />
        </TabsContent>
        
        <TabsContent value="import" className="space-y-4">
          <FeedbackImportManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFeedback;
