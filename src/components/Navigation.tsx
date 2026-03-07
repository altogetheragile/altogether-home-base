import { Link, useLocation } from "react-router-dom";
import { Menu, X, Shield } from "lucide-react";
import LogoFull from "@/components/LogoFull";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/* Top-level nav links (Resources items excluded — they go in the dropdown) */
const TOP_LINKS = [
  { label: 'Events', to: '/events', flag: 'show_events' as const },
  { label: 'Coaching', to: '/coaching', flag: 'show_coaching' as const },
  { label: 'About', to: '/about', flag: 'show_about' as const },
  { label: 'Contact', to: '/contact', flag: 'show_contact' as const },
  { label: 'Testimonials', to: '/testimonials', flag: 'show_testimonials' as const },
];

/* Items inside the Resources dropdown */
const RESOURCE_LINKS = [
  { label: 'Knowledge Base', to: '/knowledge', flag: 'show_knowledge' as const },
  { label: 'Blog', to: '/blog', flag: 'show_blog' as const },
  { label: 'AI Tools', to: '/ai-tools', flag: 'show_ai_tools' as const },
];

const FLAG_DEFAULTS: Record<string, boolean> = {
  show_events: false,
  show_knowledge: false,
  show_coaching: true,
  show_about: true,
  show_blog: false,
  show_contact: true,
  show_testimonials: true,
  show_ai_tools: false,
};

const ChevronDown = () => (
  <svg width="10" height="10" viewBox="0 0 256 256" fill="currentColor">
    <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/>
  </svg>
);

