import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTechniqueRelations } from '@/hooks/useTechniqueRelations';

interface RelatedTechniquesProps {
  techniqueId: string;
}

const getRelationTypeLabel = (type: string) => {
  switch (type) {
    case 'prerequisite':
      return 'Prerequisite';
    case 'follow_up':
      return 'Follow-up';
    case 'see_also':
      return 'See also';
    default:
      return 'Related';
  }
};

const getDifficultyColor = (difficulty: string | null) => {
  switch (difficulty) {
    case 'Beginner':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Intermediate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Advanced':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const RelatedTechniques = ({ techniqueId }: RelatedTechniquesProps) => {
  const { data: relatedTechniques, isLoading } = useTechniqueRelations(techniqueId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Related Techniques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!relatedTechniques || relatedTechniques.length === 0) {
    return null;
  }

  // Group techniques by relation type
  const groupedTechniques = relatedTechniques.reduce((acc, technique) => {
    const type = technique.relation_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(technique);
    return acc;
  }, {} as Record<string, typeof relatedTechniques>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Related Techniques
        </CardTitle>
        <CardDescription>
          Discover more techniques to enhance your delivery approach
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedTechniques).map(([relationType, techniques]) => (
          <div key={relationType} className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              {getRelationTypeLabel(relationType)}
            </h4>
            <div className="space-y-3">
              {techniques.map((technique) => (
                <Link
                  key={technique.id}
                  to={`/knowledge-base/${technique.slug}`}
                  className="block group"
                >
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium truncate group-hover:text-primary transition-colors">
                          {technique.name}
                        </h5>
                        {technique.difficulty_level && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getDifficultyColor(technique.difficulty_level)}`}
                          >
                            {technique.difficulty_level}
                          </Badge>
                        )}
                      </div>
                      {technique.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {technique.summary}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};