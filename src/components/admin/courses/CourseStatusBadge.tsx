import { Badge } from '@/components/ui/badge';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
  published: { label: 'Published', className: 'bg-teal-100 text-teal-700 hover:bg-teal-100' },
  scheduled: { label: 'Scheduled', className: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
};

interface CourseStatusBadgeProps {
  status: string;
}

const CourseStatusBadge = ({ status }: CourseStatusBadgeProps) => {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
};

export default CourseStatusBadge;
