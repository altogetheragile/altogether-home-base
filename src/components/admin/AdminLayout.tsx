
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Settings, Calendar, Users, MapPin, BookOpen, User, Shield, Tag, FolderOpen, BarChart3, Layout, Terminal } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import AccessDenied from '@/components/AccessDenied';

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

  const navGroups = [
    {
      title: 'Events',
      items: [
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
      ]
    }
  ];

  const standaloneItems = [
    {
      label: 'Pages',
      href: '/admin/pages',
      icon: Layout,
      description: 'Manage website pages'
    },
    {
      label: 'Knowledge Base',
      href: '/admin/knowledge',
      icon: BookOpen,
      description: 'Manage knowledge base content'
    },
    {
      label: 'System Logs',
      href: '/admin/logs',
      icon: Terminal,
      description: 'View application logs and system activity'
    }
  ];

  // Navigation helper function
  const isActive = (path: string) => location.pathname.startsWith(path);

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
            <nav className="space-y-6">
              {/* Events Group */}
              {navGroups.map((group) => (
                <div key={group.title} className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    {group.title}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`flex flex-col items-center space-y-2 p-3 rounded-lg text-center transition-colors ${
                          isActive(item.href)
                            ? 'bg-primary/10 text-primary border-2 border-primary/20'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-2 border-transparent'
                        }`}
                        title={item.description}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="text-xs font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Standalone Items */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  General
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {standaloneItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`flex flex-col items-center space-y-2 p-3 rounded-lg text-center transition-colors ${
                        isActive(item.href)
                          ? 'bg-primary/10 text-primary border-2 border-primary/20'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-2 border-transparent'
                      }`}
                      title={item.description}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
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
