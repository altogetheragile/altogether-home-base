
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Settings, Calendar, Users, MapPin, BookOpen, User, Shield, Tag, FolderOpen, BarChart3, Layout, Terminal } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import AccessDenied from '@/components/AccessDenied';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
      description: 'Manage instructors'
    },
    {
      label: 'Locations',
      href: '/admin/locations',
      icon: MapPin,
      description: 'Manage event locations'
    },
    {
      label: 'Templates',
      href: '/admin/templates',
      icon: Layout,
      description: 'Manage event templates'
    },
    {
      label: 'Categories',
      href: '/admin/event-categories',
      icon: FolderOpen,
      description: 'Manage event categories'
    },
    {
      label: 'Event Types',
      href: '/admin/event-types',
      icon: Tag,
      description: 'Manage event types'
    },
    {
      label: 'Levels',
      href: '/admin/levels',
      icon: BarChart3,
      description: 'Manage skill levels'
    },
    {
      label: 'Formats',
      href: '/admin/formats',
      icon: Layout,
      description: 'Manage event formats'
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
      href: '/admin/knowledge'
    },
    {
      id: 'logs',
      label: 'System Logs',
      icon: Terminal,
      paths: ['/admin/logs'],
      href: '/admin/logs'
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
                <div className="flex items-center space-x-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Admin</span>
                </div>
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
              <TabsList className="grid w-full grid-cols-4 mb-6">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2">
                  {eventsItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`flex flex-col items-center space-y-2 p-3 rounded-lg text-center transition-colors border-2 ${
                        isActive(item.href)
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent'
                      }`}
                      title={item.description}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                  ))}
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
