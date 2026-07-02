import { useRecentAdminActions } from '@/hooks/useAdminAudit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { format } from 'date-fns';
import { Shield, Eye, Edit, Trash2, Plus } from 'lucide-react';

interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  target_table: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'VIEW_PROFILE':
      return <Eye className="h-4 w-4" />;
    case 'UPDATE':
      return <Edit className="h-4 w-4" />;
    case 'DELETE':
      return <Trash2 className="h-4 w-4" />;
    case 'INSERT':
      return <Plus className="h-4 w-4" />;
    default:
      return <Shield className="h-4 w-4" />;
  }
};

const getActionBadgeVariant = (action: string) => {
  switch (action) {
    case 'VIEW_PROFILE':
      return 'default' as const;
    case 'UPDATE':
      return 'secondary' as const;
    case 'DELETE':
      return 'destructive' as const;
    case 'INSERT':
      return 'outline' as const;
    default:
      return 'default' as const;
  }
};

const columns: DataTableColumn<AuditLog>[] = [
  {
    id: 'created_at',
    header: 'Timestamp',
    sortable: true,
    sortValue: (log) => log.created_at,
    cellClassName: 'font-mono text-sm',
    cell: (log) => format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss'),
  },
  {
    id: 'action',
    header: 'Action',
    sortable: true,
    sortValue: (log) => log.action,
    cell: (log) => (
      <Badge variant={getActionBadgeVariant(log.action)} className="gap-1">
        {getActionIcon(log.action)}
        {log.action}
      </Badge>
    ),
  },
  {
    id: 'target_table',
    header: 'Table',
    sortable: true,
    sortValue: (log) => log.target_table,
    cellClassName: 'font-mono text-sm',
    cell: (log) => log.target_table,
  },
  {
    id: 'target_id',
    header: 'Target ID',
    cellClassName: 'font-mono text-xs text-muted-foreground',
    cell: (log) => (log.target_id ? log.target_id.substring(0, 8) + '...' : '-'),
  },
  {
    id: 'metadata',
    header: 'Details',
    cell: (log) =>
      log.metadata && Object.keys(log.metadata).length > 0 ? (
        <details className="cursor-pointer">
          <summary className="text-sm text-muted-foreground hover:text-foreground">
            View metadata
          </summary>
          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </details>
      ) : (
        <span className="text-sm text-muted-foreground">-</span>
      ),
  },
];

const AdminAuditLogs = () => {
  const { data: auditLogs, isLoading } = useRecentAdminActions(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Audit Logs</h1>
        <p className="text-muted-foreground mt-2">
          Track all administrative actions for security and compliance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Recent Admin Actions
          </CardTitle>
          <CardDescription>
            All administrative actions are logged for security auditing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={auditLogs as AuditLog[] | undefined}
            columns={columns}
            rowKey={(log) => log.id}
            isLoading={isLoading}
            searchable
            searchPlaceholder="Search actions, tables..."
            pageSize={25}
            emptyMessage="No audit logs found"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditLogs;
