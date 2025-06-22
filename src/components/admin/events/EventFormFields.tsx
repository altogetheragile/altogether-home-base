
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { EventTemplate } from '@/hooks/useTemplates';

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
  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <h2 className="text-lg font-semibold mb-4">Event Details</h2>
      
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
            <p className="text-sm text-gray-500 mt-1">
              Auto-calculated based on template duration ({selectedTemplate.duration_days} days)
            </p>
          )}
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
              {locations?.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
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
          <p className="text-sm text-gray-500 mt-1">
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
              <SelectItem value="usd">USD</SelectItem>
              <SelectItem value="eur">EUR</SelectItem>
              <SelectItem value="gbp">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_published"
          checked={formData.is_published}
          onCheckedChange={(checked) => handleInputChange('is_published', checked)}
        />
        <Label htmlFor="is_published">Publish event immediately</Label>
      </div>
    </div>
  );
};

export default EventFormFields;
