import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Target, Layers, Lightbulb, AlertTriangle, CheckCircle, Wrench } from "lucide-react";
import type { KnowledgeItem } from "@/hooks/useKnowledgeItems";

interface TechniqueMetadataProps {
  item: KnowledgeItem;
}

export const TechniqueMetadata = ({ item }: TechniqueMetadataProps) => {
  const MetadataSection = ({ 
    title, 
    icon: Icon, 
    items, 
    color = "text-primary" 
  }: { 
    title: string; 
    icon: any; 
    items?: string[]; 
    color?: string;
  }) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <h4 className="font-semibold text-sm">{title}</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {item}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  const hasMetadata = item.typical_participants || 
                     item.required_skills || 
                     item.success_criteria || 
                     item.common_pitfalls || 
                     item.related_practices ||
                     item.team_size_min ||
                     item.duration_min_minutes;

  if (!hasMetadata) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Technique Metadata
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team and Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(item.team_size_min || item.team_size_max) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-sm">Team Size</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {item.team_size_min === item.team_size_max 
                  ? `${item.team_size_min} people`
                  : `${item.team_size_min || 1}-${item.team_size_max || "∞"} people`
                }
              </div>
            </div>
          )}
          
          {(item.duration_min_minutes || item.duration_max_minutes) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-sm">Duration</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {item.duration_min_minutes === item.duration_max_minutes
                  ? `${item.duration_min_minutes} minutes`
                  : `${item.duration_min_minutes || 15}-${item.duration_max_minutes || "∞"} minutes`
                }
              </div>
            </div>
          )}
        </div>

        {/* Participants and Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetadataSection
            title="Typical Participants"
            icon={Users}
            items={item.typical_participants}
            color="text-blue-600"
          />
          
          <MetadataSection
            title="Required Skills"
            icon={Wrench}
            items={item.required_skills}
            color="text-purple-600"
          />
        </div>

        {/* Success and Pitfalls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetadataSection
            title="Success Criteria"
            icon={CheckCircle}
            items={item.success_criteria}
            color="text-green-600"
          />
          
          <MetadataSection
            title="Common Pitfalls"
            icon={AlertTriangle}
            items={item.common_pitfalls}
            color="text-red-600"
          />
        </div>

        {/* Related Practices */}
        <MetadataSection
          title="Related Practices"
          icon={Target}
          items={item.related_practices}
          color="text-indigo-600"
        />

        {/* Planning Considerations */}
        {item.planning_considerations && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <h4 className="font-semibold text-sm">Planning Considerations</h4>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">{item.planning_considerations}</p>
            </div>
          </div>
        )}

        {/* Industry Context */}
        {item.industry_context && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-teal-600" />
              <h4 className="font-semibold text-sm">Industry Context</h4>
            </div>
            <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
              <p className="text-sm text-teal-800">{item.industry_context}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};