
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, Target, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Transform Your Team with
            <span className="text-primary block">Agile Excellence</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Expert agile coaching, training, and transformation services to help your organization 
            achieve sustainable success through collaborative practices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/events">
              <Button size="lg" className="w-full sm:w-auto">
                View Upcoming Events
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            {user ? (
              <Link to="/blog">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Read Our Blog
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign In / Register
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose AltogetherAgile?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We bring proven expertise and practical solutions to accelerate your agile journey.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Expert Coaching</CardTitle>
                <CardDescription>
                  Experienced agile coaches who understand real-world challenges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our certified coaches bring years of hands-on experience helping teams 
                  implement sustainable agile practices.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Practical Training</CardTitle>
                <CardDescription>
                  Hands-on workshops and training programs that deliver results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Interactive learning experiences designed to build confidence and 
                  competence in agile methodologies.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Organizational Transformation</CardTitle>
                <CardDescription>
                  End-to-end support for scaling agile across your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Strategic guidance to help your entire organization embrace 
                  agile principles and achieve lasting change.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Start Your Agile Journey?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join organizations worldwide who have transformed their teams with our proven approach.
          </p>
          <Link to="/events">
            <Button size="lg">
              Explore Our Events
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
