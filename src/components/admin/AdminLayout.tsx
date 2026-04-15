import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  Settings, Calendar, Users, MapPin, BookOpen, User, Shield, Tag,
  FolderOpen, BarChart3, Layout, Terminal, Upload, Layers, LayoutDashboard,
  Footprints, MessageSquare, Database, ExternalLink, FileText, ClipboardList,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import AccessDenied from '@/components/AccessDenied';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem,
  SidebarProvider, SidebarTrigger,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { LucideIcon } from 'lucide-react';

/* ─── Navigation data ─── */

interface NavChild {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  exact?: boolean;
  children?: NavChild[];
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/admin', exact: true },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Blog', icon: FileText, href: '/admin/blog' },
      { label: 'Pages', icon: Layout, href: '/admin/pages' },
      {
        label: 'Knowledge Base', icon: BookOpen, href: '/admin/knowledge',
        children: [
          { label: 'Analytics', href: '/admin/knowledge/analytics', icon: BarChart3 },
          { label: 'Taxonomy', href: '/admin/knowledge/taxonomy', icon: Layers },
          { label: 'Imports', href: '/admin/knowledge/imports', icon: Upload },
        ],
      },
      { label: 'Assets', icon: Upload, href: '/admin/assets' },
    ],
  },
  {
    label: 'Training',
    items: [
      {
        label: 'Events', icon: Calendar, href: '/admin/events',
        children: [
          { label: 'Courses', href: '/admin/courses', icon: BookOpen },
          { label: 'Events', href: '/admin/events', icon: Calendar },
          { label: 'Blueprints', href: '/admin/event-blueprints', icon: Layout },
          { label: 'Instructors', href: '/admin/instructors', icon: Users },
          { label: 'Locations', href: '/admin/locations', icon: MapPin },
          { label: 'Categories', href: '/admin/event-categories', icon: FolderOpen },
          { label: 'Types', href: '/admin/event-types', icon: Tag },
          { label: 'Levels', href: '/admin/levels', icon: BarChart3 },
          { label: 'Formats', href: '/admin/formats', icon: Settings },
          { label: 'Certification Bodies', href: '/admin/certification-bodies', icon: Shield },
        ],
      },
      { label: 'Exams', icon: ClipboardList, href: '/admin/exams' },
      { label: 'Self-paced Courses', icon: Layers, href: '/admin/self-paced-courses' },
    ],
  },
  {
    label: 'Community',
    items: [
      { label: 'Users', icon: Users, href: '/admin/users' },
      { label: 'Feedback', icon: MessageSquare, href: '/admin/feedback' },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'System Logs', icon: Terminal, href: '/admin/logs/application',
        children: [
          { label: 'Application', href: '/admin/logs/application', icon: Terminal },
          { label: 'Database', href: '/admin/logs/database', icon: Settings },
          { label: 'Authentication', href: '/admin/logs/auth', icon: Shield },
          { label: 'Audit Logs', href: '/admin/logs/audit', icon: Shield },
        ],
      },
      { label: 'Backlog', icon: Database, href: '/admin/populate-backlog' },
      { label: 'Footer', icon: Footprints, href: '/admin/footer' },
      { label: 'Site Settings', icon: Settings, href: '/admin/settings' },
    ],
  },
];

/* ─── Sidebar nav item (with optional collapsible children) ─── */

const SidebarNavItem = ({ item, pathname }: { item: NavItem; pathname: string }) => {
  const isItemActive = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);
  const hasChildren = item.children && item.children.length > 0;
  const isChildActive = item.children?.some((c) => pathname.startsWith(c.href)) ?? false;
  const isOpen = isItemActive || isChildActive;

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isItemActive}>
          <Link to={item.href}>
            <item.icon />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible defaultOpen={isOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isOpen}>
            <item.icon />
            <span>{item.label}</span>
            <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children!.map((child) => (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton asChild isActive={pathname.startsWith(child.href)}>
                  <Link to={child.href}>
                    <span>{child.label}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
};

/* ─── Main layout ─── */

const AdminLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (userRole !== 'admin') {
    return <AccessDenied />;
  }

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="offcanvas">
        {/* Branding */}
        <SidebarHeader className="border-b px-4 py-4">
          <Link to="/admin" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#E8702A]">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-[13px] font-medium">Altogether Agile</div>
              <div className="text-[11px] text-muted-foreground">Admin Panel</div>
            </div>
          </Link>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent>
          {navigation.map((group, gi) => (
            <SidebarGroup key={gi}>
              {group.label && (
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarNavItem key={item.href + item.label} item={item} pathname={location.pathname} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        {/* Footer — user info */}
        <SidebarFooter className="border-t px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span className="truncate">{user?.email}</span>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Top bar */}
        <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
          <SidebarTrigger />
          <div className="flex-1" />
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>View Site</span>
          </a>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 rounded-full border border-primary/10">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Admin</span>
          </div>
        </header>

        {/* Main content */}
        <main className="p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;
