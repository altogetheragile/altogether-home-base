import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, LayoutTemplate, ArrowRight, ClipboardList } from "lucide-react";

const AIToolsHub = () => {
  const tools = [
    {
      id: "bmc-generator",
      name: "Business Model Canvas Generator",
      description: "Generate a comprehensive Business Model Canvas using AI. Fill in your company details and get a professional BMC instantly.",
      icon: Sparkles,
      route: "/bmc-generator",
      badge: "AI-Powered",
    },
    {
      id: "user-story-canvas",
      name: "User Story Canvas",
      description: "Create AI-powered user stories and strategic frameworks on an interactive canvas. Visualize your project planning with intelligent tools.",
      icon: LayoutTemplate,
      route: "/user-story-canvas",
      badge: "AI-Powered",
    },
    {
      id: "project-modelling",
      name: "Project Modelling Canvas",
      description: "Brainstorm and visually model your project using hexagonal elements, knowledge items, planning focuses, and sticky notes.",
      icon: LayoutTemplate,
      route: "/project-modelling",
      badge: "Brainstorm",
    },
    {
      id: "product-backlog",
      name: "Product Backlog",
      description: "Capture, prioritize, and manage your product backlog. Track enhancements, bugs, and ideas with drag-and-drop ordering.",
      icon: ClipboardList,
      route: "/backlog",
      badge: "Prioritize",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-accent to-background py-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              AI Tools Hub
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our collection of AI-powered tools designed to streamline your workflow and boost productivity.
            </p>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Card 
                    key={tool.id} 
                    className="hover:shadow-lg transition-shadow duration-300 border-border"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Icon className="h-8 w-8 text-primary" />
                        </div>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-accent text-accent-foreground">
                          {tool.badge}
                        </span>
                      </div>
                      <CardTitle className="text-2xl mb-2">{tool.name}</CardTitle>
                      <CardDescription className="text-base">
                        {tool.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link to={tool.route}>
                        <Button className="w-full group">
                          Launch Tool
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AIToolsHub;
