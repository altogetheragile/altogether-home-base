import { useRecentAdminActions } from '@/hooks/useAdminAudit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Shield, Eye, Edit, Trash2, Plus } from 'lucide-react';

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
      return 'default';
    case 'UPDATE':
      return 'secondary';
    case 'DELETE':
      return 'destructive';
    case 'INSERT':
      return 'outline';
    default:
      return 'default';
  }
};

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
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !auditLogs || auditLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No audit logs found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Target ID</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)} className="gap-1">
                            {getActionIcon(log.action)}
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.target_table}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.target_id ? log.target_id.substring(0, 8) + '...' : '-'}
                        </TableCell>
                        <TableCell>
                          {log.metadata && Object.keys(log.metadata).length > 0 ? (
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
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
};

export default AdminAuditLogs;
