import { Link, useLocation, Outlet } from 'react-router-dom';
import { Settings, Calendar, Users, MapPin, BookOpen, User, Shield, Tag, FolderOpen, BarChart3, Layout, Terminal, Upload, Layers, LayoutDashboard, Footprints, MessageSquare, Database, ExternalLink, FileText, ClipboardList } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import AccessDenied from '@/components/AccessDenied';
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
      label: 'Courses',
      href: '/admin/courses',
      icon: BookOpen,
      description: 'Manage courses and scheduled dates'
    },
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
      label: 'Analytics',
      href: '/admin/knowledge/analytics',
      icon: BarChart3,
      description: 'View content analytics'
    },
    {
      label: 'Taxonomy',
      href: '/admin/knowledge/taxonomy',
      icon: Layers,
      description: 'Manage decision levels, categories, domains, and tags'
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
    },
    {
      label: 'Audit Logs',
      href: '/admin/logs/audit',
      icon: Shield,
      description: 'View admin action logs'
    }
  ];

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      paths: ['/admin'],
      href: '/admin',
      exact: true
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      paths: ['/admin/users'],
      href: '/admin/users'
    },
    {
      id: 'populate-backlog',
      label: 'Populate Backlog',
      icon: Database,
      paths: ['/admin/populate-backlog'],
      href: '/admin/populate-backlog'
    },
    {
      id: 'events',
      label: 'Events',
      icon: Calendar,
      paths: ['/admin/events', '/admin/courses', '/admin/event-blueprints', '/admin/instructors', '/admin/locations', '/admin/event-categories', '/admin/event-types', '/admin/levels', '/admin/formats'],
      href: '/admin/events',
      items: eventsItems
    },
    {
      id: 'blog',
      label: 'Blog',
      icon: FileText,
      paths: ['/admin/blog'],
      href: '/admin/blog'
    },
    {
      id: 'feedback',
      label: 'Feedback',
      icon: MessageSquare,
      paths: ['/admin/feedback'],
      href: '/admin/feedback'
    },
    {
      id: 'pages',
      label: 'Pages',
      icon: Layout,
      paths: ['/admin/pages', '/admin/footer', '/admin/settings'],
      href: '/admin/pages',
      items: [
        { label: 'Pages', href: '/admin/pages', icon: Layout, description: 'Manage pages' },
        { label: 'Footer', href: '/admin/footer', icon: Footprints, description: 'Configure footer settings' },
        { label: 'Settings', href: '/admin/settings', icon: Settings, description: 'Site feature toggles' }
      ]
    },
    {
      id: 'assets',
      label: 'Assets',
      icon: Upload,
      paths: ['/admin/assets', '/admin/media'],
      href: '/admin/assets'
    },
    {
      id: 'knowledge',
      label: 'Knowledge Base',
      icon: BookOpen,
      paths: ['/admin/knowledge'],
      href: '/admin/knowledge',
      items: knowledgeItems
    },
    {
      id: 'exams',
      label: 'Exams',
      icon: ClipboardList,
      paths: ['/admin/exams'],
      href: '/admin/exams'
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
    // Check for exact match first (for dashboard)
    for (const tab of tabs) {
      if (tab.exact && location.pathname === tab.paths[0]) {
        return tab.id;
      }
    }
    // Then check for startsWith matches
    for (const tab of tabs) {
      if (!tab.exact && tab.paths.some(path => location.pathname.startsWith(path))) {
        return tab.id;
      }
    }
    return 'dashboard'; // default to dashboard tab
  };

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Admin Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                  <Settings className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                </Link>
              </div>

              {/* User Role Info */}
              <div className="flex items-center space-x-4">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>View Site</span>
                </a>
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
          <div className="px-6 py-3 border-b border-gray-100 overflow-x-auto">
            <div className="flex space-x-2 min-w-0">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isTabActive = activeTab === tab.id;
                return (
                  <Link
                    key={tab.id}
                    to={tab.href}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
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

          {/* Items Grid - Only show items for active tab (skip for dashboard and users) */}
          {activeTab !== 'dashboard' && activeTab !== 'users' && (
            <div className="px-6 py-3 overflow-x-auto">
              <div className="flex gap-2">
                {(() => {
                  // Get items for active tab
                  let itemsToRender: typeof eventsItems = [];
                  
                  if (activeTab === 'events') {
                    itemsToRender = eventsItems;
                  } else if (activeTab === 'knowledge') {
                    itemsToRender = knowledgeItems;
                  } else if (activeTab === 'logs') {
                    itemsToRender = logsItems;
                  } else if (activeTab === 'pages') {
                    itemsToRender = [
                      { label: 'Pages', href: '/admin/pages', icon: Layout, description: 'Manage pages' },
                      { label: 'Footer', href: '/admin/footer', icon: Footprints, description: 'Configure footer settings' },
                      { label: 'Settings', href: '/admin/settings', icon: Settings, description: 'Site feature toggles' }
                    ];
                  }

                return itemsToRender.map((item) => {
                  const IconComponent: React.ElementType = item.icon;
                  return (
                    <TooltipProvider key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            to={item.href}
                            className={`group flex flex-shrink-0 min-w-[80px] flex-1 items-center justify-center p-1.5 bg-white rounded-md border ${
                              isActive(item.href) 
                                ? 'border-primary/40 bg-primary/5' 
                                : 'border-gray-200'
                            } hover:border-primary/30 hover:shadow-sm transition-all duration-200`}
                          >
                            <div className="flex flex-col items-center space-y-0.5">
                              <div className={`p-0.5 rounded-full group-hover:bg-primary/10 transition-colors ${
                                isActive(item.href) ? 'bg-primary/10' : 'bg-gray-50'
                              }`}>
                                <IconComponent className={`h-3.5 w-3.5 group-hover:text-primary transition-colors ${
                                  isActive(item.href) ? 'text-primary' : 'text-gray-600'
                                }`} />
                              </div>
                              <span className={`text-[10px] font-medium text-center leading-tight ${
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
          )}
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