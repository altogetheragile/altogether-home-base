
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Settings, Calendar, Users, MapPin, BookOpen, User, Shield, Tag, FolderOpen, BarChart3, Layout } from 'lucide-react';
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

  const navItems = [
    {
      label: 'Events',
      href: '/admin/events',
      icon: Calendar,
      description: 'Manage all events'
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
      description: 'Manage locations'
    },
    {
      label: 'Templates',
      href: '/admin/templates',
      icon: BookOpen,
      description: 'Manage event templates'
    },
    {
      label: 'Event Types',
      href: '/admin/event-types',
      icon: Tag,
      description: 'Manage event types'
    },
    {
      label: 'Categories',
      href: '/admin/event-categories',
      icon: FolderOpen,
      description: 'Manage event categories'
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
    },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Settings className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900">Admin Panel</h2>
            </div>

            {/* User Role Info */}
            <div className="mb-6 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-center space-x-2 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">Admin Access</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
                <User className="h-3 w-3" />
                <span>{user?.email}</span>
              </div>
            </div>
            
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <div>
                      <div>{item.label}</div>
                      <div className={`text-xs ${isActive(item.href) ? 'text-gray-200' : 'text-gray-500'}`}>
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
