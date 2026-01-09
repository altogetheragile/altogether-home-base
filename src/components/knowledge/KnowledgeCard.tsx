import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { KnowledgeItem } from "@/hooks/useKnowledgeItems";
import { Eye, Heart, MessageCircle, ChevronRight } from "lucide-react";
import { useKnowledgeItemLikes } from "@/hooks/useKnowledgeItemLikes";
import { useKnowledgeItemComments } from "@/hooks/useKnowledgeItemComments";
import { useAuth } from "@/contexts/AuthContext";
import { useVisibleClassifications } from "@/hooks/useClassificationConfig";
import { cn } from "@/lib/utils";

interface KnowledgeCardProps {
  item: KnowledgeItem;
}

export const KnowledgeCard = React.memo(({ item }: KnowledgeCardProps) => {
  const { user } = useAuth();
  const { likeCount, hasLiked, toggleLike, isLoading } = useKnowledgeItemLikes(item.id);
  const { commentCount } = useKnowledgeItemComments(item.id);
  const visibility = useVisibleClassifications();
  
  // Get primary category color for card background
  const primaryCategoryColor = item.categories?.[0]?.color || '#3B82F6';
  
  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike();
  };
  
  // Get first use case title or summary
  const useCase = item.knowledge_use_cases?.[0]?.title || item.knowledge_use_cases?.[0]?.summary || 'General application';
  
  // Get up to 3 tags from the new tags array
  const tags = (item.tags || []).slice(0, 3).map(tag => tag.name);
  
  // Author - only show if available
  const authorName = item.author;

  return (
    <Card 
      className="group border-border hover:shadow-lg transition-all duration-200 overflow-hidden h-full flex flex-col relative"
      style={{
        backgroundColor: `${primaryCategoryColor}08`,
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
          {/* Categories (multi) */}
          {visibility.categories && item.categories?.map((category) => (
            <Badge 
              key={category.id}
              variant="secondary"
              className="text-xs"
              style={{ 
                backgroundColor: `${category.color}20`,
                color: category.color,
                borderColor: `${category.color}30`
              }}
            >
              {category.name}
            </Badge>
          ))}
          {/* Activity Domains (multi) */}
          {visibility.activityDomains && item.domains?.map((domain) => (
            <Badge 
              key={domain.id}
              variant="outline"
              className="text-xs"
              style={{
                borderColor: domain.color,
                color: domain.color
              }}
            >
              {domain.name}
            </Badge>
          ))}
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
            {user && (
              <button
                onClick={handleLikeClick}
                disabled={isLoading}
                className={cn(
                  "relative z-10 flex items-center gap-1 hover:text-red-500 transition-colors disabled:opacity-50",
                  hasLiked && "text-red-500"
                )}
              >
                <Heart className={cn("h-3 w-3", hasLiked && "fill-current")} />
                {likeCount}
              </button>
            )}
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {commentCount}
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
}, (prevProps, nextProps) => {
  // Only re-render if item ID or view count changes
  return prevProps.item.id === nextProps.item.id && 
         prevProps.item.view_count === nextProps.item.view_count;
});
