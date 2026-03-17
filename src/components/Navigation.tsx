import { colors as p } from '@/theme/colors';
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Shield } from "lucide-react";
import LogoFull from "@/components/LogoFull";
import { useState, useEffect, useRef, useCallback } from "react";
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
  { label: 'Flow Game', to: '/flow-game', flag: 'show_flow_game' as const },
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
  show_resources: true,
  show_flow_game: true,
};

const ChevronDown = () => (
  <svg width="10" height="10" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
    <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/>
  </svg>
);

/** Handle arrow-key navigation within a dropdown menu. */
function useDropdownKeyboard(
  isOpen: boolean,
  setIsOpen: (open: boolean) => void,
  menuRef: React.RefObject<HTMLDivElement | null>,
  triggerRef: React.RefObject<HTMLButtonElement | null>,
) {
  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(true);
      // Focus first menu item after render
      setTimeout(() => {
        const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
        items?.[0]?.focus();
      }, 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
      setTimeout(() => {
        const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
        if (items?.length) items[items.length - 1].focus();
      }, 0);
    }
  }, [setIsOpen, menuRef, triggerRef]);

  const handleMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    if (!items?.length) return;

    const currentIndex = Array.from(items).indexOf(e.target as HTMLElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(currentIndex + 1) % items.length].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length].focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  }, [setIsOpen, menuRef, triggerRef]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, setIsOpen, menuRef, triggerRef]);

  return { handleTriggerKeyDown, handleMenuKeyDown };
}

