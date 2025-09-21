import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Target, Lightbulb, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { KnowledgeMetadata } from '@/types/content';

interface KnowledgeContentRendererProps {
  metadata: KnowledgeMetadata;
  updatedAt: string;
  viewCount?: number;
}

export const KnowledgeContentRenderer: React.FC<KnowledgeContentRendererProps> = ({ 
  metadata, 
  updatedAt, 
  viewCount 
}) => {
  const domainColor = metadata.activity_domains?.color || '#10B981';
  const focusColor = metadata.planning_focuses?.color || '#F59E0B';

  return (
    <div className="space-y-3">
      {/* Additional Badges */}
      <div className="flex flex-wrap gap-2">
        {metadata.activity_domains && (
          <Badge 
            variant="outline"
            style={{
              borderColor: domainColor,
              color: domainColor
            }}
          >
            {metadata.activity_domains.name}
          </Badge>
        )}
      </div>

      {/* Planning Focus */}
      {metadata.planning_focuses && (
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
            {metadata.planning_focuses.name}
          </Badge>
        </div>
      )}

      {/* Learning Value */}
      {metadata.learning_value_summary && (
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground line-clamp-2">
            {metadata.learning_value_summary}
          </p>
        </div>
      )}

      {/* Use Cases Count */}
      {metadata.knowledge_use_cases && metadata.knowledge_use_cases.length > 0 && (
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {metadata.knowledge_use_cases.length} use case{metadata.knowledge_use_cases.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Common Pitfalls Count */}
      {metadata.common_pitfalls && metadata.common_pitfalls.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {metadata.common_pitfalls.length} common pitfall{metadata.common_pitfalls.length !== 1 ? 's' : ''} noted
        </div>
      )}

      {/* Meta Info */}
      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {viewCount && viewCount > 0 && (
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{viewCount}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(updatedAt), 'MMM yyyy')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};