
import { EventTemplate } from '@/hooks/useTemplates';

interface TemplateInfoProps {
  template: EventTemplate;
}

const TemplateInfo = ({ template }: TemplateInfoProps) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-medium text-blue-900 mb-2">Using Template: {template.title}</h3>
      <p className="text-sm text-blue-700">
        Duration: {template.duration_days} day(s)
        {template.description && ` • ${template.description}`}
      </p>
    </div>
  );
};

export default TemplateInfo;