const Navigation = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isDashOpen, setIsDashOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { settings } = useSiteSettings();

  const resourcesMenuRef = useRef<HTMLDivElement>(null);
  const resourcesTriggerRef = useRef<HTMLButtonElement>(null);
  const dashMenuRef = useRef<HTMLDivElement>(null);
  const dashTriggerRef = useRef<HTMLButtonElement>(null);

  const resourcesKb = useDropdownKeyboard(isResourcesOpen, setIsResourcesOpen, resourcesMenuRef, resourcesTriggerRef);
  const dashKb = useDropdownKeyboard(isDashOpen, setIsDashOpen, dashMenuRef, dashTriggerRef);

  const showAdminLinks = !roleLoading && userRole === 'admin';

  const isFlag = (flag: string) => settings?.[flag as keyof typeof settings] as boolean | null ?? FLAG_DEFAULTS[flag] ?? true;
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const visibleTopLinks = TOP_LINKS.filter((l) => isFlag(l.flag));
  const showResources = isFlag('show_resources');
  const visibleResourceLinks = showResources ? RESOURCE_LINKS.filter((l) => isFlag(l.flag)) : [];
  const resourcesActive = visibleResourceLinks.some((l) => isActive(l.to));

  const handleSignOut = async () => {
    await signOut();
  };

  // Close mobile menu on Escape
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  // Close dropdowns on route change
  useEffect(() => {
    setIsResourcesOpen(false);
    setIsDashOpen(false);
    setIsMenuOpen(false);
  }, [location.pathname]);

  const linkStyle = (active: boolean): React.CSSProperties => ({
    color: active ? p.deepTeal : p.body,
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    textDecoration: 'none',
    padding: '6px 10px',
    borderRadius: 6,
    transition: 'color 0.15s',
    background: active ? p.skyTeal : 'transparent',
  });

  const dropdownItemStyle: React.CSSProperties = {
    display: 'block',
    padding: '10px 16px',
    color: p.body,
    fontSize: 13,
    fontWeight: 500,
    textDecoration: 'none',
    outline: 'none',
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    background: p.white,
    border: `1px solid ${p.paleTeal}`,
    borderRadius: 10,
    boxShadow: '0 8px 24px rgba(0,77,77,0.1)',
    padding: '8px 0',
    zIndex: 200,
  };

  return (
    <>
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: -9999,
          top: 0,
          zIndex: 999,
          background: p.deepTeal,
          color: p.white,
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
          borderRadius: '0 0 8px 0',
        }}
        onFocus={(e) => { e.currentTarget.style.left = '0'; }}
        onBlur={(e) => { e.currentTarget.style.left = '-9999px'; }}
      >
        Skip to main content
      </a>

      <nav
        aria-label="Main navigation"
        style={{
          background: p.white,
          borderBottom: '1px solid #E5E7EB',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 }}>
          {/* Logo */}
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ flexShrink: 0, textDecoration: 'none' }} aria-label="Altogether Agile home">
            <LogoFull height={38} />
          </Link>

          {/* Desktop links */}
          <div className="aa-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 6 }} role="menubar">
            {visibleTopLinks.map((link) => (
              <Link key={link.to} to={link.to} style={linkStyle(isActive(link.to))} role="menuitem" aria-current={isActive(link.to) ? 'page' : undefined}>
                {link.label}
              </Link>
            ))}

            {/* Resources dropdown */}
            {visibleResourceLinks.length > 0 && (
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setIsResourcesOpen(true)}
                onMouseLeave={() => setIsResourcesOpen(false)}
              >
                <button
                  ref={resourcesTriggerRef}
                  aria-haspopup="true"
                  aria-expanded={isResourcesOpen}
                  onKeyDown={resourcesKb.handleTriggerKeyDown}
                  onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resourcesActive ? p.deepTeal : p.body,
                    fontSize: 13,
                    fontWeight: resourcesActive ? 600 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: 'inherit',
                    padding: '6px 10px',
                    borderRadius: 6,
                    backgroundColor: resourcesActive ? p.skyTeal : 'transparent',
                  }}
                >
                  Resources <ChevronDown />
                </button>

                {isResourcesOpen && (
                  <div ref={resourcesMenuRef} role="menu" aria-label="Resources" style={{ ...dropdownStyle, left: 0, minWidth: 180 }} onKeyDown={resourcesKb.handleMenuKeyDown}>
                    {visibleResourceLinks.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        role="menuitem"
                        tabIndex={-1}
                        aria-current={isActive(item.to) ? 'page' : undefined}
                        style={{
                          ...dropdownItemStyle,
                          color: isActive(item.to) ? p.deepTeal : p.body,
                          fontWeight: isActive(item.to) ? 600 : 500,
                          background: isActive(item.to) ? p.skyTeal : 'transparent',
                        }}
                        onMouseEnter={(e) => { if (!isActive(item.to)) e.currentTarget.style.background = p.skyTeal; }}
                        onMouseLeave={(e) => { if (!isActive(item.to)) e.currentTarget.style.background = 'transparent'; }}
                        onFocus={(e) => { e.currentTarget.style.background = p.skyTeal; }}
                        onBlur={(e) => { if (!isActive(item.to)) e.currentTarget.style.background = 'transparent'; }}
                        onClick={() => setIsResourcesOpen(false)}
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
                <div style={{ width: 80, height: 34, background: '#F3F4F6', borderRadius: 8 }} aria-hidden="true" />
              ) : user ? (
                <div
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setIsDashOpen(true)}
                  onMouseLeave={() => setIsDashOpen(false)}
                >
                  <button
                    ref={dashTriggerRef}
                    aria-haspopup="true"
                    aria-expanded={isDashOpen}
                    onKeyDown={dashKb.handleTriggerKeyDown}
                    onClick={() => setIsDashOpen(!isDashOpen)}
                    style={{
                      background: p.orange,
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
                    }}
                  >
                    Dashboard <ChevronDown />
                  </button>

                  {isDashOpen && (
                    <div ref={dashMenuRef} role="menu" aria-label="Dashboard" style={{ ...dropdownStyle, right: 0, minWidth: 160 }} onKeyDown={dashKb.handleMenuKeyDown}>
                      <Link
                        to="/dashboard"
                        role="menuitem"
                        tabIndex={-1}
                        style={dropdownItemStyle}
                        onMouseEnter={(e) => (e.currentTarget.style.background = p.skyTeal)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onFocus={(e) => (e.currentTarget.style.background = p.skyTeal)}
                        onBlur={(e) => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => setIsDashOpen(false)}
                      >
                        Dashboard
                      </Link>
                      {showAdminLinks && (
                        <Link
                          to="/admin/events"
                          role="menuitem"
                          tabIndex={-1}
                          style={dropdownItemStyle}
                          onMouseEnter={(e) => (e.currentTarget.style.background = p.skyTeal)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          onFocus={(e) => (e.currentTarget.style.background = p.skyTeal)}
                          onBlur={(e) => (e.currentTarget.style.background = 'transparent')}
                          onClick={() => setIsDashOpen(false)}
                        >
                          Admin
                        </Link>
                      )}
                      <div style={{ borderTop: `1px solid ${p.paleTeal}`, margin: '4px 0' }} role="separator" />
                      <button
                        role="menuitem"
                        tabIndex={-1}
                        onClick={() => { handleSignOut(); setIsDashOpen(false); }}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 16px',
                          background: 'none',
                          border: 'none',
                          color: p.body,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          outline: 'none',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = p.skyTeal)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onFocus={(e) => (e.currentTarget.style.background = p.skyTeal)}
                        onBlur={(e) => (e.currentTarget.style.background = 'transparent')}
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
                    background: p.orange,
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
            aria-controls="mobile-nav-menu"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              padding: 8,
              cursor: 'pointer',
              color: p.body,
            }}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {isMenuOpen && (
          <div
            id="mobile-nav-menu"
            role="menu"
            className="aa-nav-mobile-menu"
            style={{
              borderTop: '1px solid #E5E7EB',
              background: p.white,
              padding: '8px 0',
            }}
          >
            {/* Top-level links */}
            {visibleTopLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                role="menuitem"
                aria-current={isActive(link.to) ? 'page' : undefined}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '12px 24px',
                  color: isActive(link.to) ? p.deepTeal : p.body,
                  fontSize: 15,
                  fontWeight: isActive(link.to) ? 600 : 500,
                  textDecoration: 'none',
                  background: isActive(link.to) ? p.skyTeal : 'transparent',
                }}
              >
                {link.label}
              </Link>
            ))}

            {/* Resources group */}
            {visibleResourceLinks.length > 0 && (
              <>
                <div style={{ padding: '12px 24px 4px', color: p.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }} role="separator">
                  Resources
                </div>
                {visibleResourceLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    role="menuitem"
                    aria-current={isActive(link.to) ? 'page' : undefined}
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '12px 24px 12px 36px',
                      color: isActive(link.to) ? p.deepTeal : p.body,
                      fontSize: 15,
                      fontWeight: isActive(link.to) ? 600 : 500,
                      textDecoration: 'none',
                      background: isActive(link.to) ? p.skyTeal : 'transparent',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}

            {/* Mobile auth */}
            <div style={{ borderTop: '1px solid #E5E7EB', marginTop: 8, paddingTop: 8 }} role="separator" aria-hidden="true" />
            <div>
              {loading ? (
                <div style={{ padding: '12px 24px', color: p.muted, fontSize: 14 }}>Loading...</div>
              ) : user ? (
                <>
                  <div style={{ padding: '8px 24px', color: p.muted, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    Signed in as {user.email}
                    {userRole === 'admin' && <Shield size={12} style={{ color: p.deepTeal }} aria-label="Admin" />}
                  </div>
                  <Link
                    to="/dashboard"
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                    style={{ display: 'block', padding: '12px 24px', color: p.deepTeal, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
                  >
                    Dashboard
                  </Link>
                  {showAdminLinks && (
                    <Link
                      to="/admin/events"
                      role="menuitem"
                      onClick={() => setIsMenuOpen(false)}
                      style={{ display: 'block', padding: '12px 24px', color: p.deepTeal, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    role="menuitem"
                    onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 24px',
                      color: p.muted,
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
                  role="menuitem"
                  onClick={() => setIsMenuOpen(false)}
                  style={{ display: 'block', padding: '12px 24px', color: p.orange, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}
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
    </>
  );
};

export default Navigation;
