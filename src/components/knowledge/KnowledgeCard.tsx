import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { KnowledgeItem } from "@/hooks/useKnowledgeItems";
import { Eye, Heart, MessageCircle, ChevronRight } from "lucide-react";

interface KnowledgeCardProps {
  item: KnowledgeItem;
}

export const KnowledgeCard = ({ item }: KnowledgeCardProps) => {
  console.log("📦 Rendering KnowledgeCard:", { id: item.id, name: item.name, slug: item.slug });
  
  const categoryColor = item.knowledge_categories?.color || '#3B82F6';
  const domainColor = item.activity_domains?.color || '#10B981';
  
  // Get first use case title or summary
  const useCase = item.knowledge_use_cases?.[0]?.title || item.knowledge_use_cases?.[0]?.summary || 'General application';
  
  
  // Get up to 3 tags
  const tags = item.knowledge_item_tags?.slice(0, 3).map(tag => tag.knowledge_tags.name) || [];
  
  // Author - only show if available
  const authorName = item.author;

  return (
    <Card 
      className="group border-border hover:shadow-lg transition-all duration-200 overflow-hidden h-full flex flex-col relative"
      style={{
        backgroundColor: `${categoryColor}08`,
      }}
    >
      <CardHeader className="flex-none pb-2 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors leading-snug line-clamp-2 flex-1">
            {item.name}
          </CardTitle>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {item.knowledge_categories && (
            <Badge 
              variant="secondary"
              className="text-xs"
              style={{ 
                backgroundColor: `${categoryColor}20`,
                color: categoryColor,
                borderColor: `${categoryColor}30`
              }}
            >
              {item.knowledge_categories.name}
            </Badge>
          )}
          {item.activity_domains && (
            <Badge 
              variant="outline"
              className="text-xs"
              style={{
                borderColor: domainColor,
                color: domainColor
              }}
            >
              {item.activity_domains.name}
            </Badge>
          )}
        </div>
        
        {item.description && (
          <CardDescription className="line-clamp-2 text-xs leading-relaxed">
            {item.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col pt-0 pb-3 px-6 space-y-3 relative">
        {/* Use Case */}
        <div className="space-y-1 text-xs">
          <div className="flex items-start gap-1">
            <span className="font-semibold text-muted-foreground">Use Case:</span>
            <span className="text-foreground line-clamp-1">{useCase}</span>
          </div>
        </div>

        {/* Hashtag Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, index) => (
              <span key={index} className="text-xs text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Engagement Footer */}
        <div className="flex items-center justify-between pt-2 border-t mt-auto text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {item.view_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              0
            </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            0
          </span>
        </div>
        {authorName && <span className="text-xs truncate">{authorName}</span>}
      </div>
        
        {/* Hidden Link - entire card is clickable */}
        <Link 
          to={`/knowledge/${item.slug}`} 
          className="absolute inset-0" 
          aria-label={`View ${item.name}`}
        />
      </CardContent>
    </Card>
  );
};