const Navigation = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [dashOpen, setDashOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { settings } = useSiteSettings();

  const showAdminLinks = !roleLoading && userRole === 'admin';

  const isFlag = (flag: string) => settings?.[flag as keyof typeof settings] as boolean | null ?? FLAG_DEFAULTS[flag] ?? true;
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const visibleTopLinks = TOP_LINKS.filter((l) => isFlag(l.flag));
  const visibleResourceLinks = RESOURCE_LINKS.filter((l) => isFlag(l.flag));
  const resourcesActive = visibleResourceLinks.some((l) => isActive(l.to));

  const handleSignOut = async () => {
    await signOut();
  };

  const linkStyle = (active: boolean): React.CSSProperties => ({
    color: active ? '#004D4D' : '#374151',
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    textDecoration: 'none',
    padding: '6px 10px',
    borderRadius: 6,
    transition: 'color 0.15s',
    background: active ? '#F0FAFA' : 'transparent',
  });

  const dropdownItemStyle: React.CSSProperties = {
    display: 'block',
    padding: '10px 16px',
    color: '#374151',
    fontSize: 13,
    fontWeight: 500,
    textDecoration: 'none',
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    background: '#FFFFFF',
    border: '1px solid #D9F2F2',
    borderRadius: 10,
    boxShadow: '0 8px 24px rgba(0,77,77,0.1)',
    padding: '8px 0',
    zIndex: 200,
  };

  return (
    <nav style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E5E7EB',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 }}>
        {/* Logo */}
        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ flexShrink: 0, textDecoration: 'none' }}>
          <LogoFull height={38} />
        </Link>

        {/* Desktop links */}
        <div className="aa-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {visibleTopLinks.map((link) => (
            <Link key={link.to} to={link.to} style={linkStyle(isActive(link.to))}>
              {link.label}
            </Link>
          ))}

          {/* Resources dropdown */}
          {visibleResourceLinks.length > 0 && (
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setResourcesOpen(true)}
              onMouseLeave={() => setResourcesOpen(false)}
            >
              <button style={{
                background: 'none',
                border: 'none',
                color: resourcesActive ? '#004D4D' : '#374151',
                fontSize: 13,
                fontWeight: resourcesActive ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'inherit',
                padding: '6px 10px',
                borderRadius: 6,
                backgroundColor: resourcesActive ? '#F0FAFA' : 'transparent',
              }}>
                Resources <ChevronDown />
              </button>

              {resourcesOpen && (
                <div style={{ ...dropdownStyle, left: 0, minWidth: 180 }}>
                  {visibleResourceLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      style={{
                        ...dropdownItemStyle,
                        color: isActive(item.to) ? '#004D4D' : '#374151',
                        fontWeight: isActive(item.to) ? 600 : 500,
                        background: isActive(item.to) ? '#F0FAFA' : 'transparent',
                      }}
                      onMouseEnter={(e) => { if (!isActive(item.to)) e.currentTarget.style.background = '#F0FAFA'; }}
                      onMouseLeave={(e) => { if (!isActive(item.to)) e.currentTarget.style.background = 'transparent'; }}
                      onClick={() => setResourcesOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Auth section */}
          <div style={{ marginLeft: 12 }}>
            {loading ? (
              <div style={{ width: 80, height: 34, background: '#F3F4F6', borderRadius: 8 }} />
            ) : user ? (
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setDashOpen(true)}
                onMouseLeave={() => setDashOpen(false)}
              >
                <button style={{
                  background: '#FF9715',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 22px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  Dashboard <ChevronDown />
                </button>

                {dashOpen && (
                  <div style={{ ...dropdownStyle, right: 0, minWidth: 160 }}>
                    <Link
                      to="/dashboard"
                      style={dropdownItemStyle}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F0FAFA')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => setDashOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {showAdminLinks && (
                      <Link
                        to="/admin/events"
                        style={dropdownItemStyle}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F0FAFA')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => setDashOpen(false)}
                      >
                        Admin
                      </Link>
                    )}
                    <div style={{ borderTop: '1px solid #D9F2F2', margin: '4px 0' }} />
                    <button
                      onClick={() => { handleSignOut(); setDashOpen(false); }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        color: '#374151',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F0FAFA')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                style={{
                  background: '#FF9715',
                  color: '#fff',
                  padding: '9px 22px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="aa-nav-hamburger"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            padding: 8,
            cursor: 'pointer',
            color: '#374151',
          }}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {isMenuOpen && (
        <div className="aa-nav-mobile-menu" style={{
          borderTop: '1px solid #E5E7EB',
          background: '#FFFFFF',
          padding: '8px 0',
        }}>
          {/* Top-level links */}
          {visibleTopLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsMenuOpen(false)}
              style={{
                display: 'block',
                padding: '12px 24px',
                color: isActive(link.to) ? '#004D4D' : '#374151',
                fontSize: 15,
                fontWeight: isActive(link.to) ? 600 : 500,
                textDecoration: 'none',
                background: isActive(link.to) ? '#F0FAFA' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Resources group */}
          {visibleResourceLinks.length > 0 && (
            <>
              <div style={{ padding: '12px 24px 4px', color: '#6B7280', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Resources
              </div>
              {visibleResourceLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '12px 24px 12px 36px',
                    color: isActive(link.to) ? '#004D4D' : '#374151',
                    fontSize: 15,
                    fontWeight: isActive(link.to) ? 600 : 500,
                    textDecoration: 'none',
                    background: isActive(link.to) ? '#F0FAFA' : 'transparent',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </>
          )}

          {/* Mobile auth */}
          <div style={{ borderTop: '1px solid #E5E7EB', marginTop: 8, paddingTop: 8 }}>
            {loading ? (
              <div style={{ padding: '12px 24px', color: '#6B7280', fontSize: 14 }}>Loading...</div>
            ) : user ? (
              <>
                <div style={{ padding: '8px 24px', color: '#6B7280', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Signed in as {user.email}
                  {userRole === 'admin' && <Shield size={12} style={{ color: '#004D4D' }} />}
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  style={{ display: 'block', padding: '12px 24px', color: '#004D4D', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
                >
                  Dashboard
                </Link>
                {showAdminLinks && (
                  <Link
                    to="/admin/events"
                    onClick={() => setIsMenuOpen(false)}
                    style={{ display: 'block', padding: '12px 24px', color: '#004D4D', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 24px',
                    color: '#6B7280',
                    fontSize: 15,
                    fontWeight: 500,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setIsMenuOpen(false)}
                style={{ display: 'block', padding: '12px 24px', color: '#FF9715', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Responsive CSS — hide desktop links on mobile, show hamburger */}
      <style>{`
        @media (min-width: 768px) {
          .aa-nav-hamburger { display: none !important; }
          .aa-nav-desktop { display: flex !important; }
        }
        @media (max-width: 767px) {
          .aa-nav-hamburger { display: block !important; }
          .aa-nav-desktop { display: none !important; }
        }
      `}</style>
    </nav>
  );
};

export default Navigation;
