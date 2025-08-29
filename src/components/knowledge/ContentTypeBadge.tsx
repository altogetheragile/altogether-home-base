import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Wrench, 
  FileText, 
  Layout, 
  Lightbulb,
  Target
} from "lucide-react";

interface ContentTypeBadgeProps {
  type: string;
  className?: string;
}

export const ContentTypeBadge = ({ type, className }: ContentTypeBadgeProps) => {
  const getTypeConfig = (contentType: string) => {
    switch (contentType.toLowerCase()) {
      case 'technique':
        return {
          icon: Wrench,
          label: 'Technique',
          color: 'bg-primary/10 text-primary border-primary/20'
        };
      case 'framework':
        return {
          icon: Layout,
          label: 'Framework',
          color: 'bg-secondary/10 text-secondary border-secondary/20'
        };
      case 'template':
        return {
          icon: FileText,
          label: 'Template',
          color: 'bg-accent/10 text-accent border-accent/20'
        };
      case 'case study':
        return {
          icon: BookOpen,
          label: 'Case Study',
          color: 'bg-muted/10 text-muted-foreground border-muted/20'
        };
      case 'principle':
        return {
          icon: Lightbulb,
          label: 'Principle',
          color: 'bg-warning/10 text-warning border-warning/20'
        };
      case 'method':
        return {
          icon: Target,
          label: 'Method',
          color: 'bg-success/10 text-success border-success/20'
        };
      default:
        return {
          icon: BookOpen,
          label: type,
          color: 'bg-secondary/10 text-secondary-foreground border-secondary/20'
        };
    }
  };

  const config = getTypeConfig(type);
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`text-xs px-2 py-0.5 ${config.color} ${className}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};