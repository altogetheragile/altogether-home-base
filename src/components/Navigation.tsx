
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut, Settings, LayoutDashboard, Shield, Sparkles, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BMCGeneratorDialog from "@/components/bmc/BMCGeneratorDialog";
import { UserStoryClarifierDialog } from "@/components/stories/UserStoryClarifierDialog";

const Navigation = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserStoryClarifier, setShowUserStoryClarifier] = useState(false);
  const { user, signOut, loading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();

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
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-primary">AltogetherAgile</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-8">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/")
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-primary hover:bg-accent"
                }`}
              >
                Home
              </Link>
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
              <Link
                to="/user-stories"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/user-stories")
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-primary hover:bg-accent"
                }`}
              >
                User Story AI
              </Link>
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
              
              {/* Dashboard Link - Only show for authenticated users */}
              {user && (
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
              
              {/* Admin Link - Only show for admin users with visual indicator */}
              {showAdminLinks && (
                <Link
                  to="/admin/events"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname.startsWith("/admin")
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                   <Shield className="h-3 w-3" />
                 </Link>
               )}
             </div>

              {/* AI Tools Section - Desktop */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4" />
                    <span>AI Tools</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setShowUserStoryClarifier(true)}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    User Story AI
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <div className="w-full">
                      <BMCGeneratorDialog />
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        My Dashboard
                      </Link>
                    </DropdownMenuItem>
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
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive("/")
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-primary hover:bg-accent"
                }`}
              >
                Home
              </Link>
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
              <Link
                to="/user-stories"
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive("/user-stories")
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-primary hover:bg-accent"
                }`}
              >
                User Story AI
              </Link>
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
              
              {/* Dashboard Link - Mobile */}
              {user && (
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
              
              {/* Admin Link - Mobile */}
              {showAdminLinks && (
                <Link
                  to="/admin/events"
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    location.pathname.startsWith("/admin")
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                  <Shield className="h-3 w-3" />
                 </Link>
               )}
               
                {/* AI Tools Section - Mobile */}
                <div className="border-t border-border pt-2 mt-2">
                  <div className="px-3 py-2 text-sm font-medium text-muted-foreground mb-2">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4" />
                      <span>AI Tools</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserStoryClarifier(true);
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary hover:bg-accent"
                  >
                    User Story AI
                  </button>
                  <div className="px-3 py-2">
                    <BMCGeneratorDialog />
                  </div>
                </div>
               
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
      
      <UserStoryClarifierDialog 
        isOpen={showUserStoryClarifier} 
        onClose={() => setShowUserStoryClarifier(false)} 
      />
    </nav>
  );
};

export default Navigation;
