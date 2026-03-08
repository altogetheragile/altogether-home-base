import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const LegacyBanner = () => {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span>
        This page is being replaced. Manage courses from the new{' '}
        <Link to="/admin/courses" className="font-medium underline hover:text-amber-900">
          Courses page
        </Link>.
      </span>
    </div>
  );
};

export default LegacyBanner;
