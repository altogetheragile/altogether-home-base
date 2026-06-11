import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, LayoutTemplate, ArrowRight, ClipboardList, Target, UserCircle, FileSpreadsheet, RefreshCw, FlaskConical, LineChart } from "lucide-react";
import { SITE_URL } from "@/config/featureFlags";

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
    {
      id: "impact-map",
      name: "Impact Map Builder",
      description: "Build and export Impact Maps (Gojko Adzic). A guided flow walks you through goal, actors, impacts, and deliverables, with FreeMind, PNG, PDF, and JSON export.",
      icon: Target,
      route: "/impact-map",
      badge: "Guided",
    },
    {
      id: "persona-studio",
      name: "Persona Studio",
      description: "Shape a clear, named persona through a coaching conversation: their role, context, goals, pains, behaviours and voice. Export to PNG, PDF, JSON and Markdown.",
      icon: UserCircle,
      route: "/personas",
      badge: "Coached",
    },
    {
      id: "canvas-catalogue",
      name: "Canvas Catalogue",
      description: "Coached strategy canvases: Business Model Canvas, Business Case, and Product Vision. A picker recommends one, then you fill it through conversation and export.",
      icon: FileSpreadsheet,
      route: "/canvases",
      badge: "Coached",
    },
    {
      id: "ways-of-working",
      name: "Ways of Working",
      description: "Agree how your team works, then keep it honest. Run a short coached retrospective that lands on one improvement action at a time. Export to PNG, PDF, JSON and Markdown.",
      icon: RefreshCw,
      route: "/ways-of-working",
      badge: "Coached",
    },
    {
      id: "probe-tracker",
      name: "Probe Tracker",
      description: "Run your output options as safe-to-fail experiments. A simple kanban moves each probe from Planned to Running to Kept or Killed, with the signal that would prove it wrong.",
      icon: FlaskConical,
      route: "/probes",
      badge: "Coached",
    },
    {
      id: "benefits-scorecard",
      name: "Benefits Scorecard",
      description: "Track whether the numbers actually moved. Each outcome carries a leading indicator, a target and dated readings, with a trend line and a Benefits on a Page PDF export.",
      icon: LineChart,
      route: "/benefits",
      badge: "Coached",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>AI Tools Hub - Altogether Agile</title>
        <meta name="description" content="Explore our collection of AI-powered tools designed to streamline your workflow and boost productivity." />
        <link rel="canonical" href={`${SITE_URL}/ai-tools`} />
      </Helmet>
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
