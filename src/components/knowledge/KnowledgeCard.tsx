import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <Card className="group border-border hover:shadow-lg transition-all duration-200 overflow-hidden h-full flex flex-col">
      {/* Category-branded header accent */}
      <div 
        className="h-1 w-full"
        style={{ backgroundColor: categoryColor }}
      />
      
      <CardHeader className="flex-none pb-3 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {item.knowledge_categories && (
            <Badge 
              variant="secondary"
              className="text-xs"
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
        
        <CardTitle className="text-lg group-hover:text-primary transition-colors leading-snug line-clamp-2">
          {item.name}
        </CardTitle>
        
        {item.description && (
          <CardDescription className="line-clamp-2 text-sm leading-relaxed">
            {item.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col pt-0 pb-3">
        <div className="flex-1 mb-3">
          {item.planning_focuses && (
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
          )}
        </div>
        
        {/* Action Button */}
        <div className="flex-none">
          <Link to={`/knowledge/${item.slug}`} className="block">
            <Button 
              variant="outline" 
              size="sm"
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