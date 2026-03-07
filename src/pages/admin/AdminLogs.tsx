import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Terminal, 
  AlertTriangle, 
  Info, 
  Bug, 
  Trash2, 
  Download, 
  Search,
  Filter,
  RefreshCw,
  Calendar,
  User,
  Database
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  userId?: string;
  userEmail?: string;
  data?: any;
}

interface DatabaseLog {
  id: string;
  timestamp: string;
  event_message: string;
  error_severity: string;
  identifier: string;
}

interface AuthLog {
  id: string;
  timestamp: string;
  event_message: string;
  level: string;
  status?: string;
  path?: string;
  msg?: string;
  error?: string;
}

const AdminLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('application');
  const [appPage, setAppPage] = useState(1);
  const [dbPage, setDbPage] = useState(1);
  const [authPage, setAuthPage] = useState(1);
  const logsPageSize = 25;

  // Fetch database logs from Supabase analytics
  const { data: databaseLogs, isLoading: dbLoading, refetch: refetchDbLogs } = useQuery({
    queryKey: ['admin-database-logs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('postgres_logs')
          .select('id, timestamp, event_message, error_severity, identifier')
          .order('timestamp', { ascending: false })
          .limit(100);
        
        if (error) {
          return [];
        }
        return data as DatabaseLog[];
      } catch (error) {
        return [];
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false, // Don't retry on errors
  });

  // Fetch auth logs from Supabase analytics
  const { data: authLogs, isLoading: authLoading, refetch: refetchAuthLogs } = useQuery({
    queryKey: ['admin-auth-logs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('auth_logs')
          .select('id, timestamp, event_message, level, status, path, msg, error')
          .order('timestamp', { ascending: false })
          .limit(100);
        
        if (error) {
          return [];
        }
        return data as unknown as AuthLog[];
      } catch (error) {
        return [];
      }
    },
    refetchInterval: 30000,
    retry: false, // Don't retry on errors
  });

  // Fetch application logs from admin_logs table
  const { data: applicationLogs, isLoading: appLoading, refetch: refetchAppLogs } = useQuery({
    queryKey: ['admin-application-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('id, created_at, action, details')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      return data?.map(log => ({
        id: log.id,
        timestamp: log.created_at,
        level: 'info',
        message: log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        source: 'APPLICATION',
        data: log.details
      })) || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Application logs are now fetched from admin_logs table via useQuery above

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug':
        return <Bug className="h-4 w-4 text-gray-500" />;
      default:
        return <Terminal className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'default';
      case 'debug':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const renderPagination = (currentPage: number, setCurrentPage: (p: number) => void, totalItems: number) => {
    const totalPages = Math.ceil(totalItems / logsPageSize);
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * logsPageSize + 1}–{Math.min(currentPage * logsPageSize, totalItems)} of {totalItems}
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis');
                acc.push(p);
                return acc;
              }, [])
              .map((item, i) =>
                item === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      isActive={currentPage === item}
                      onClick={() => setCurrentPage(item as number)}
                      className="cursor-pointer"
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  const filteredApplicationLogs = (applicationLogs || []).filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const clearLogs = async () => {
    // Clear application logs from database (admin only)
    await supabase.from('admin_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    refetchAppLogs();
  };

  const exportLogs = () => {
    const allLogs = {
      application: applicationLogs,
      database: databaseLogs,
      auth: authLogs
    };
    const dataStr = JSON.stringify(allLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-logs-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
    link.click();
  };

  const refreshAll = () => {
    refetchDbLogs();
    refetchAuthLogs();
    refetchAppLogs();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end space-x-2">
        <Button onClick={refreshAll} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button onClick={exportLogs} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Log Controls */}
      <Card>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setAppPage(1); setDbPage(1); setAuthPage(1); }}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedLevel}
              onChange={(e) => { setSelectedLevel(e.target.value); setAppPage(1); }}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="all">All Levels</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
            <Button onClick={clearLogs} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setAppPage(1); setDbPage(1); setAuthPage(1); }} className="space-y-4">
        <TooltipProvider>
          <TabsList className="flex w-full h-auto min-h-[48px] p-1 gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="application" className="flex-1 flex items-center justify-center p-2 h-auto min-h-[44px]">
                  <Terminal className="h-4 w-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Application Logs</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="database" className="flex-1 flex items-center justify-center p-2 h-auto min-h-[44px]">
                  <Database className="h-4 w-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Database Logs</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="auth" className="flex-1 flex items-center justify-center p-2 h-auto min-h-[44px]">
                  <User className="h-4 w-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Auth Logs</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>
        </TooltipProvider>

        {/* Application Logs */}
        <TabsContent value="application">
          <Card>
            <CardContent>
              <div className="space-y-4">
                {filteredApplicationLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No logs found matching your criteria
                  </div>
                ) : (
                  <>
                    {filteredApplicationLogs.slice((appPage - 1) * logsPageSize, appPage * logsPageSize).map((log) => (
                      <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            {getLevelIcon(log.level)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge variant={getLevelBadgeVariant(log.level) as any}>
                                  {log.level.toUpperCase()}
                                </Badge>
                                <Badge variant="outline">{log.source}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-foreground mb-2">
                                {log.message}
                              </p>
                              {(log.data as any)?.userEmail && (
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  <span>{(log.data as any).userEmail}</span>
                                </div>
                              )}
                              {log.data && (
                                <details className="mt-2">
                                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                    View Details
                                  </summary>
                                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                                    {JSON.stringify(log.data, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {renderPagination(appPage, setAppPage, filteredApplicationLogs.length)}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Logs */}
        <TabsContent value="database">
          <Card>
            <CardContent>
              <div className="space-y-4">
                {dbLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading database logs...</p>
                  </div>
                ) : !databaseLogs || databaseLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No database logs available
                  </div>
                ) : (
                  <>
                    {databaseLogs.slice((dbPage - 1) * logsPageSize, dbPage * logsPageSize).map((log) => (
                      <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start space-x-3">
                          {getLevelIcon(log.error_severity)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge variant={getLevelBadgeVariant(log.error_severity) as any}>
                                {log.error_severity}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(Number(log.timestamp) / 1000), 'MMM dd, yyyy HH:mm:ss')}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {log.event_message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Instance: {log.identifier}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {renderPagination(dbPage, setDbPage, databaseLogs.length)}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auth Logs */}
        <TabsContent value="auth">
          <Card>
            <CardContent>
              <div className="space-y-4">
                {authLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading auth logs...</p>
                  </div>
                ) : !authLogs || authLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No auth logs available
                  </div>
                ) : (
                  <>
                    {authLogs.slice((authPage - 1) * logsPageSize, authPage * logsPageSize).map((log) => (
                      <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start space-x-3">
                          {getLevelIcon(log.level)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge variant={getLevelBadgeVariant(log.level) as any}>
                                {log.level.toUpperCase()}
                              </Badge>
                              {log.status && (
                                <Badge variant="outline">Status: {log.status}</Badge>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(Number(log.timestamp) / 1000), 'MMM dd, yyyy HH:mm:ss')}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {log.msg || log.event_message}
                            </p>
                            {log.path && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Path: {log.path}
                              </p>
                            )}
                            {log.error && (
                              <p className="text-xs text-red-600 mt-1">
                                Error: {log.error}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {renderPagination(authPage, setAuthPage, authLogs.length)}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLogs;