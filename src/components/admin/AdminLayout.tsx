import { Link, useLocation, Outlet } from 'react-router-dom';
import { Settings, Calendar, Users, MapPin, BookOpen, User, Shield, Tag, FolderOpen, BarChart3, Layout, Terminal, Route, Upload, Layers, Target, FileImage } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import AccessDenied from '@/components/AccessDenied';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const AdminLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();

  // Additional security layer - double check role at layout level
  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return <AccessDenied />;
  }

  // Define tab structure
  const eventsItems = [
    {
      label: 'Events',
      href: '/admin/events',
      icon: Calendar,
      description: 'Manage events and registrations'
    },
    {
      label: 'Instructors',
      href: '/admin/instructors',
      icon: Users,
      description: 'Manage instructor profiles'
    },
    {
      label: 'Locations',
      href: '/admin/locations',
      icon: MapPin,
      description: 'Configure event venues'
    },
    {
      label: 'Templates',
      href: '/admin/templates',
      icon: Layout,
      description: 'Create reusable event templates'
    },
    {
      label: 'Categories',
      href: '/admin/event-categories',
      icon: FolderOpen,
      description: 'Organize event categories'
    },
    {
      label: 'Types',
      href: '/admin/event-types',
      icon: Tag,
      description: 'Define event types'
    },
    {
      label: 'Levels',
      href: '/admin/levels',
      icon: BarChart3,
      description: 'Set skill difficulty levels'
    },
    {
      label: 'Formats',
      href: '/admin/formats',
      icon: Settings,
      description: 'Configure event formats'
    }
  ];

  const knowledgeItems = [
    {
      label: 'Knowledge Items',
      href: '/admin/knowledge/items',
      icon: BookOpen,
      description: 'Manage knowledge items'
    },
    {
      label: 'Templates',
      href: '/admin/knowledge/templates',
      icon: Layout,
      description: 'Manage knowledge item templates'
    },
    {
      label: 'Analytics',
      href: '/admin/knowledge/analytics',
      icon: BarChart3,
      description: 'View content analytics'
    },
    {
      label: 'Classifications',
      href: '/admin/knowledge/classifications',
      icon: FolderOpen,
      description: 'Manage categories, focuses, and domains'
    },
    {
      label: 'Tags',
      href: '/admin/knowledge/tags',
      icon: Tag,
      description: 'Manage content tags'
    },
    {
      label: 'Learning Paths',
      href: '/admin/knowledge/learning-paths',
      icon: Route,
      description: 'Create structured learning journeys'
    },
    {
      label: 'Imports',
      href: '/admin/knowledge/imports',
      icon: Upload,
      description: 'Import data from files'
    }
  ];

  const logsItems = [
    {
      label: 'Application',
      href: '/admin/logs/application',
      icon: Terminal,
      description: 'View application logs'
    },
    {
      label: 'Database',
      href: '/admin/logs/database',
      icon: Settings,
      description: 'View database logs'
    },
    {
      label: 'Authentication',
      href: '/admin/logs/auth',
      icon: Shield,
      description: 'View auth logs'
    }
  ];

  const tabs = [
    {
      id: 'events',
      label: 'Events',
      icon: Calendar,
      paths: ['/admin/events', '/admin/instructors', '/admin/locations', '/admin/templates', '/admin/event-categories', '/admin/event-types', '/admin/levels', '/admin/formats'],
      href: '/admin/events',
      items: eventsItems
    },
    {
      id: 'pages',
      label: 'Pages',
      icon: Layout,
      paths: ['/admin/pages'],
      href: '/admin/pages'
    },
    {
      id: 'knowledge',
      label: 'Knowledge Base',
      icon: BookOpen,
      paths: ['/admin/knowledge'],
      href: '/admin/knowledge/items',
      items: knowledgeItems
    },
    {
      id: 'media',
      label: 'Media Library',
      icon: FileImage,
      paths: ['/admin/media'],
      href: '/admin/media'
    },
    {
      id: 'logs',
      label: 'System Logs',
      icon: Terminal,
      paths: ['/admin/logs'],
      href: '/admin/logs/application',
      items: logsItems
    }
  ];

  // Helper functions
  const isActive = (path: string) => location.pathname.startsWith(path);
  
  const getActiveTab = () => {
    for (const tab of tabs) {
      if (tab.paths.some(path => location.pathname.startsWith(path))) {
        return tab.id;
      }
    }
    return 'events'; // default to events tab
  };

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto">
        {/* Admin Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              </div>
              
              {/* User Role Info */}
              <div className="flex items-center space-x-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Admin</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Administrator role with full access</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="bg-white border-b">
          <div className="px-6 py-4">
            <Tabs value={activeTab} className="w-full">
              {/* Tab Headers */}
              <TabsList className="grid w-full grid-cols-5 mb-6">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center space-x-2"
                    asChild
                  >
                    {tab.href ? (
                      <Link to={tab.href}>
                        <tab.icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </Link>
                    ) : (
                      <div>
                        <tab.icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </div>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Tab Content */}
              <TabsContent value="events" className="mt-0">
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  <TooltipProvider>
                    {eventsItems.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Tooltip key={item.label}>
                          <TooltipTrigger asChild>
                            <Link
                              to={item.href}
                              className="group flex items-center justify-center p-1.5 bg-white rounded-lg border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                            >
                              <div className="p-1.5 bg-gray-50 rounded-full group-hover:bg-primary/10 transition-colors">
                                <IconComponent className="h-5 w-5 text-gray-600 group-hover:text-primary" />
                              </div>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </TooltipProvider>
                </div>
              </TabsContent>

              <TabsContent value="knowledge" className="mt-0">
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  <TooltipProvider>
                    {knowledgeItems.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Tooltip key={item.label}>
                          <TooltipTrigger asChild>
                            <Link
                              to={item.href}
                              className="group flex items-center justify-center p-1.5 bg-white rounded-lg border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                            >
                              <div className="p-1.5 bg-gray-50 rounded-full group-hover:bg-primary/10 transition-colors">
                                <IconComponent className="h-5 w-5 text-gray-600 group-hover:text-primary" />
                              </div>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </TooltipProvider>
                </div>
              </TabsContent>

              <TabsContent value="logs" className="mt-0">
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  <TooltipProvider>
                    {logsItems.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Tooltip key={item.label}>
                          <TooltipTrigger asChild>
                            <Link
                              to={item.href}
                              className="group flex items-center justify-center p-1.5 bg-white rounded-lg border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                            >
                              <div className="p-1.5 bg-gray-50 rounded-full group-hover:bg-primary/10 transition-colors">
                                <IconComponent className="h-5 w-5 text-gray-600 group-hover:text-primary" />
                              </div>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </TooltipProvider>
                </div>
              </TabsContent>

            </Tabs>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;