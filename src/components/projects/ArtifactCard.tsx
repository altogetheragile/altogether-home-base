import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  FileText, 
  Layout, 
  Trash2,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ProjectArtifact } from '@/hooks/useProjectArtifacts';

interface ArtifactCardProps {
  artifact: ProjectArtifact;
  onDelete: (id: string) => void;
}

const getArtifactIcon = (type: string) => {
  switch (type) {
    case 'bmc':
      return <Sparkles className="h-5 w-5 text-primary" />;
    case 'canvas':
      return <Layout className="h-5 w-5 text-blue-500" />;
    case 'user_story':
      return <FileText className="h-5 w-5 text-green-500" />;
    default:
      return <FileText className="h-5 w-5 text-muted-foreground" />;
  }
};

const getArtifactTypeName = (type: string) => {
  switch (type) {
    case 'bmc':
      return 'Business Model Canvas';
    case 'canvas':
      return 'Canvas';
    case 'user_story':
      return 'User Story';
    default:
      return type;
  }
};

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, onDelete }) => {
  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-lg bg-muted">
              {getArtifactIcon(artifact.artifact_type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base leading-tight truncate">
                  {artifact.name}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {getArtifactTypeName(artifact.artifact_type)}
                </Badge>
              </div>
              {artifact.description && (
                <CardDescription className="line-clamp-2 text-sm">
                  {artifact.description}
                </CardDescription>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => onDelete(artifact.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Created {formatDistanceToNow(new Date(artifact.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
