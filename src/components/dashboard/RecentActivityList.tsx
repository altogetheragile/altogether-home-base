import { useRecentUserActivity, ActivityItem } from "@/hooks/useRecentUserActivity";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { 
  FolderPlus, 
  FolderEdit, 
  FilePlus, 
  FileEdit, 
  CalendarCheck,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'project_created':
      return <FolderPlus className="h-4 w-4" />;
    case 'project_updated':
      return <FolderEdit className="h-4 w-4" />;
    case 'artifact_created':
      return <FilePlus className="h-4 w-4" />;
    case 'artifact_updated':
      return <FileEdit className="h-4 w-4" />;
    case 'event_registered':
      return <CalendarCheck className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getActivityBadge = (type: ActivityItem['type']) => {
  switch (type) {
    case 'project_created':
    case 'artifact_created':
      return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Created</Badge>;
    case 'project_updated':
    case 'artifact_updated':
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Updated</Badge>;
    case 'event_registered':
      return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">Registered</Badge>;
    default:
      return null;
  }
};

const RecentActivityList = () => {
  const { data: activities = [], isLoading } = useRecentUserActivity();
  const navigate = useNavigate();

  const handleActivityClick = (activity: ActivityItem) => {
    if (activity.metadata.artifactId && activity.metadata.projectId) {
      navigate(`/projects/${activity.metadata.projectId}/artifacts/${activity.metadata.artifactId}`);
    } else if (activity.metadata.projectId) {
      navigate(`/projects/${activity.metadata.projectId}`);
    } else if (activity.metadata.eventId) {
      navigate(`/events/${activity.metadata.eventId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-3 p-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="font-medium text-muted-foreground">No recent activity</h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Your recent actions will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => (
        <button
          key={activity.id}
          onClick={() => handleActivityClick(activity)}
          className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
        >
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm truncate">{activity.title}</span>
              {getActivityBadge(activity.type)}
            </div>
            {activity.description && (
              <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
            )}
            <p className="text-xs text-muted-foreground/70 mt-1">
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default RecentActivityList;
