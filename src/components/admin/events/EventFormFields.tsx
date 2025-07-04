
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventTemplate } from '@/hooks/useTemplates';
import { useEventTypes } from '@/hooks/useEventTypes';
import { useEventCategories } from '@/hooks/useEventCategories';
import { useLevels } from '@/hooks/useLevels';
import { useFormats } from '@/hooks/useFormats';

interface EventFormFieldsProps {
  formData: {
    title: string;
    description: string;
    start_date: string;
    end_date: string;  
    instructor_id: string;
    location_id: string;
    price_cents: number;
    currency: string;
    is_published: boolean;
    capacity: string;
    registration_deadline: string;
    time_zone: string;
    meeting_link: string;
    venue_details: string;
    daily_schedule: string;
    banner_image_url: string;
    seo_slug: string;
    tags: string;
    internal_notes: string;
    course_code: string;
    status: string;
    expected_revenue_cents: number;
    lead_source: string;
    event_type_id: string;
    category_id: string;
    level_id: string;
    format_id: string;
  };
  selectedTemplate: EventTemplate | null;
  instructors: any[];
  locations: any[];
  handleInputChange: (field: string, value: any) => void;
}

const EventFormFields = ({
  formData,
  selectedTemplate,
  instructors,
  locations,
  handleInputChange,
}: EventFormFieldsProps) => {
  const { data: eventTypes } = useEventTypes();
  const { data: categories } = useEventCategories();
  const { data: levels } = useLevels();
  const { data: formats } = useFormats();

  return (
    <div className="bg-background p-6 rounded-lg border space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="logistics">Logistics</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="admin">Administration</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-6">
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter event title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the event"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Event Type</Label>
              <Select 
                value={formData.event_type_id} 
                onValueChange={(value) => handleInputChange('event_type_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No event type</SelectItem>
                  {eventTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => handleInputChange('category_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Audience Level</Label>
              <Select 
                value={formData.level_id} 
                onValueChange={(value) => handleInputChange('level_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No level</SelectItem>
                  {levels?.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Format</Label>
              <Select 
                value={formData.format_id} 
                onValueChange={(value) => handleInputChange('format_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No format</SelectItem>
                  {formats?.map((format) => (
                    <SelectItem key={format.id} value={format.id}>
                      {format.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (in cents)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={formData.price_cents}
                onChange={(e) => handleInputChange('price_cents', parseInt(e.target.value) || 0)}
                placeholder="0 for free"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter price in cents (e.g., 2500 for $25.00)
              </p>
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD ($)</SelectItem>
                  <SelectItem value="eur">EUR (€)</SelectItem>
                  <SelectItem value="gbp">GBP (£)</SelectItem>
                  <SelectItem value="cad">CAD (C$)</SelectItem>
                  <SelectItem value="aud">AUD (A$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logistics" className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
              />
              {selectedTemplate?.duration_days && (
                <p className="text-sm text-muted-foreground mt-1">
                  Auto-calculated based on template duration ({selectedTemplate.duration_days} days)
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="capacity">Max Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="registration_deadline">Registration Deadline</Label>
              <Input
                id="registration_deadline"
                type="date"
                value={formData.registration_deadline}
                onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Instructor</Label>
              <Select value={formData.instructor_id} onValueChange={(value) => handleInputChange('instructor_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select instructor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No instructor</SelectItem>
                  {instructors?.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Select value={formData.location_id} onValueChange={(value) => handleInputChange('location_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No location</SelectItem>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="time_zone">Time Zone</Label>
            <Input
              id="time_zone"
              value={formData.time_zone}
              onChange={(e) => handleInputChange('time_zone', e.target.value)}
              placeholder="e.g., America/New_York, Europe/London"
            />
          </div>

          {/* Conditional fields based on format */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="meeting_link">Meeting Link (for online/hybrid events)</Label>
              <Input
                id="meeting_link"
                type="url"
                value={formData.meeting_link}
                onChange={(e) => handleInputChange('meeting_link', e.target.value)}
                placeholder="https://zoom.us/j/..."
              />
            </div>
            <div>
              <Label htmlFor="venue_details">Venue Details (for in-person/hybrid events)</Label>
              <Textarea
                id="venue_details"
                value={formData.venue_details}
                onChange={(e) => handleInputChange('venue_details', e.target.value)}
                placeholder="Full address, room number, parking info, etc."
                rows={3}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="daily_schedule">Daily Schedule</Label>
            <Textarea
              id="daily_schedule"
              value={formData.daily_schedule}
              onChange={(e) => handleInputChange('daily_schedule', e.target.value)}
              placeholder="e.g., 9:00 AM - 5:00 PM each day with lunch break at 12:00 PM"
              rows={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-4 mt-6">
          <div>
            <Label htmlFor="banner_image_url">Banner Image URL</Label>
            <Input
              id="banner_image_url"
              type="url"
              value={formData.banner_image_url}
              onChange={(e) => handleInputChange('banner_image_url', e.target.value)}
              placeholder="https://example.com/banner.jpg"
            />
          </div>

          <div>
            <Label htmlFor="seo_slug">SEO Slug</Label>
            <Input
              id="seo_slug"
              value={formData.seo_slug}
              onChange={(e) => handleInputChange('seo_slug', e.target.value)}
              placeholder="agile-fundamentals-workshop"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Custom URL slug for this event (lowercase, no spaces)
            </p>
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="agile, scrum, certification (comma-separated)"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Comma-separated tags for search and filtering
            </p>
          </div>

          <div>
            <Label htmlFor="lead_source">Lead Source / Campaign</Label>
            <Input
              id="lead_source"
              value={formData.lead_source}
              onChange={(e) => handleInputChange('lead_source', e.target.value)}
              placeholder="Website, LinkedIn, Partner referral, etc."
            />
          </div>

          <div>
            <Label htmlFor="expected_revenue_cents">Expected Revenue (cents)</Label>
            <Input
              id="expected_revenue_cents"
              type="number"
              min="0"
              value={formData.expected_revenue_cents}
              onChange={(e) => handleInputChange('expected_revenue_cents', parseInt(e.target.value) || 0)}
              placeholder="Auto-calculated from price × capacity"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Expected total revenue in cents
            </p>
          </div>
        </TabsContent>

        <TabsContent value="admin" className="space-y-4 mt-6">
          <div>
            <Label>Event Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="course_code">Course Code</Label>
            <Input
              id="course_code"
              value={formData.course_code}
              onChange={(e) => handleInputChange('course_code', e.target.value)}
              placeholder="Internal course identifier"
            />
          </div>

          <div>
            <Label htmlFor="internal_notes">Internal Notes</Label>
            <Textarea
              id="internal_notes"
              value={formData.internal_notes}
              onChange={(e) => handleInputChange('internal_notes', e.target.value)}
              placeholder="Private notes for administrators only"
              rows={4}
            />
            <p className="text-sm text-muted-foreground mt-1">
              These notes are not visible to participants
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_published"
              checked={formData.is_published}
              onCheckedChange={(checked) => handleInputChange('is_published', checked)}
            />
            <Label htmlFor="is_published">Published</Label>
            <p className="text-sm text-muted-foreground ml-2">
              Make this event visible to the public
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventFormFields;
