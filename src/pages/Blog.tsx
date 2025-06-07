
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight } from "lucide-react";

const Blog = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <div className="flex-1">
        {/* Header */}
        <section className="bg-gradient-to-b from-background to-muted py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Agile Insights & Resources
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Expert insights, practical tips, and thought leadership on agile methodologies, 
              team dynamics, and organizational transformation.
            </p>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              
              {/* Blog Post Placeholder */}
              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit mb-2">Agile Fundamentals</Badge>
                  <CardTitle className="text-xl">Getting Started with Agile Transformation</CardTitle>
                  <CardDescription>
                    Essential steps every organization should take when beginning their agile journey.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Coming Soon</span>
                    <User className="h-4 w-4 ml-4 mr-2" />
                    <span>AltogetherAgile Team</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Blog Post Placeholder */}
              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit mb-2">Team Dynamics</Badge>
                  <CardTitle className="text-xl">Building High-Performing Agile Teams</CardTitle>
                  <CardDescription>
                    Strategies for fostering collaboration, trust, and continuous improvement within teams.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Coming Soon</span>
                    <User className="h-4 w-4 ml-4 mr-2" />
                    <span>AltogetherAgile Team</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Blog Post Placeholder */}
              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit mb-2">Leadership</Badge>
                  <CardTitle className="text-xl">Agile Leadership in Practice</CardTitle>
                  <CardDescription>
                    How leaders can support and enable agile transformation across their organizations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Coming Soon</span>
                    <User className="h-4 w-4 ml-4 mr-2" />
                    <span>AltogetherAgile Team</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

            </div>

            {/* No Posts Message */}
            <div className="text-center mt-16 p-8 bg-muted/50 rounded-lg">
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                Blog Content Coming Soon
              </h3>
              <p className="text-muted-foreground mb-6">
                We're preparing valuable content on agile methodologies, team coaching, 
                and organizational transformation. Once connected to Supabase, this page 
                will feature dynamic blog posts with full content management capabilities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline">
                  Subscribe to Newsletter
                </Button>
                <Button variant="outline">
                  Follow Our Updates
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Blog;
