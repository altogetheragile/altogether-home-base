
import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Mail, Phone, MapPin, Linkedin, Twitter, Facebook, Youtube, Github } from 'lucide-react';

const Footer = () => {
  const { settings } = useSiteSettings();
  const { user } = useAuth();
  const { data: userRole } = useUserRole();

  const socialLinks = [
    { icon: Linkedin, url: settings?.social_linkedin, label: 'LinkedIn' },
    { icon: Twitter, url: settings?.social_twitter, label: 'Twitter' },
    { icon: Facebook, url: settings?.social_facebook, label: 'Facebook' },
    { icon: Youtube, url: settings?.social_youtube, label: 'YouTube' },
    { icon: Github, url: settings?.social_github, label: 'GitHub' },
  ].filter(link => link.url);

  // Dynamic navigation links matching Navigation component logic
  const navLinks = [
    { label: 'Home', url: '/', show: true },
    { label: 'Events', url: '/events', show: settings?.show_events ?? false },
    { label: 'Knowledge Base', url: '/knowledge', show: settings?.show_knowledge ?? false },
    { label: 'Blog', url: '/blog', show: settings?.show_blog ?? false },
    { label: 'Testimonials', url: '/testimonials', show: true },
    { label: 'Contact', url: '/contact', show: settings?.show_contact ?? true },
    { label: 'AI Tools', url: '/ai-tools', show: settings?.show_ai_tools ?? true },
    { label: 'Dashboard', url: '/dashboard', show: (settings?.show_dashboard ?? true) && !!user },
    { label: 'Admin Panel', url: '/admin/events', show: !!user && userRole === 'admin' },
  ];

  const quickLinks = navLinks.filter(link => link.show);

  return (
    <footer className="bg-muted mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">
              {settings?.company_name || 'AltogetherAgile'}
            </h3>
            <p className="text-muted-foreground">
              {settings?.company_description || 'Empowering teams and organizations through agile transformation and coaching.'}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.url} 
                    onClick={() => {
                      if (link.url === '/') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Contact</h4>
            <div className="space-y-2">
              {settings?.contact_email && (
                <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="w-4 h-4" />
                  {settings.contact_email}
                </a>
              )}
              {settings?.contact_phone && (
                <a href={`tel:${settings.contact_phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="w-4 h-4" />
                  {settings.contact_phone}
                </a>
              )}
              {settings?.contact_location && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {settings.contact_location}
                </p>
              )}
              
              {socialLinks.length > 0 && (
                <div className="flex gap-3 mt-4">
                  {socialLinks.map((link, index) => {
                    const Icon = link.icon;
                    return (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label={link.label}
                      >
                        <Icon className="w-5 h-5" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} {settings?.company_name || 'AltogetherAgile'}. {settings?.copyright_text || 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
