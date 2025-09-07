import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, Target, Lightbulb, Star } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { KnowledgeItem } from "@/hooks/useKnowledgeItems";

interface KnowledgeCardProps {
  item: KnowledgeItem;
}

export const KnowledgeCard = ({ item }: KnowledgeCardProps) => {
  const categoryColor = item.knowledge_categories?.color || '#3B82F6';
  const domainColor = item.activity_domains?.color || '#10B981';
  const focusColor = item.planning_focuses?.color || '#F59E0B';

  return (
    <Card className="group border-border hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
      {/* Category-branded header accent */}
      <div 
        className="h-1 w-full"
        style={{ backgroundColor: categoryColor }}
      />
      
      <CardHeader className="flex-none">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap gap-2">
            {item.knowledge_categories && (
              <Badge 
                variant="secondary"
                style={{ 
                  backgroundColor: `${categoryColor}15`,
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
                style={{
                  borderColor: domainColor,
                  color: domainColor
                }}
              >
                {item.activity_domains.name}
              </Badge>
            )}
            {item.is_featured && (
              <Badge variant="secondary" className="bg-primary/10 text-primary flex items-center gap-1">
                <Star size={12} fill="currentColor" />
                Featured
              </Badge>
            )}
          </div>
        </div>
        
        <CardTitle className="text-xl group-hover:text-primary transition-colors leading-tight">
          {item.name}
        </CardTitle>
        
        {item.description && (
          <CardDescription className="line-clamp-3 leading-relaxed">
            {item.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 space-y-3 mb-6">
          {/* Planning Focus */}
          {item.planning_focuses && (
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{
                  borderColor: focusColor,
                  color: focusColor
                }}
              >
                {item.planning_focuses.name}
              </Badge>
            </div>
          )}

          {/* Enhanced Features Preview */}
          <div className="space-y-2">
            {item.learning_value_summary && (
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.learning_value_summary}
                </p>
              </div>
            )}

            {/* Use Cases Count */}
            {item.knowledge_use_cases && item.knowledge_use_cases.length > 0 && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {item.knowledge_use_cases.length} use case{item.knowledge_use_cases.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Common Pitfalls Count */}
            {item.common_pitfalls && item.common_pitfalls.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {item.common_pitfalls.length} common pitfall{item.common_pitfalls.length !== 1 ? 's' : ''} noted
              </div>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {item.view_count > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{item.view_count}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(item.updated_at), 'MMM yyyy')}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        <div className="flex-none">
          <Link to={`/knowledge/${item.slug}`} className="block">
            <Button 
              variant="outline" 
              className="w-full hover:shadow-md transition-shadow"
              style={{
                borderColor: `${categoryColor}30`,
                color: categoryColor
              }}
            >
              Learn More
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};