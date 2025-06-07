
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Settings, Calendar, Users, MapPin, BookOpen } from 'lucide-react';
import Navigation from '@/components/Navigation';

const AdminLayout = () => {
  const location = useLocation();

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
