import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Target, CheckCircle, AlertTriangle, Lightbulb } from "lucide-react";

interface TechniqueTemplateProps {
  title: string;
  summary: string;
  factors?: string[];
  who?: string;
  what?: string;
  why?: string;
  teamSize?: string;
  duration?: string;
  participants?: string;
  skills?: string;
  success?: string;
  pitfalls?: string[];
  related?: string[];
  category?: {
    name: string;
    color: string;
  };
  domain?: {
    name: string;
    color: string;
  };
  focus?: {
    name: string;
    color: string;
  };
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  className?: string;
}

export const TechniqueTemplate = ({
  title,
  summary,
  factors = [],
  who,
  what,
  why,
  teamSize,
  duration,
  participants,
  skills,
  success,
  pitfalls = [],
  related = [],
  category,
  domain,
  focus,
  difficulty,
  className = ""
}: TechniqueTemplateProps) => {
  const getDifficultyColor = (level?: string) => {
    switch (level) {
      case 'beginner': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'intermediate': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className={`group transition-all duration-200 hover:shadow-lg ${className}`}>
      <CardHeader className="pb-4">
        {/* Header Badges */}
        <div className="flex items-center gap-2 mb-3">
          {category && (
            <Badge 
              variant="default" 
              className="text-xs font-medium border"
              style={{ 
                backgroundColor: category.color,
                color: "white",
                borderColor: category.color
              }}
            >
              {category.name}
            </Badge>
          )}
          {domain && (
            <Badge 
              variant="outline" 
              className="text-xs font-medium"
              style={{ 
                borderColor: domain.color, 
                color: domain.color 
              }}
            >
              {domain.name}
            </Badge>
          )}
          {difficulty && (
            <Badge 
              variant="outline" 
              className={`text-xs font-medium ${getDifficultyColor(difficulty)}`}
            >
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Badge>
          )}
        </div>
        
        {/* Title */}
        <CardTitle className="text-xl font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        
        {/* Focus Badge */}
        {focus && (
          <Badge 
            variant="secondary" 
            className="text-xs w-fit"
            style={{ 
              backgroundColor: `${focus.color}15`,
              color: focus.color,
              borderColor: `${focus.color}30`
            }}
          >
            <Target className="h-3 w-3 mr-1" />
            {focus.name}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {summary}
        </p>
        
        {/* Core W5H Information */}
        {(who || what || why) && (
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Core Framework
            </h4>
            <div className="grid gap-3">
              {who && (
                <div>
                  <span className="text-xs font-medium text-primary">Who:</span>
                  <span className="text-xs text-muted-foreground ml-2">{who}</span>
                </div>
              )}
              {what && (
                <div>
                  <span className="text-xs font-medium text-primary">What:</span>
                  <span className="text-xs text-muted-foreground ml-2">{what}</span>
                </div>
              )}
              {why && (
                <div>
                  <span className="text-xs font-medium text-primary">Why:</span>
                  <span className="text-xs text-muted-foreground ml-2">{why}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Key Factors */}
        {factors.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Key Factors</h4>
            <div className="flex flex-wrap gap-2">
              {factors.map((factor, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Practical Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(teamSize || duration) && (
            <div className="space-y-3 p-3 bg-card border border-border rounded-lg">
              <h4 className="text-sm font-semibold text-foreground">Logistics</h4>
              <div className="space-y-2">
                {teamSize && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{teamSize}</span>
                  </div>
                )}
                {duration && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{duration}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {(participants || skills) && (
            <div className="space-y-3 p-3 bg-card border border-border rounded-lg">
              <h4 className="text-sm font-semibold text-foreground">Requirements</h4>
              <div className="space-y-2">
                {participants && (
                  <div className="text-xs">
                    <span className="font-medium text-muted-foreground">Participants:</span>
                    <span className="text-muted-foreground ml-1">{participants}</span>
                  </div>
                )}
                {skills && (
                  <div className="text-xs">
                    <span className="font-medium text-muted-foreground">Skills:</span>
                    <span className="text-muted-foreground ml-1">{skills}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Success & Pitfalls */}
        {(success || pitfalls.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {success && (
              <div className="space-y-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-sm font-semibold text-emerald-900">Success Criteria</h4>
                </div>
                <p className="text-xs text-emerald-800">{success}</p>
              </div>
            )}
            
            {pitfalls.length > 0 && (
              <div className="space-y-3 p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <h4 className="text-sm font-semibold text-amber-900">Common Pitfalls</h4>
                </div>
                <ul className="space-y-1">
                  {pitfalls.slice(0, 3).map((pitfall, index) => (
                    <li key={index} className="text-xs text-amber-800">• {pitfall}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Related Techniques */}
        {related.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Related Techniques</h4>
            <div className="flex flex-wrap gap-2">
              {related.slice(0, 4).map((technique, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {technique}
                </Badge>
              ))}
              {related.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{related.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TechniqueTemplate;