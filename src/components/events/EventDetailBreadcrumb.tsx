
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const EventDetailBreadcrumb = () => {
  return (
    <div className="bg-muted/50 py-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          to="/events" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3 mr-1" />
          Back to Events
        </Link>
      </div>
    </div>
  );
};

export default EventDetailBreadcrumb;
