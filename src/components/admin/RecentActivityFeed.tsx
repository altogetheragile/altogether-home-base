import { useRecentAdminActions } from "@/hooks/useAdminAudit";
import { formatDistanceToNow } from "date-fns";
import { 
  Eye, 
  Plus, 
  Edit, 
  Trash, 
  FileText,
  Calendar,
  BookOpen,
  User,
  Shield,
  Activity
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const RecentActivityFeed = () => {
  const { data: recentActions = [], isLoading } = useRecentAdminActions(10);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'VIEW':
      case 'VIEW_PROFILE':
        return Eye;
      case 'CREATE':
      case 'INSERT':
        return Plus;
      case 'UPDATE':
        return Edit;
      case 'DELETE':
        return Trash;
      default:
        return FileText;
    }
  };

  const getTableIcon = (table: string) => {
    if (table.includes('event')) return Calendar;
    if (table.includes('knowledge')) return BookOpen;
    if (table.includes('profile') || table.includes('user')) return User;
    return FileText;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'VIEW':
      case 'VIEW_PROFILE':
        return 'bg-blue-100 text-blue-700';
      case 'CREATE':
      case 'INSERT':
        return 'bg-green-100 text-green-700';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-700';
      case 'DELETE':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatActionText = (action: string, table: string) => {
    const formattedTable = table.replace(/_/g, ' ').replace(/s$/, '');
    const actionText = action.replace(/_/g, ' ').toLowerCase();
    return `${actionText} ${formattedTable}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recentActions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No recent admin activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentActions.map((action) => {
        const ActionIcon = getActionIcon(action.action);
        const TableIcon = getTableIcon(action.target_table);
        
        return (
          <div 
            key={action.id} 
            className="flex items-start space-x-3 pb-3 border-b border-border last:border-0 last:pb-0"
          >
            <div className={`p-2 rounded-full ${getActionColor(action.action)}`}>
              <ActionIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <TableIcon className="h-3 w-3 text-muted-foreground" />
                <p className="text-sm font-medium capitalize">
                  {formatActionText(action.action, action.target_table)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
              </p>
              {action.target_id && (
                <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                  ID: {action.target_id.slice(0, 8)}...
                </p>
              )}
            </div>
            <Shield className="h-3 w-3 text-primary flex-shrink-0" />
          </div>
        );
      })}
    </div>
  );
};

export default RecentActivityFeed;
