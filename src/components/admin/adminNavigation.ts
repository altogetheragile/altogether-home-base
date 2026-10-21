import {
  Settings, Calendar, Users, MapPin, BookOpen, Shield, Tag,
  FolderOpen, BarChart3, Upload, Layers, LayoutDashboard, MessageSquare, Database, FileText, ClipboardList, CalendarClock,
  Search, Inbox, Flag, ListChecks,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ─── Navigation data ─── */

export interface NavChild {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  exact?: boolean;
  children?: NavChild[];
  badge?: number;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/admin', exact: true },
      // The setup wizard and checklist. It lives on the Site, so the link is a real page load
      // (AppLink) rather than a route this app would answer with nothing.
      { label: 'Site Setup', icon: ListChecks, href: '/setup' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Blog', icon: FileText, href: '/admin/blog' },
      {
        label: 'Knowledge Base', icon: BookOpen, href: '/admin/knowledge',
        children: [
          { label: 'Knowledge Items', href: '/admin/knowledge/items', icon: BookOpen },
          { label: 'Analytics', href: '/admin/knowledge/analytics', icon: BarChart3 },
          { label: 'Taxonomy', href: '/admin/knowledge/taxonomy', icon: Layers },
          { label: 'Imports', href: '/admin/knowledge/imports', icon: Upload },
          { label: 'Pattern Feedback', href: '/admin/knowledge/pattern-feedback', icon: MessageSquare },
        ],
      },
      { label: 'Assets', icon: Upload, href: '/admin/assets' },
      { label: 'SEO', icon: Search, href: '/admin/seo' },
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
          { label: 'Instructors', href: '/admin/instructors', icon: Users },
          { label: 'Locations', href: '/admin/locations', icon: MapPin },
          { label: 'Categories', href: '/admin/event-categories', icon: FolderOpen },
          { label: 'Types', href: '/admin/event-types', icon: Tag },
          { label: 'Levels', href: '/admin/levels', icon: BarChart3 },
          { label: 'Formats', href: '/admin/formats', icon: Settings },
          { label: 'Certification Bodies', href: '/admin/certification-bodies', icon: Shield },
        ],
      },
      { label: 'Bookings', icon: CalendarClock, href: '/admin/bookings' },
      { label: 'Exams', icon: ClipboardList, href: '/admin/exams' },
      { label: 'Self-paced Courses', icon: Layers, href: '/admin/self-paced-courses' },
    ],
  },
  {
    label: 'Community',
    items: [
      { label: 'Leads', icon: Inbox, href: '/admin/contacts' },
      { label: 'Users', icon: Users, href: '/admin/users' },
      { label: 'Feedback', icon: MessageSquare, href: '/admin/feedback' },
      { label: 'Moderation', icon: Flag, href: '/admin/moderation' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Audit Log', icon: Shield, href: '/admin/logs/audit' },
      { label: 'Backlog', icon: Database, href: '/admin/populate-backlog' },
    ],
  },
];
