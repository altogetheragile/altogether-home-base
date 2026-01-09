import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface ItemMetaCardProps {
  updatedAt?: string;
  source?: string;
  viewCount?: number;
  versionNotes?: string;
}

export const ItemMetaCard: React.FC<ItemMetaCardProps> = ({
  updatedAt,
  source,
  viewCount,
  versionNotes,
}) => {
  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Last Updated */}
        {updatedAt && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Last updated:</span>
            <span className="font-medium">
              {format(new Date(updatedAt), 'MMM d, yyyy')}
            </span>
          </div>
        )}

        {/* View Count */}
        {viewCount !== undefined && viewCount > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Views:</span>
            <span className="font-medium">{viewCount.toLocaleString()}</span>
          </div>
        )}

        {/* Source */}
        {source && (
          <div className="flex items-start gap-2 text-sm">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-muted-foreground">Source: </span>
              <span className="font-medium">{source}</span>
            </div>
          </div>
        )}

        {/* Version Notes */}
        {versionNotes && (
          <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
            {versionNotes}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
