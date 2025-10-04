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
      label: 'Event Blueprints',
      href: '/admin/event-blueprints',
      icon: Layout,
      description: 'Create reusable event blueprints'
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
      label: 'Assets',
      href: '/admin/assets',
      icon: Layers,
      description: 'Manage templates, PDFs, and media assets'
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
      paths: ['/admin/events', '/admin/event-blueprints', '/admin/instructors', '/admin/locations', '/admin/event-categories', '/admin/event-types', '/admin/levels', '/admin/formats'],
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
      paths: ['/admin/knowledge', '/admin/assets'],
      href: '/admin/knowledge/items',
      items: knowledgeItems
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

        {/* Admin Navigation - Tabbed Interface */}
        <div className="bg-white border-b">
          {/* Tab Bar */}
          <div className="px-6 py-3 border-b border-gray-100">
            <div className="flex space-x-6">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isTabActive = activeTab === tab.id;
                return (
                  <Link
                    key={tab.id}
                    to={tab.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      isTabActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Items Grid - Only show items for active tab */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
              {(() => {
                // Get items for active tab
                let itemsToRender = [];
                
                if (activeTab === 'events') {
                  itemsToRender = eventsItems;
                } else if (activeTab === 'knowledge') {
                  itemsToRender = knowledgeItems;
                } else if (activeTab === 'logs') {
                  itemsToRender = logsItems;
                } else if (activeTab === 'pages') {
                  itemsToRender = [{ label: 'Pages', href: '/admin/pages', icon: Layout, description: 'Manage pages' }];
                }

                return itemsToRender.map((item) => {
                  const IconComponent = item.icon as any;
                  return (
                    <TooltipProvider key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            to={item.href}
                            className={`group flex items-center justify-center p-2 bg-white rounded-lg border ${
                              isActive(item.href) 
                                ? 'border-primary/40 bg-primary/5' 
                                : 'border-gray-200'
                            } hover:border-primary/30 hover:shadow-md transition-all duration-200`}
                          >
                            <div className="flex flex-col items-center space-y-1">
                              <div className={`p-1 rounded-full group-hover:bg-primary/10 transition-colors ${
                                isActive(item.href) ? 'bg-primary/10' : 'bg-gray-50'
                              }`}>
                                <IconComponent className={`h-4 w-4 group-hover:text-primary transition-colors ${
                                  isActive(item.href) ? 'text-primary' : 'text-gray-600'
                                }`} />
                              </div>
                              <span className={`text-xs font-medium text-center ${
                                isActive(item.href) ? 'text-primary' : 'text-gray-700'
                              }`}>
                                {item.label}
                              </span>
                            </div>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                });
              })()}
            </div>
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