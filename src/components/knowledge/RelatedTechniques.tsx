import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { DifficultyBadge } from "./DifficultyBadge";

interface RelatedTechniquesProps {
  techniqueId: string;
  categoryId?: string;
}

export const RelatedTechniques = ({ techniqueId, categoryId }: RelatedTechniquesProps) => {
  const { data: relatedTechniques = [] } = useQuery({
    queryKey: ['related-techniques', techniqueId],
    queryFn: async () => {
      // First, try to get explicitly related techniques
      const { data: explicitRelations } = await supabase
        .from('technique_relations')
        .select(`
          related_technique_id,
          relation_type,
          strength,
          knowledge_techniques!technique_relations_related_technique_id_fkey(
            id,
            name,
            slug,
            summary,
            difficulty_level,
            estimated_reading_time
          )
        `)
        .eq('source_technique_id', techniqueId)
        .order('strength', { ascending: false })
        .limit(3);

      let techniques: any[] = explicitRelations?.map(rel => rel.knowledge_techniques).filter(Boolean) || [];

      // If we don't have enough explicit relations, find techniques in the same category
      if (techniques.length < 3 && categoryId) {
        const { data: categoryTechniques } = await supabase
          .from('knowledge_techniques')
          .select('id, name, slug, summary, difficulty_level, estimated_reading_time')
          .eq('category_id', categoryId)
          .eq('is_published', true)
          .neq('id', techniqueId)
          .order('popularity_score', { ascending: false })
          .limit(6 - techniques.length);

        if (categoryTechniques) {
          techniques = [...techniques, ...categoryTechniques];
        }
      }

      return techniques.slice(0, 3);
    },
  });

  if (relatedTechniques.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Related Techniques
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {relatedTechniques.map((technique) => (
          <div
            key={technique.id}
            className="group border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {technique.name}
                </h4>
                {technique.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {technique.summary}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {technique.difficulty_level && (
                    <DifficultyBadge level={technique.difficulty_level} />
                  )}
                  {technique.estimated_reading_time && (
                    <Badge variant="outline" className="text-xs">
                      {technique.estimated_reading_time} min read
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Link to={`/knowledge/${technique.slug}`}>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};