import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Users, Target } from "lucide-react";
import { DifficultyBadge } from "./DifficultyBadge";
import type { KnowledgeItem } from "@/hooks/useKnowledgeItems";

interface EnhancedRelatedTechniquesProps {
  techniqueId: string;
}

export const EnhancedRelatedTechniques = ({ techniqueId }: EnhancedRelatedTechniquesProps) => {
  const { data: relatedTechniques, isLoading } = useQuery({
    queryKey: ['related-techniques', techniqueId],
    queryFn: async (): Promise<KnowledgeItem[]> => {
      // Get the current technique's categories and tags
      const { data: currentTechnique } = await supabase
        .from('knowledge_items')
        .select(`
          knowledge_categories(id),
          knowledge_tags(id)
        `)
        .eq('id', techniqueId)
        .single();

      if (!currentTechnique) return [];

      // Find related techniques with similar categories or tags
      let query = supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories(id, name, color),
          knowledge_tags(id, name)
        `)
        .neq('id', techniqueId)
        .limit(6);

      // Prioritize techniques from the same category
      if (currentTechnique?.knowledge_categories?.[0]?.id) {
        query = query.eq('category_id', currentTechnique.knowledge_categories[0].id);
      }

      const { data } = await query;
      return data || [];
    },
  });

  if (isLoading || !relatedTechniques || relatedTechniques.length === 0) {
    return null;
  }

  const RelatedTechniqueCard = ({ technique }: { technique: KnowledgeItem }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/30 hover:bg-primary/5">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2">
                {technique.name}
              </h4>
              {technique.purpose && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {technique.purpose}
                </p>
              )}
            </div>
            {technique.knowledge_categories && (
              <Badge 
                variant="outline" 
                className="ml-2 text-xs shrink-0"
                style={{ 
                  borderColor: `${technique.knowledge_categories.color}40`,
                  color: technique.knowledge_categories.color 
                }}
              >
                {technique.knowledge_categories.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {/* Removed difficulty badge since it's not in the simplified schema */}
              
              {technique.estimated_reading_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{technique.estimated_reading_time}m</span>
                </div>
              )}
              
              {(technique.team_size_min || technique.team_size_max) && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>
                    {technique.team_size_min === technique.team_size_max 
                      ? `${technique.team_size_min}p`
                      : `${technique.team_size_min || 1}-${technique.team_size_max || "∞"}p`
                    }
                  </span>
                </div>
              )}
            </div>
            
            <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Link to={`/knowledge/${technique.slug}`}>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          {technique.knowledge_tags && technique.knowledge_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2 border-t border-border/50">
              {technique.knowledge_tags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs px-2 py-0.5">
                  {tag.name}
                </Badge>
              ))}
              {technique.knowledge_tags.length > 3 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  +{technique.knowledge_tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-secondary/10 to-accent/10">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Related Techniques
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Explore similar techniques that complement this approach
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {relatedTechniques.map((technique) => (
            <RelatedTechniqueCard key={technique.id} technique={technique} />
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-border/50 text-center">
          <Button variant="outline" asChild>
            <Link to="/knowledge">
              <Target className="h-4 w-4 mr-2" />
              Explore All Techniques
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};