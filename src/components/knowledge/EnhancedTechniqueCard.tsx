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
import { ContentTypeBadge } from "@/components/knowledge/ContentTypeBadge";
import { Link } from "react-router-dom";
import type { KnowledgeItem } from "@/hooks/useKnowledgeItems";

interface EnhancedTechniqueCardProps {
  item: KnowledgeItem;
}

export const EnhancedTechniqueCard = ({ item }: EnhancedTechniqueCardProps) => {
  const TechniqueIcon = getTechniqueIcon(item.name, item.activity_categories?.name);
  const categoryColor = getCategoryColor(item.activity_categories?.name);

  // Determine content type for future expansion
  const getContentType = () => {
    // For now, everything is a "Technique", but this prepares for expansion
    return "Technique";
  };

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

  // Smart truncation that completes sentences - more compact
  const smartTruncate = (text: string, maxLength: number = 80) => {
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
        <CardHeader className="pb-2">
          {/* Top Tier: Title, Type Badge, and CTA */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 pr-2 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <ContentTypeBadge type={getContentType()} />
              </div>
              <CardTitle className="text-lg font-semibold leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {item.name}
              </CardTitle>
            </div>
            
            {/* Prominent CTA */}
            <Button 
              variant="default" 
              size="sm" 
              className="shrink-0 font-medium text-xs h-8 px-3"
            >
              View Item
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          {/* One-line description */}
          <p className="text-sm text-muted-foreground line-clamp-1 mb-3 leading-relaxed">
            {smartTruncate(item.generic_summary || item.purpose || item.description || '', 80)}
          </p>

          {/* Category, Domain, and Difficulty Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Technique Icon */}
            <div 
              className="p-1.5 rounded-md flex-shrink-0"
              style={{ backgroundColor: `hsl(var(--primary) / 0.1)`, color: `hsl(var(--primary))` }}
            >
              <TechniqueIcon className="h-3.5 w-3.5" />
            </div>
            
            {item.activity_categories && (
              <Badge 
                variant="default" 
                className="text-xs font-medium border-0 px-2 py-0.5"
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
                className="text-xs font-medium px-2 py-0.5"
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
        
        <CardContent className="pt-0 pb-3">
          {/* Planning Layers - More Compact */}
          {item.planning_layers && item.planning_layers.length > 0 && (
            <div className="mb-3">
              <PlanningLayerBadges 
                layers={item.planning_layers || []} 
                maxVisible={2} 
              />
            </div>
          )}
          
          {/* Key Metadata - Compact Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 text-xs">
              {/* Participants - Simplified */}
              {item.typical_participants && item.typical_participants.length > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-primary" />
                  <span className="text-muted-foreground font-medium">
                    {item.typical_participants.length} roles
                  </span>
                </div>
              )}
              
              {/* Duration - Standardized */}
              {item.duration_min_minutes && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3 text-primary" />
                  <span className="font-medium">
                    {formatDuration(item.duration_min_minutes, item.duration_max_minutes)}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer: Clear Stats and Quick Actions - Compact */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1" title="Comments">
                <MessageCircle className="h-3 w-3" />
                <span>0</span>
              </div>
              <div className="flex items-center gap-1" title="Popularity Score">
                <Star className="h-3 w-3" />
                <span>{Math.round(item.popularity_score || 0)}</span>
              </div>
              {item.estimated_reading_time && (
                <div className="flex items-center gap-1" title="Reading Time">
                  <Clock className="h-3 w-3" />
                  <span>{item.estimated_reading_time}min</span>
                </div>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <BookmarkButton 
                techniqueId={item.id} 
                variant="ghost" 
                size="sm" 
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-primary/10"
                onClick={handleShare}
                title="Share item"
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