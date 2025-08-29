import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  Star, 
  Clock, 
  Users, 
  ArrowRight,
  Sparkles,
  MessageCircle,
  Share2
} from "lucide-react";
import { DifficultyBadge } from "@/components/knowledge/DifficultyBadge";
import { PlanningLayerBadges } from "@/components/knowledge/PlanningLayerBadges";
import { BookmarkButton } from "@/components/knowledge/BookmarkButton";
import { getTechniqueIcon, getCategoryColor } from "@/components/knowledge/TechniqueIcon";
import { Link } from "react-router-dom";
import type { KnowledgeItem } from "@/hooks/useKnowledgeItems";

interface EnhancedTechniqueCardProps {
  item: KnowledgeItem;
}

export const EnhancedTechniqueCard = ({ item }: EnhancedTechniqueCardProps) => {
  const TechniqueIcon = getTechniqueIcon(item.name, item.activity_categories?.name);
  const categoryColor = getCategoryColor(item.activity_categories?.name);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: item.name,
        text: item.generic_summary || item.purpose || item.description,
        url: window.location.origin + `/knowledge/${item.slug}`
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.origin + `/knowledge/${item.slug}`);
    }
  };

  // Format duration properly
  const formatDuration = (minMinutes?: number, maxMinutes?: number) => {
    if (!minMinutes) return null;
    
    if (minMinutes < 60) {
      if (maxMinutes && maxMinutes !== minMinutes && maxMinutes < 60) {
        return `${minMinutes}-${maxMinutes} min`;
      }
      return `~${minMinutes} min`;
    }
    
    const minHours = Math.floor(minMinutes / 60);
    const maxHours = maxMinutes ? Math.floor(maxMinutes / 60) : minHours;
    
    if (maxHours && maxHours !== minHours) {
      return `${minHours}-${maxHours} hours`;
    }
    return `~${minHours} ${minHours === 1 ? 'hour' : 'hours'}`;
  };

  // Smart truncation that completes sentences
  const smartTruncate = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'), 
      truncated.lastIndexOf('!'), 
      truncated.lastIndexOf('?')
    );
    
    if (lastSentenceEnd > maxLength * 0.7) {
      return text.substring(0, lastSentenceEnd + 1);
    }
    
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  };

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group border border-border hover:border-primary/50 relative">
      {/* Popular/Featured Badge */}
      {item.popularity_score && item.popularity_score > 75 && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Popular
          </Badge>
        </div>
      )}

      <Link to={`/knowledge/${item.slug}`} className="block h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-3">
            {/* Title and CTA Row */}
            <div className="flex-1 pr-2">
              <CardTitle className="text-lg font-semibold leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {item.name}
              </CardTitle>
            </div>
            
            {/* Prominent CTA */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary hover:text-primary-foreground hover:bg-primary shrink-0 font-medium text-xs"
            >
              View Details
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          {/* Category, Domain, and Difficulty Row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {/* Technique Icon */}
            <div 
              className="p-1.5 rounded-md flex-shrink-0"
              style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
            >
              <TechniqueIcon className="h-4 w-4" />
            </div>
            
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
        </CardHeader>
        
        <CardContent className="pt-0 pb-4">
          {/* Summary with Smart Truncation */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
            {smartTruncate(item.generic_summary || item.purpose || item.description || '', 120)}
          </p>
          
          {/* Planning Layers - Compact */}
          {item.planning_layers && item.planning_layers.length > 0 && (
            <div className="mb-3">
              <PlanningLayerBadges 
                layers={item.planning_layers || []} 
                maxVisible={2} 
              />
            </div>
          )}
          
          {/* Key Metadata - Enhanced Icons */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 text-xs">
              {/* Participants as Badges */}
              {item.typical_participants && item.typical_participants.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  <div className="flex flex-wrap gap-1">
                    {item.typical_participants.slice(0, 2).map((participant, index) => (
                      <Badge key={index} variant="outline" className="text-xs px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
                        {participant.length > 12 ? participant.substring(0, 12) + '...' : participant}
                      </Badge>
                    ))}
                    {item.typical_participants.length > 2 && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">
                        +{item.typical_participants.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {/* Duration - Standardized */}
              {item.duration_min_minutes && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-orange-500" />
                  <span className="font-medium">
                    {formatDuration(item.duration_min_minutes, item.duration_max_minutes)}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer: Clear Stats and Quick Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1" title="Comments">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>0</span>
              </div>
              <div className="flex items-center gap-1" title="Popularity Score">
                <Star className="h-3.5 w-3.5" />
                <span>{Math.round(item.popularity_score || 0)}</span>
              </div>
              {item.estimated_reading_time && (
                <div className="flex items-center gap-1" title="Reading Time">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{item.estimated_reading_time} min read</span>
                </div>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <BookmarkButton 
                techniqueId={item.id} 
                variant="ghost" 
                size="sm" 
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-primary/10"
                onClick={handleShare}
                title="Share technique"
              >
                <Share2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};