import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { RecommendationsSection } from '@/components/recommendations/RecommendationsSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Calendar, Users, Star, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  // Development log to confirm this is the home page being rendered
  if (process.env.NODE_ENV === 'development') {
    console.log('🏠 Home page rendering');
  }

  // Feature flags for safe reintroduction of dynamic content
  const ENABLE_RECOMMENDATIONS = false; // Can be toggled to false for testing

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Welcome to AltogetherAgile
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              Your central hub for agile transformation and coaching. Discover techniques, 
              join events, and connect with like-minded professionals.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" asChild>
                <Link to="/events">
                  <Calendar className="h-5 w-5 mr-2" />
                  Browse Events
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/knowledge">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Explore Knowledge
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              What We Offer
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to grow and learn in one place
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">Learning Techniques</h3>
                <p className="mt-2 text-muted-foreground">
                  Discover proven agile techniques and methodologies to enhance your skills.
                </p>
                <Button variant="ghost" size="sm" className="mt-4" asChild>
                  <Link to="/knowledge">
                    Learn More <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <Calendar className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">Events & Workshops</h3>
                <p className="mt-2 text-muted-foreground">
                  Join live events, workshops, and training sessions with agile experts.
                </p>
                <Button variant="ghost" size="sm" className="mt-4" asChild>
                  <Link to="/events">
                    View Events <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">Community</h3>
                <p className="mt-2 text-muted-foreground">
                  Connect with a vibrant community of agile practitioners and coaches.
                </p>
                <Button variant="ghost" size="sm" className="mt-4" asChild>
                  <Link to="/blog">
                    Read Blog <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recommendations Section - Safely Wrapped */}
      {ENABLE_RECOMMENDATIONS && (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary fallback={
              <div className="text-center py-8">
                <p className="text-muted-foreground">Recommendations temporarily unavailable</p>
              </div>
            }>
              <Suspense fallback={
                <div className="text-center py-8">
                  <div className="animate-pulse">
                    <div className="h-8 bg-muted rounded w-64 mx-auto mb-4"></div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-48 bg-muted rounded-lg"></div>
                      ))}
                    </div>
                  </div>
                </div>
              }>
                <RecommendationsSection />
              </Suspense>
            </ErrorBoundary>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Home;