import { 
  Eye, EyeOff, Edit, MoreHorizontal, FileText, Target, 
  Clock, TrendingUp, Star, Users, MessageCircle, Calendar,
  Bookmark, Share, Copy, Archive, Trash2, BookOpen,
  AlertCircle, Link, Lightbulb, GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { KnowledgeItem } from '@/hooks/useKnowledgeItems';

interface EnhancedKnowledgeCardProps {
  item: KnowledgeItem;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
}

export const EnhancedKnowledgeCard = ({ 
  item, 
  isSelected, 
  onSelect, 
  onEdit 
}: EnhancedKnowledgeCardProps) => {
  const calculateCompleteness = () => {
    let score = 0;
    const maxScore = 11;
    
    if (item.description) score += 1;
    if (item.background) score += 1;
    if (item.learning_value_summary) score += 1;
    if (item.common_pitfalls?.length) score += 1;
    if (item.evidence_sources?.length) score += 1;
    if (item.related_techniques?.length) score += 1;
    if (item.key_terminology && Object.keys(item.key_terminology).length) score += 1;
    if (item.author) score += 1;
    if (item.knowledge_use_cases?.length) score += 1;
    if (item.category_id) score += 1;
    if (item.planning_layer_id) score += 1;
    
    return Math.round((score / maxScore) * 100);
  };

  const completeness = calculateCompleteness();
  const useCasesCount = item.knowledge_use_cases?.length || 0;
  const genericCount = item.knowledge_use_cases?.filter(uc => uc.case_type === 'generic').length || 0;
  const exampleCount = item.knowledge_use_cases?.filter(uc => uc.case_type === 'example').length || 0;

  const getCompletenessColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card 
      className={`group transition-all duration-200 hover:shadow-lg cursor-pointer border-2 h-full ${
        isSelected 
          ? 'border-primary shadow-lg ring-2 ring-primary/20' 
          : 'border-transparent hover:border-border'
      }`}
      onClick={onEdit}
    >
      {/* Header with controls */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="mt-1"
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Content
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title and Avatar */}
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 rounded-xl">
            <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold text-sm">
              {item.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <h4 className="font-semibold text-foreground text-base line-clamp-2 leading-snug">
                {item.name}
              </h4>
              {item.is_featured && (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0 mt-0.5" />
              )}
            </div>
            {item.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Enhanced Content Preview */}
        {item.learning_value_summary && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Learning Value</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 pl-6">
              {item.learning_value_summary}
            </p>
          </div>
        )}

        {/* Use Cases Preview */}
        {useCasesCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Use Cases</span>
            </div>
            <div className="flex gap-2 pl-6">
              {genericCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {genericCount} Generic
                </Badge>
              )}
              {exampleCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {exampleCount} Examples
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Structured Content Indicators */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Content Richness</span>
            <span className={`text-sm font-medium ${getCompletenessColor(completeness)}`}>
              {completeness}%
            </span>
          </div>
          <Progress value={completeness} className="h-2" />
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {item.common_pitfalls?.length && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                <span>Pitfalls</span>
              </div>
            )}
            {item.evidence_sources?.length && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <BookOpen className="h-3 w-3" />
                <span>Evidence</span>
              </div>
            )}
            {item.related_techniques?.length && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Link className="h-3 w-3" />
                <span>Related</span>
              </div>
            )}
            {item.key_terminology && Object.keys(item.key_terminology).length > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <GraduationCap className="h-3 w-3" />
                <span>Terminology</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Classification */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {item.knowledge_categories && (
              <Badge 
                variant="secondary" 
                className="text-xs px-2 py-1 font-medium"
                style={{ 
                  backgroundColor: `${item.knowledge_categories.color}15`, 
                  color: item.knowledge_categories.color,
                  borderColor: `${item.knowledge_categories.color}30`
                }}
              >
                {item.knowledge_categories.name}
              </Badge>
            )}
            {item.planning_layers && (
              <Badge 
                variant="outline" 
                className="text-xs px-2 py-1 font-medium"
                style={{ 
                  borderColor: item.planning_layers.color, 
                  color: item.planning_layers.color 
                }}
              >
                {item.planning_layers.name}
              </Badge>
            )}
            {item.activity_domains && (
              <Badge 
                variant="outline" 
                className="text-xs px-2 py-1 font-medium"
                style={{ 
                  borderColor: item.activity_domains.color, 
                  color: item.activity_domains.color 
                }}
              >
                {item.activity_domains.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Author & Source */}
        {(item.author || item.source) && (
          <div className="text-xs text-muted-foreground">
            {item.author && <span>By {item.author}</span>}
            {item.author && item.source && <span> • </span>}
            {item.source && <span>Source: {item.source}</span>}
            {item.publication_year && <span> ({item.publication_year})</span>}
          </div>
        )}

        {/* Footer Stats */}
        <div className="flex items-center justify-between text-xs pt-2 border-t">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
            </span>
            <span>•</span>
            <Eye className="h-3 w-3" />
            <span>{item.view_count} views</span>
          </div>
          
          <Badge 
            variant={item.is_published ? 'default' : 'secondary'} 
            className="text-xs font-medium"
          >
            {item.is_published ? (
              <>
                <Eye className="h-2.5 w-2.5 mr-1" />
                Published
              </>
            ) : (
              <>
                <EyeOff className="h-2.5 w-2.5 mr-1" />
                Draft
              </>
            )}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};