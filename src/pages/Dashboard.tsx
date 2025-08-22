
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Bookmark, 
  Trophy, 
  Target, 
  TrendingUp, 
  Clock,
  ArrowRight,
  Calendar,
  CalendarCheck,
  FolderOpen
} from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useUserRegistrations } from "@/hooks/useUserRegistrations";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserBookmarks } from '@/hooks/useUserBookmarks';
import { useLearningPaths } from '@/hooks/useLearningPaths';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RegistrationsList from "@/components/dashboard/RegistrationsList";
import { Navigate, Link } from "react-router-dom";
import { DifficultyBadge } from '@/components/knowledge/DifficultyBadge';
import { LearningPathCard } from '@/components/knowledge/LearningPathCard';
import { ProjectsList } from '@/components/dashboard/ProjectsList';
import { useProjects } from '@/hooks/useProjects';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: registrations, isLoading: registrationsLoading } = useUserRegistrations();
  const { data: profile } = useUserProfile();
  const { bookmarks, isLoading: bookmarksLoading } = useUserBookmarks();
  const { paths, isLoading: pathsLoading } = useLearningPaths();
  const { data: projects } = useProjects();

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Calculate user statistics
  const completedTechniques = 0; // TODO: Calculate from reading progress
  const totalReadingTime = 0; // TODO: Calculate from reading progress
  const currentStreak = 0; // TODO: Calculate reading streak
  
  // Calculate event statistics
  const upcomingEvents = registrations?.filter(reg => {
    const eventDate = new Date(reg.event?.start_date || '');
    return eventDate > new Date();
  }).length || 0;
  
  const pastEvents = registrations?.filter(reg => {
    const eventDate = new Date(reg.event?.start_date || '');
    return eventDate <= new Date();
  }).length || 0;

  const stats = [
    {
      icon: FolderOpen,
      label: 'Projects',
      value: projects?.length || 0,
      color: 'text-blue-600',
    },
    {
      icon: BookOpen,
      label: 'Techniques Read',
      value: completedTechniques,
      color: 'text-green-600',
    },
    {
      icon: Bookmark,
      label: 'Bookmarked',
      value: bookmarks?.length || 0,
      color: 'text-amber-600',
    },
    {
      icon: Clock,
      label: 'Reading Time',
      value: `${Math.floor(totalReadingTime / 60)}h`,
      color: 'text-purple-600',
    },
    {
      icon: Calendar,
      label: 'Upcoming Events',
      value: upcomingEvents,
      color: 'text-orange-600',
    },
    {
      icon: CalendarCheck,
      label: 'Past Events',
      value: pastEvents,
      color: 'text-slate-600',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.full_name?.split(' ')[0] || user.email}! Track your progress and manage your activities.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                      <Icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <Tabs defaultValue="projects" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
              <TabsTrigger value="learning-paths">Learning Paths</TabsTrigger>
              <TabsTrigger value="progress">Reading Progress</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your Projects</h2>
              </div>
              
              <ProjectsList />
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Event Registrations</h2>
                <Button variant="outline" asChild>
                  <Link to="/events">
                    <Calendar className="h-4 w-4 mr-2" />
                    Browse Events
                  </Link>
                </Button>
              </div>
              
              <RegistrationsList registrations={registrations} isLoading={registrationsLoading} />
            </TabsContent>

            <TabsContent value="bookmarks" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your Bookmarks</h2>
                <Button variant="outline" asChild>
                  <Link to="/knowledge">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Techniques
                  </Link>
                </Button>
              </div>

              {bookmarksLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-3 bg-muted rounded w-2/3 mb-4"></div>
                        <div className="h-8 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : bookmarks && bookmarks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bookmarks.map((bookmark) => (
                    <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg leading-tight">
                            {bookmark.technique?.name}
                          </CardTitle>
                          {bookmark.technique?.category && (
                            <Badge 
                              variant="secondary"
                              style={{
                                backgroundColor: `${bookmark.technique.category.color}20`,
                                color: bookmark.technique.category.color
                              }}
                            >
                              {bookmark.technique.category.name}
                            </Badge>
                          )}
                        </div>
                        {bookmark.technique?.summary && (
                          <CardDescription className="line-clamp-2">
                            {bookmark.technique.summary}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {bookmark.technique?.difficulty_level && (
                              <DifficultyBadge difficulty={bookmark.technique.difficulty_level} />
                            )}
                          </div>
                          <Button size="sm" asChild>
                            <Link to={`/knowledge/${bookmark.technique?.slug}`}>
                              Read <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium mb-2">No bookmarks yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start bookmarking techniques you want to read later.
                    </p>
                    <Button asChild>
                      <Link to="/knowledge">
                        Browse Knowledge Base
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="learning-paths" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Learning Paths</h2>
                <Button variant="outline" asChild>
                  <Link to="/learning-paths">
                    <Target className="h-4 w-4 mr-2" />
                    Browse All Paths
                  </Link>
                </Button>
              </div>

              {pathsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-3 bg-muted rounded w-2/3 mb-4"></div>
                        <div className="h-2 bg-muted rounded mb-4"></div>
                        <div className="h-8 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : paths && paths.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paths.slice(0, 6).map((path) => (
                    <LearningPathCard 
                      key={path.id} 
                      path={path}
                      onStart={() => {
                        // TODO: Start learning path
                        console.log('Starting path:', path.id);
                      }}
                      onContinue={() => {
                        // TODO: Continue learning path
                        console.log('Continuing path:', path.id);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium mb-2">No learning paths available</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Learning paths will appear here once they're published.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Reading Progress</h2>
                <Button variant="outline" asChild>
                  <Link to="/knowledge">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Continue Reading
                  </Link>
                </Button>
              </div>

              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">Progress tracking coming soon</h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed reading progress and analytics will be available here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
