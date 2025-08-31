import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Eye, Star, Clock, Users, ChevronDown, ChevronUp, Lightbulb, Target } from "lucide-react";
import { DifficultyBadge } from "@/components/knowledge/DifficultyBadge";
import { PlanningLayerBadges } from "@/components/knowledge/PlanningLayerBadges";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { KnowledgeItem } from "@/hooks/useKnowledgeItems";

interface EnhancedKnowledgeCardProps {
  item: KnowledgeItem;
  showDetails?: boolean;
}

export const EnhancedKnowledgeCard = ({ item, showDetails = false }: EnhancedKnowledgeCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasW5HData = item.generic_who || item.generic_what || item.example_who || item.example_what;
  const hasExampleData = item.example_use_case || item.example_who;

  return (
    <Link to={`/knowledge/${item.slug}`}>
      <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Category and Domain Badges */}
              <div className="flex items-center gap-2 mb-3">
                {item.activity_categories && (
                  <Badge 
                    variant="default" 
                    className="text-xs font-medium"
                    style={{ 
                      backgroundColor: item.activity_categories.color,
                      color: "white"
                    }}
                  >
                    {item.activity_categories.name}
                  </Badge>
                )}
                {item.activity_domains && (
                  <Badge 
                    variant="outline" 
                    className="text-xs font-medium"
                    style={{ 
                      borderColor: item.activity_domains.color, 
                      color: item.activity_domains.color 
                    }}
                  >
                    {item.activity_domains.name}
                  </Badge>
                )}
                {/* Removed difficulty badge since it's not in the simplified schema */}
              </div>
              
              {/* Title */}
              <CardTitle className="text-lg font-bold leading-tight mb-2 text-foreground group-hover:text-primary transition-colors">
                {item.name}
              </CardTitle>
              
              {/* Focus Badge */}
              {item.activity_focus && (
                <Badge 
                  variant="secondary" 
                  className="text-xs mb-2"
                  style={{ 
                    backgroundColor: `${item.activity_focus.color}10`,
                    color: item.activity_focus.color,
                    borderColor: `${item.activity_focus.color}30`
                  }}
                >
                  <Target className="h-3 w-3 mr-1" />
                  {item.activity_focus.name}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Summary/Purpose */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {item.generic_summary || item.purpose || item.description}
          </p>
          
          {/* W5H Quick Preview */}
          {hasW5HData && showDetails && (
            <div className="mb-3 p-3 bg-muted/30 rounded-lg">
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-between text-xs p-2 h-auto"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsExpanded(!isExpanded);
                    }}
                  >
                    <span className="flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      W5H Framework
                    </span>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {item.generic_who && (
                    <div className="text-xs">
                      <span className="font-medium text-primary">Who:</span> {item.generic_who.slice(0, 80)}...
                    </div>
                  )}
                  {item.generic_what && (
                    <div className="text-xs">
                      <span className="font-medium text-primary">What:</span> {item.generic_what.slice(0, 80)}...
                    </div>
                  )}
                  {item.generic_when && (
                    <div className="text-xs">
                      <span className="font-medium text-primary">When:</span> {item.generic_when.slice(0, 80)}...
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
          
          {/* Example Preview */}
          {hasExampleData && showDetails && (
            <div className="mb-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-center gap-1 mb-2">
                <Users className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">Real Example</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.example_use_case || item.example_summary}
              </p>
            </div>
          )}
          
          {/* Planning Layers */}
          <div className="mb-3">
            <PlanningLayerBadges 
              layers={item.planning_layers || []} 
              maxVisible={2} 
            />
          </div>
          
          {/* Participants and Duration */}
          {(item.typical_participants || item.duration_min_minutes) && (
            <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
              {item.typical_participants && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{item.typical_participants.slice(0, 2).join(", ")}</span>
                  {item.typical_participants.length > 2 && <span>+{item.typical_participants.length - 2}</span>}
                </div>
              )}
              {item.duration_min_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {item.duration_max_minutes && item.duration_min_minutes !== item.duration_max_minutes
                      ? `${item.duration_min_minutes}-${item.duration_max_minutes}min`
                      : `${item.duration_min_minutes}min`
                    }
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Footer: Stats and Tags */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{item.view_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>{item.view_count || 0}</span>
              </div>
              {item.estimated_reading_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{item.estimated_reading_time}min</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {item.knowledge_tags?.slice(0, 2).map((tag) => (
                <Badge key={tag.id} variant="outline" className="text-xs px-1 py-0">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};