import { 
  Target, 
  Users, 
  BarChart3, 
  Lightbulb, 
  Zap, 
  Search, 
  MessageSquare, 
  CheckSquare, 
  Layers, 
  Map, 
  Settings, 
  PieChart,
  TrendingUp,
  Brain,
  Workflow,
  Heart,
  Eye,
  Shield,
  Compass,
  type LucideIcon
} from "lucide-react";

// Technique icon mapping based on common categories and keywords
export const getTechniqueIcon = (techniqueName: string, category?: string): LucideIcon => {
  const name = techniqueName.toLowerCase();
  const cat = category?.toLowerCase() || "";

  // Strategy & Planning
  if (name.includes("swot") || name.includes("pestle") || name.includes("canvas") || cat.includes("strategy")) {
    return Target;
  }
  
  // User Research & Testing
  if (name.includes("user") || name.includes("persona") || name.includes("interview") || cat.includes("research")) {
    return Users;
  }
  
  // Analytics & Metrics
  if (name.includes("metric") || name.includes("kpi") || name.includes("analytics") || cat.includes("metric")) {
    return BarChart3;
  }
  
  // Ideation & Creativity
  if (name.includes("brainstorm") || name.includes("ideation") || name.includes("creative") || cat.includes("ideation")) {
    return Lightbulb;
  }
  
  // Agile & Lean
  if (name.includes("sprint") || name.includes("scrum") || name.includes("kanban") || name.includes("agile")) {
    return Zap;
  }
  
  // Discovery & Exploration
  if (name.includes("discovery") || name.includes("exploration") || name.includes("research")) {
    return Search;
  }
  
  // Communication & Feedback
  if (name.includes("feedback") || name.includes("retrospective") || name.includes("communication")) {
    return MessageSquare;
  }
  
  // Testing & Validation
  if (name.includes("test") || name.includes("validation") || name.includes("ab test")) {
    return CheckSquare;
  }
  
  // Process & Workflow
  if (name.includes("process") || name.includes("workflow") || name.includes("framework")) {
    return Workflow;
  }
  
  // Architecture & Structure
  if (name.includes("architecture") || name.includes("structure") || name.includes("layer")) {
    return Layers;
  }
  
  // Journey & Mapping
  if (name.includes("journey") || name.includes("map") || name.includes("flow")) {
    return Map;
  }
  
  // Configuration & Setup
  if (name.includes("setup") || name.includes("config") || name.includes("tool")) {
    return Settings;
  }
  
  // Data & Visualization
  if (name.includes("chart") || name.includes("graph") || name.includes("visual")) {
    return PieChart;
  }
  
  // Growth & Optimization
  if (name.includes("growth") || name.includes("optimization") || name.includes("improvement")) {
    return TrendingUp;
  }
  
  // Psychology & Behavior
  if (name.includes("psychology") || name.includes("behavior") || name.includes("cognitive")) {
    return Brain;
  }
  
  // Emotional & Experience
  if (name.includes("emotion") || name.includes("experience") || name.includes("empathy")) {
    return Heart;
  }
  
  // Observation & Monitoring
  if (name.includes("observe") || name.includes("monitor") || name.includes("watch")) {
    return Eye;
  }
  
  // Risk & Security
  if (name.includes("risk") || name.includes("security") || name.includes("compliance")) {
    return Shield;
  }
  
  // Navigation & Direction
  if (name.includes("roadmap") || name.includes("direction") || name.includes("guide")) {
    return Compass;
  }

  // Default fallback
  return Target;
};

// Category color mapping
export const getCategoryColor = (categoryName?: string): string => {
  if (!categoryName) return "hsl(var(--primary))";
  
  const name = categoryName.toLowerCase();
  
  if (name.includes("strategy")) return "hsl(220, 70%, 50%)";
  if (name.includes("research")) return "hsl(260, 70%, 50%)";
  if (name.includes("design")) return "hsl(300, 70%, 50%)";
  if (name.includes("development")) return "hsl(160, 70%, 50%)";
  if (name.includes("testing")) return "hsl(40, 70%, 50%)";
  if (name.includes("analytics")) return "hsl(200, 70%, 50%)";
  if (name.includes("management")) return "hsl(350, 70%, 50%)";
  
  return "hsl(var(--primary))";
};