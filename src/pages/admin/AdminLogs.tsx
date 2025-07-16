import React, { useState, useEffect } from 'react';
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

  // Fetch database logs from Supabase analytics
  const { data: databaseLogs, isLoading: dbLoading, refetch: refetchDbLogs } = useQuery({
    queryKey: ['admin-database-logs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('postgres_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);
        
        if (error) {
          console.warn('Database logs query error:', error);
          return [];
        }
        return data as DatabaseLog[];
      } catch (error) {
        console.warn('Failed to fetch database logs:', error);
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
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);
        
        if (error) {
          console.warn('Auth logs query error:', error);
          return [];
        }
        return data as AuthLog[];
      } catch (error) {
        console.warn('Failed to fetch auth logs:', error);
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
        .select('*')
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          <p className="text-muted-foreground mt-2">
            Monitor application activity, database operations, and system events
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={refreshAll} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportLogs} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Log Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Log Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
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
      <Tabs defaultValue="application" className="space-y-4">
        <TabsList>
          <TabsTrigger value="application" className="flex items-center space-x-2">
            <Terminal className="h-4 w-4" />
            <span>Application Logs</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Database Logs</span>
          </TabsTrigger>
          <TabsTrigger value="auth" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Auth Logs</span>
          </TabsTrigger>
        </TabsList>

        {/* Application Logs */}
        <TabsContent value="application">
          <Card>
            <CardHeader>
              <CardTitle>Application Logs</CardTitle>
              <CardDescription>
                Application events, errors, and system activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredApplicationLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No logs found matching your criteria
                  </div>
                ) : (
                  filteredApplicationLogs.map((log) => (
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
                            {log.data?.userEmail && (
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>{log.data.userEmail}</span>
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
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Logs */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Database Logs</CardTitle>
              <CardDescription>
                PostgreSQL database operations and errors
              </CardDescription>
            </CardHeader>
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
                  databaseLogs.map((log) => (
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
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auth Logs */}
        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Logs</CardTitle>
              <CardDescription>
                User authentication and authorization events
              </CardDescription>
            </CardHeader>
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
                  authLogs.map((log) => (
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
                  ))
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