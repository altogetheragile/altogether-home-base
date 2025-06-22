
import React from 'react';
import TemplateCard from './TemplateCard';
import { EventTemplate } from '@/hooks/useTemplates';

interface TemplatesListProps {
  templates: EventTemplate[];
  locations: any[];
  instructors: any[];
  onEditTemplate: (template: EventTemplate) => void;
  onCreateEvent: (template: EventTemplate) => void;
}

const TemplatesList: React.FC<TemplatesListProps> = ({
  templates,
  locations,
  instructors,
  onEditTemplate,
  onCreateEvent,
}) => {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No templates found matching your search.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          locations={locations}
          instructors={instructors}
          onEdit={onEditTemplate}
          onCreateEvent={onCreateEvent}
        />
      ))}
    </div>
  );
};

export default TemplatesList;
