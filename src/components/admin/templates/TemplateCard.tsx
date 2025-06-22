
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Copy } from 'lucide-react';

interface EventTemplate {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  default_location_id?: string;
  default_instructor_id?: string;
  created_at: string;
}

interface TemplateCardProps {
  template: EventTemplate;
  locations: any[];
  instructors: any[];
  onEdit: (template: EventTemplate) => void;
  onCreateEvent: (template: EventTemplate) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  locations,
  instructors,
  onEdit,
  onCreateEvent,
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {template.title}
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(template)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCreateEvent(template)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{template.description}</p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>Duration: {template.duration_days} day(s)</p>
          {template.default_location_id && (
            <p>Default Location: {locations.find(l => l.id === template.default_location_id)?.name}</p>
          )}
          {template.default_instructor_id && (
            <p>Default Instructor: {instructors.find(i => i.id === template.default_instructor_id)?.name}</p>
          )}
        </div>
        <Button 
          className="w-full mt-4" 
          onClick={() => onCreateEvent(template)}
        >
          Create Event from Template
        </Button>
      </CardContent>
    </Card>
  );
};

export default TemplateCard;
