import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Eye, 
  Star, 
  Clock, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  Target,
  BookmarkPlus,
  Share2,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { DifficultyBadge } from "@/components/knowledge/DifficultyBadge";
import { PlanningLayerBadges } from "@/components/knowledge/PlanningLayerBadges";
import { getTechniqueIcon, getCategoryColor } from "@/components/knowledge/TechniqueIcon";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { KnowledgeItem } from "@/hooks/useKnowledgeItems";

interface EnhancedTechniqueCardProps {
  item: KnowledgeItem;
  showDetails?: boolean;
}

export const EnhancedTechniqueCard = ({ item, showDetails = false }: EnhancedTechniqueCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  const hasW5HData = item.generic_who || item.generic_what || item.example_who || item.example_what;
  const hasExampleData = item.example_use_case || item.example_who;
  
  const TechniqueIcon = getTechniqueIcon(item.name, item.activity_categories?.name);
  const categoryColor = getCategoryColor(item.activity_categories?.name);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Share functionality
  };

  return (
    <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border-l-4 hover:border-l-primary relative overflow-hidden">
      {/* Popular/Featured Badge */}
      {item.popularity_score && item.popularity_score > 75 && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <Sparkles className="h-3 w-3 mr-1" />
            Popular
          </Badge>
        </div>
      )}

      <Link to={`/knowledge/${item.slug}`} className="block h-full">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            {/* Technique Icon */}
            <div 
              className="p-3 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
              style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
            >
              <TechniqueIcon className="h-6 w-6" />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Category and Domain Badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {item.activity_categories && (
                  <Badge 
                    variant="default" 
                    className="text-xs font-medium border-0"
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
                <DifficultyBadge difficulty={item.difficulty_level} />
              </div>
              
              {/* Title */}
              <CardTitle className="text-xl font-bold leading-tight mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {item.name}
              </CardTitle>
              
              {/* Focus Description */}
              {item.focus_description && (
                <div className="mb-3">
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-2 py-1 bg-primary/5 text-primary border-primary/20"
                  >
                    <Target className="h-3 w-3 mr-1" />
                    {item.focus_description.slice(0, 50)}...
                  </Badge>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10"
                onClick={handleBookmark}
              >
                <BookmarkPlus className={`h-4 w-4 ${isBookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Summary/Purpose */}
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
            {item.generic_summary || item.purpose || item.description}
          </p>
          
          {/* W5H Quick Preview */}
          {hasW5HData && showDetails && (
            <div className="mb-4 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/10">
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-between text-xs p-2 h-auto hover:bg-primary/10"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsExpanded(!isExpanded);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <span className="font-medium">At a Glance</span>
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {item.generic_who && (
                    <div className="text-xs bg-background/50 p-2 rounded">
                      <span className="font-medium text-primary">Who:</span> {item.generic_who.slice(0, 80)}...
                    </div>
                  )}
                  {item.generic_what && (
                    <div className="text-xs bg-background/50 p-2 rounded">
                      <span className="font-medium text-primary">What:</span> {item.generic_what.slice(0, 80)}...
                    </div>
                  )}
                  {item.generic_when && (
                    <div className="text-xs bg-background/50 p-2 rounded">
                      <span className="font-medium text-primary">When:</span> {item.generic_when.slice(0, 80)}...
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
          
          {/* Example Preview */}
          {hasExampleData && showDetails && (
            <div className="mb-4 p-3 bg-gradient-to-r from-secondary/30 to-secondary/20 rounded-lg border border-secondary/30">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-secondary-foreground" />
                <span className="text-xs font-medium text-secondary-foreground">Real-World Example</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.example_use_case || item.example_summary}
              </p>
            </div>
          )}
          
          {/* Planning Layers */}
          <div className="mb-4">
            <PlanningLayerBadges 
              layers={item.planning_layers || []} 
              maxVisible={3} 
            />
          </div>
          
          {/* Key Metadata */}
          {(item.typical_participants || item.duration_min_minutes) && (
            <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
              {item.typical_participants && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span className="font-medium">Participants:</span>
                  <span>{item.typical_participants.slice(0, 2).join(", ")}</span>
                  {item.typical_participants.length > 2 && <span>+{item.typical_participants.length - 2}</span>}
                </div>
              )}
              {item.duration_min_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">Duration:</span>
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
          
          {/* Footer: Enhanced Stats and CTA */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{item.view_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>{item.popularity_score || 0}</span>
              </div>
              {item.estimated_reading_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{item.estimated_reading_time}min read</span>
                </div>
              )}
            </div>
            
            {/* Enhanced CTA */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary hover:text-primary-foreground hover:bg-primary group-hover:translate-x-1 transition-all duration-200 font-medium"
            >
              Explore Technique
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          
          {/* Tags */}
          {item.knowledge_tags && item.knowledge_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border/50">
              {item.knowledge_tags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant="outline" className="text-xs px-2 py-0 text-muted-foreground hover:text-foreground transition-colors">
                  {tag.name}
                </Badge>
              ))}
              {item.knowledge_tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0 text-muted-foreground">
                  +{item.knowledge_tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
};