
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut, Settings, LayoutDashboard, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { settings } = useSiteSettings();
  
  // Feature flags from database with fallbacks
  const SHOW_EVENTS = settings?.show_events ?? false;
  const SHOW_KNOWLEDGE = settings?.show_knowledge ?? false;
  const SHOW_BLOG = settings?.show_blog ?? false;
  const SHOW_AI_TOOLS = settings?.show_ai_tools ?? true;
  const SHOW_CONTACT = settings?.show_contact ?? true;
  const SHOW_DASHBOARD = settings?.show_dashboard ?? true;

  const isActive = (path: string) => location.pathname === path;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleSignOut = async () => {
    await signOut();
  };

  // Don't show admin links while role is loading
  const showAdminLinks = !roleLoading && userRole === 'admin';

  return (
    <nav className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-primary">AltogetherAgile</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-8">
              {SHOW_EVENTS && (
                <Link
                  to="/events"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/events")
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                  }`}
                >
                  Events
                </Link>
              )}
              {SHOW_KNOWLEDGE && (
                <Link
                  to="/knowledge"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/knowledge")
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                  }`}
                >
                  Knowledge Base
                </Link>
              )}
              {SHOW_BLOG && (
                <Link
                  to="/blog"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/blog")
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                  }`}
                >
                  Blog
                </Link>
              )}
              <Link
                to="/testimonials"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/testimonials")
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-primary hover:bg-accent"
                }`}
              >
                Testimonials
              </Link>
              {SHOW_CONTACT && (
                <Link
                  to="/contact"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/contact")
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                  }`}
                >
                  Contact
                </Link>
              )}
              
              {/* AI Tools Dropdown */}
              {SHOW_AI_TOOLS && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        isActive("/bmc-generator") || isActive("/user-story-canvas")
                          ? "text-primary bg-accent"
                          : "text-muted-foreground hover:text-primary hover:bg-accent"
                      }`}
                    >
                      AI Tools
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-background z-50">
                    <DropdownMenuItem asChild>
                      <Link to="/bmc-generator" className="cursor-pointer">
                        BMC Generator
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/user-story-canvas" className="cursor-pointer">
                        User Story Canvas
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {/* Dashboard Link - Only show for authenticated users */}
              {SHOW_DASHBOARD && user && (
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/dashboard")
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                  }`}
                >
                  Dashboard
                </Link>
               )}
              </div>

            {/* Auth Section */}
            {loading ? (
              <div className="w-8 h-8 bg-muted animate-pulse rounded" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{user.email}</span>
                    {userRole === 'admin' && <Shield className="h-3 w-3 text-primary" />}
                  </Button>
                </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {SHOW_DASHBOARD && (
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard">
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          My Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/account/security">
                        <Shield className="h-4 w-4 mr-2" />
                        Account Security
                      </Link>
                    </DropdownMenuItem>
                    {showAdminLinks && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin/events">
                            <Settings className="h-4 w-4 mr-2" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-accent"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-border">
              {SHOW_EVENTS && (
                <Link
                  to="/events"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive("/events")
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                  }`}
                >
                  Events
                </Link>
              )}
              {SHOW_KNOWLEDGE && (
                <Link
                  to="/knowledge"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive("/knowledge")
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                  }`}
                >
                  Knowledge Base
                </Link>
              )}
              {SHOW_BLOG && (
                <Link
                  to="/blog"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive("/blog")
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                  }`}
                >
                  Blog
                </Link>
              )}
              <Link
                to="/testimonials"
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive("/testimonials")
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-primary hover:bg-accent"
                }`}
              >
                Testimonials
              </Link>
              {SHOW_CONTACT && (
                <Link
                  to="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive("/contact")
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                  }`}
                >
                  Contact
                </Link>
              )}
              
              {/* AI Tools - Mobile */}
              {SHOW_AI_TOOLS && (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    AI Tools
                  </div>
                  <Link
                    to="/bmc-generator"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-6 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive("/bmc-generator")
                        ? "text-primary bg-accent"
                        : "text-muted-foreground hover:text-primary hover:bg-accent"
                    }`}
                  >
                    BMC Generator
                  </Link>
                  <Link
                    to="/user-story-canvas"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-6 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive("/user-story-canvas")
                        ? "text-primary bg-accent"
                        : "text-muted-foreground hover:text-primary hover:bg-accent"
                    }`}
                  >
                    User Story Canvas
                  </Link>
                </>
              )}
              
              {/* Dashboard Link - Mobile */}
              {SHOW_DASHBOARD && user && (
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive("/dashboard")
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                  }`}
                >
                  Dashboard
                </Link>
              )}
               
               {/* Mobile Auth Section */}
               <div className="border-t border-border pt-2 mt-2">
                {loading ? (
                  <div className="px-3 py-2">Loading...</div>
                ) : user ? (
                  <>
                    <div className="px-3 py-2 text-sm text-muted-foreground flex items-center space-x-2">
                      <span>Signed in as {user.email}</span>
                      {userRole === 'admin' && <Shield className="h-3 w-3 text-primary" />}
                    </div>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary hover:bg-accent"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary hover:bg-accent"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
