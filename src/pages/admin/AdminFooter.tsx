import { useState } from 'react';
import { useSiteSettings, QuickLink } from '@/hooks/useSiteSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';

const AdminFooter = () => {
  const { settings, isLoading, updateSettings } = useSiteSettings();
  const [formData, setFormData] = useState<any>({});
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);

  // Initialize form data when settings load
  useState(() => {
    if (settings && Object.keys(formData).length === 0) {
      setFormData(settings);
      setQuickLinks((settings.quick_links as QuickLink[]) || []);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...formData,
      quick_links: quickLinks,
    });
  };

  const addQuickLink = () => {
    setQuickLinks([...quickLinks, { label: '', url: '', enabled: true }]);
  };

  const removeQuickLink = (index: number) => {
    setQuickLinks(quickLinks.filter((_, i) => i !== index));
  };

  const updateQuickLink = (index: number, field: keyof QuickLink, value: any) => {
    const updated = [...quickLinks];
    updated[index] = { ...updated[index], [field]: value };
    setQuickLinks(updated);
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Footer Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure the footer content displayed across your site
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList>
            <TabsTrigger value="company">Company Info</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="links">Quick Links</TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Update your company details shown in the footer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name || ''}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="AltogetherAgile"
                  />
                </div>
                <div>
                  <Label htmlFor="company_description">Description</Label>
                  <Textarea
                    id="company_description"
                    value={formData.company_description || ''}
                    onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
                    placeholder="Brief description of your company"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="copyright_text">Copyright Text</Label>
                  <Input
                    id="copyright_text"
                    value={formData.copyright_text || ''}
                    onChange={(e) => setFormData({ ...formData, copyright_text: e.target.value })}
                    placeholder="All rights reserved."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Add contact details (all optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email || ''}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="contact@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone || ''}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_location">Location</Label>
                  <Input
                    id="contact_location"
                    value={formData.contact_location || ''}
                    onChange={(e) => setFormData({ ...formData, contact_location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
                <CardDescription>Add your social media profile URLs (all optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="social_linkedin">LinkedIn</Label>
                  <Input
                    id="social_linkedin"
                    value={formData.social_linkedin || ''}
                    onChange={(e) => setFormData({ ...formData, social_linkedin: e.target.value })}
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
                <div>
                  <Label htmlFor="social_twitter">Twitter</Label>
                  <Input
                    id="social_twitter"
                    value={formData.social_twitter || ''}
                    onChange={(e) => setFormData({ ...formData, social_twitter: e.target.value })}
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div>
                  <Label htmlFor="social_facebook">Facebook</Label>
                  <Input
                    id="social_facebook"
                    value={formData.social_facebook || ''}
                    onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <Label htmlFor="social_youtube">YouTube</Label>
                  <Input
                    id="social_youtube"
                    value={formData.social_youtube || ''}
                    onChange={(e) => setFormData({ ...formData, social_youtube: e.target.value })}
                    placeholder="https://youtube.com/@..."
                  />
                </div>
                <div>
                  <Label htmlFor="social_github">GitHub</Label>
                  <Input
                    id="social_github"
                    value={formData.social_github || ''}
                    onChange={(e) => setFormData({ ...formData, social_github: e.target.value })}
                    placeholder="https://github.com/..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links">
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
                <CardDescription>Manage navigation links in the footer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {quickLinks.map((link, index) => (
                  <div key={index} className="flex gap-4 items-end p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label htmlFor={`link-label-${index}`}>Label</Label>
                      <Input
                        id={`link-label-${index}`}
                        value={link.label}
                        onChange={(e) => updateQuickLink(index, 'label', e.target.value)}
                        placeholder="Home"
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`link-url-${index}`}>URL</Label>
                      <Input
                        id={`link-url-${index}`}
                        value={link.url}
                        onChange={(e) => updateQuickLink(index, 'url', e.target.value)}
                        placeholder="/home"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={link.enabled}
                        onCheckedChange={(checked) => updateQuickLink(index, 'enabled', checked)}
                      />
                      <Label>Enabled</Label>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeQuickLink(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addQuickLink} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Link
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button type="submit" size="lg">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminFooter;
