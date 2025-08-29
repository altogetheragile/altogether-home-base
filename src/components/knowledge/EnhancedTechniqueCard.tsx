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
import { RoleBadges } from "@/components/knowledge/RoleBadges";
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

  // Standardized duration formatting
  const formatDuration = (minMinutes?: number, maxMinutes?: number) => {
    if (!minMinutes) return null;
    
    // < 15 min → "~15 min"
    if (minMinutes < 15) {
      return "~15 min";
    }
    
    // 15-60 min → "~30 min" or "~45 min"
    if (minMinutes < 60) {
      if (maxMinutes && maxMinutes > 60) {
        return "1-2 hrs";
      }
      if (minMinutes <= 30) {
        return "~30 min";
      }
      return "~45 min";
    }
    
    // 1-3 hours → "1-2 hrs"
    const minHours = Math.floor(minMinutes / 60);
    const maxHours = maxMinutes ? Math.floor(maxMinutes / 60) : minHours;
    
    if (minHours >= 6) {
      return "Full-day";
    }
    if (minHours >= 3) {
      return "Half-day";
    }
    if (maxHours && maxHours !== minHours) {
      return `${minHours}-${maxHours} hrs`;
    }
    return `~${minHours} hr${minHours === 1 ? '' : 's'}`;
  };

  // Clean text truncation - no mid-sentence cuts
  const smartTruncate = (text: string, maxLength: number = 120) => {
    if (!text || text.length <= maxLength) return text;
    
    // Find the last complete sentence within limit
    const truncated = text.substring(0, maxLength);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'), 
      truncated.lastIndexOf('!'), 
      truncated.lastIndexOf('?')
    );
    
    // If we have a complete sentence that uses at least 70% of our space, use it
    if (lastSentenceEnd > maxLength * 0.7) {
      return text.substring(0, lastSentenceEnd + 1);
    }
    
    // Otherwise, cut at the last word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.5) {
      return truncated.substring(0, lastSpace);
    }
    
    // Fallback to hard cut if needed
    return truncated;
  };

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group border border-border hover:border-primary/50 relative bg-card">
      {/* Popular/Featured Badge */}
      {item.popularity_score && item.popularity_score > 75 && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs font-medium">
            <Sparkles className="h-3 w-3 mr-1" />
            Popular
          </Badge>
        </div>
      )}

      <Link to={`/knowledge/${item.slug}`} className="block h-full">
        <CardHeader className="pb-3">
          {/* Tier 1: Category + Type Badge First for Instant Recognition */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ContentTypeBadge type={getContentType()} />
              {item.activity_categories && (
                <Badge 
                  variant="default" 
                  className="text-xs font-semibold border-0 px-2.5 py-1"
                  style={{ 
                    backgroundColor: item.activity_categories.color,
                    color: "white"
                  }}
                >
                  {item.activity_categories.name}
                </Badge>
              )}
            </div>
            
            {/* Prominent CTA */}
            <Button 
              variant="default" 
              size="sm" 
              className="shrink-0 font-semibold text-xs h-8 px-4 shadow-sm"
            >
              View Item
              <ArrowRight className="h-3 w-3 ml-1.5" />
            </Button>
          </div>

          {/* Title + Quick Visual Anchor */}
          <div className="flex items-start gap-3 mb-3">
            <div 
              className="p-2 rounded-lg flex-shrink-0 shadow-sm"
              style={{ backgroundColor: `hsl(var(--primary) / 0.1)`, color: `hsl(var(--primary))` }}
            >
              <TechniqueIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                {item.name}
              </CardTitle>
              {/* Clean description - max 2 lines */}
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {smartTruncate(item.generic_summary || item.purpose || item.description || '', 120)}
              </p>
            </div>
          </div>

          {/* Domain and Difficulty Row */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {item.activity_domains && (
              <Badge 
                variant="outline" 
                className="text-xs font-medium px-2 py-0.5 border-2"
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
          {/* Planning Layers - Compact */}
          {item.planning_layers && item.planning_layers.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-muted-foreground font-medium mb-1.5">Where it fits</div>
              <PlanningLayerBadges 
                layers={item.planning_layers || []} 
                maxVisible={2} 
              />
            </div>
          )}
          
          {/* Tier 2: Essential Metadata */}
          <div className="space-y-3 mb-4">
            {/* Role Badges - Visual */}
            {item.typical_participants && item.typical_participants.length > 0 && (
              <RoleBadges 
                roles={item.typical_participants} 
                maxVisible={3} 
              />
            )}
            
            {/* Duration - Prominent */}
            {item.duration_min_minutes && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {formatDuration(item.duration_min_minutes, item.duration_max_minutes)}
                </span>
              </div>
            )}
          </div>
          
          {/* Footer: Enhanced Stats and Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border/30">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5" title="Comments">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="font-medium text-muted-foreground">0</span>
              </div>
              <div className="flex items-center gap-1.5" title="Popularity Score">
                <Star className="h-4 w-4 text-primary" />
                <span className="font-medium text-muted-foreground">{Math.round(item.popularity_score || 0)}</span>
              </div>
              {item.estimated_reading_time && (
                <div className="flex items-center gap-1.5" title="Reading Time">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="font-medium text-muted-foreground">{item.estimated_reading_time}min read</span>
                </div>
              )}
            </div>
            
            {/* Always Visible Quick Actions */}
            <div className="flex items-center gap-2">
              <BookmarkButton 
                techniqueId={item.id} 
                variant="ghost" 
                size="sm"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10"
                onClick={handleShare}
                title="Share item"
              >
                <Share2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};