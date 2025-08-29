import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar, User, Tag, Clock, Eye, BookOpen, Target } from "lucide-react";
import { DifficultyBadge } from "./DifficultyBadge";
import { BookmarkButton } from "./BookmarkButton";
import { ReadingProgress } from "./ReadingProgress";
import type { KnowledgeItem } from "@/hooks/useKnowledgeItems";

interface EnhancedTechniqueHeaderProps {
  item: KnowledgeItem;
}

export const EnhancedTechniqueHeader = ({ item }: EnhancedTechniqueHeaderProps) => {
  return (
    <div className="space-y-6">
      {/* Header Card with Gradient Background */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-transparent" />
        <div className="relative p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                {item.knowledge_categories && (
                  <Badge 
                    className="px-3 py-1 text-sm font-medium border-2"
                    style={{ 
                      backgroundColor: `${item.knowledge_categories.color}15`, 
                      borderColor: `${item.knowledge_categories.color}40`,
                      color: item.knowledge_categories.color 
                    }}
                  >
                    {item.knowledge_categories.name}
                  </Badge>
                )}
                <DifficultyBadge difficulty={item.difficulty_level} />
              </div>
              
              <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
                {item.name}
              </h1>
              
              {(item.purpose || item.generic_summary) && (
                <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
                  {item.purpose || item.generic_summary}
                </p>
              )}

              {/* Focus Description - Rich Purpose Statement */}
              {item.focus_description && (
                <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-primary/10 rounded-md">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-primary">Focus & Application</h3>
                  </div>
                  <p className="text-foreground leading-relaxed text-lg">
                    {item.focus_description}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 ml-6">
              <BookmarkButton techniqueId={item.id} showLabel />
              <ReadingProgress techniqueId={item.id} />
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/50">
            {item.estimated_reading_time && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{item.estimated_reading_time} min read</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{new Date(item.created_at).toLocaleDateString()}</span>
            </div>
            
            {item.originator && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{item.originator}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tags */}
      {item.knowledge_tags && item.knowledge_tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.knowledge_tags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="text-xs hover:bg-primary/10 transition-colors">
              <Tag className="mr-1 h-3 w-3" />
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};