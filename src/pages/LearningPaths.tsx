import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, Clock, BookOpen, ArrowRight, Users } from 'lucide-react';
import { useLearningPaths } from '@/hooks/useLearningPaths';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { DifficultyBadge } from '@/components/knowledge/DifficultyBadge';
import { LearningPathCard } from '@/components/knowledge/LearningPathCard';

const LearningPaths: React.FC = () => {
  const { paths, isLoading } = useLearningPaths();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Learning Paths
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Structured learning journeys to help you master product delivery techniques step by step.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{paths?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Learning Paths</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {paths?.reduce((total, path) => total + (path.steps?.length || 0), 0) || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Techniques</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">All Levels</p>
                <p className="text-sm text-muted-foreground">From Beginner to Advanced</p>
              </CardContent>
            </Card>
          </div>

          {/* Learning Paths Grid */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Available Paths</h2>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Skeleton className="h-2 w-full" />
                        <div className="flex justify-between">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-8 w-24" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : paths && paths.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paths.map((path) => (
                  <LearningPathCard 
                    key={path.id} 
                    path={path}
                    onStart={() => {
                      // TODO: Implement start path functionality
                      console.log('Starting path:', path.id);
                    }}
                    onContinue={() => {
                      // TODO: Implement continue path functionality
                      console.log('Continuing path:', path.id);
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <Target className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-4">No Learning Paths Available</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Learning paths are being prepared to help guide your product delivery journey.
                    Check back soon for structured learning experiences.
                  </p>
                  <Button asChild>
                    <a href="/knowledge">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Browse Individual Techniques
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* How Learning Paths Work */}
          <div className="mt-16">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  How Learning Paths Work
                </CardTitle>
                <CardDescription>
                  Learning paths provide structured journeys through related techniques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                      <span className="text-lg font-bold text-blue-600">1</span>
                    </div>
                    <h4 className="font-medium mb-2">Choose Your Path</h4>
                    <p className="text-sm text-muted-foreground">
                      Select a learning path that matches your skill level and goals
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                      <span className="text-lg font-bold text-green-600">2</span>
                    </div>
                    <h4 className="font-medium mb-2">Follow the Steps</h4>
                    <p className="text-sm text-muted-foreground">
                      Work through techniques in the recommended order
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                      <span className="text-lg font-bold text-purple-600">3</span>
                    </div>
                    <h4 className="font-medium mb-2">Track Progress</h4>
                    <p className="text-sm text-muted-foreground">
                      Monitor your learning progress and celebrate achievements
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default LearningPaths;