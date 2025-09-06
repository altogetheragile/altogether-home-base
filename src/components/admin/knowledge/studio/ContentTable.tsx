import { useQuery } from '@tanstack/react-query';
import { 
  Eye, EyeOff, Edit, MoreHorizontal, FileText, Target, 
  Clock, TrendingUp, Star, Copy, Archive, Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ContentFilters } from '../ContentStudioDashboard';
import { formatDistanceToNow } from 'date-fns';

interface ContentTableProps {
  filters: ContentFilters;
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  onEdit: (item: any) => void;
}

export const ContentTable = ({
  filters,
  selectedItems,
  onSelectionChange,
  onEdit
}: ContentTableProps) => {
  const { data: items, isLoading } = useQuery({
    queryKey: ['content-studio-table', filters],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories (id, name, slug, color),
          planning_focuses (id, name, slug, color, display_order),
          activity_domains (id, name, slug, color),
          knowledge_use_cases (id, case_type)
        `);

      // Apply workflow filter
      switch (filters.workflow) {
        case 'drafts':
          query = query.eq('is_published', false);
          break;
        case 'published':
          query = query.eq('is_published', true);
          break;
        case 'high-performing':
          query = query.gte('view_count', 100);
          break;
        case 'needs-attention':
          query = query.or('view_count.lt.10,description.is.null');
          break;
      }

      // Apply search
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'alphabetical':
          query = query.order('name', { ascending: true });
          break;
        case 'planning_focus':
          query = query.order('planning_focuses(display_order)', { ascending: true })
                       .order('planning_focuses(name)', { ascending: true });
          break;
        case 'popularity':
        case 'views':
          query = query.order('view_count', { ascending: false });
          break;
        case 'engagement':
          query = query.order('view_count', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('updated_at', { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(items?.map(item => item.id) || []);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, itemId]);
    } else {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    }
  };

  const calculateContentHealth = (item: any) => {
    let score = 0;
    if (item.description) score += 25;
    if (item.knowledge_use_cases?.length > 0) score += 25;
    if (item.category_id) score += 20;
    if (item.planning_focus_id) score += 15;
    if (item.domain_id) score += 15;
    return score;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const allSelected = items?.length > 0 && selectedItems.length === items.length;

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="min-w-[350px]">Content</TableHead>
            <TableHead>Health</TableHead>
            <TableHead>Classification</TableHead>
            <TableHead>Use Cases</TableHead>
            <TableHead>Performance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items?.map((item) => {
            const healthScore = calculateContentHealth(item);
            const useCasesCount = item.knowledge_use_cases?.length || 0;
            const genericCount = item.knowledge_use_cases?.filter(uc => uc.case_type === 'generic').length || 0;
            const exampleCount = item.knowledge_use_cases?.filter(uc => uc.case_type === 'example').length || 0;

            return (
              <TableRow key={item.id} className="group hover:bg-muted/50">
                <TableCell>
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                    aria-label={`Select ${item.name}`}
                  />
                </TableCell>
                
                <TableCell>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 rounded-lg border-2 border-background shadow-sm">
                      <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold text-sm">
                        {item.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground truncate">
                          {item.name}
                        </h4>
                        {item.is_featured && (
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        /{item.slug}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <Progress value={healthScore} className="h-2 flex-1" />
                    <span className={`text-xs font-medium ${getHealthColor(healthScore)}`}>
                      {healthScore}%
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    {item.knowledge_categories && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                        style={{ 
                          backgroundColor: `${item.knowledge_categories.color}15`, 
                          color: item.knowledge_categories.color,
                          borderColor: `${item.knowledge_categories.color}30`
                        }}
                      >
                        {item.knowledge_categories.name}
                      </Badge>
                    )}
                    {item.planning_focuses && (
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ 
                          borderColor: item.planning_focuses.color, 
                          color: item.planning_focuses.color 
                        }}
                      >
                        {item.planning_focuses.name}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="font-medium">{genericCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Target className="h-3.5 w-3.5" />
                      <span className="font-medium">{exampleCount}</span>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="font-medium">{item.view_count || 0}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant={item.is_published ? 'default' : 'secondary'}>
                    {item.is_published ? (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Draft
                      </>
                    )}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
                  </div>
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onEdit(item)}>
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
                </TableCell>
              </TableRow>
            );
          })}
          
          {!items?.length && (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-12">
                <div className="text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">No content found</h3>
                  <p className="text-sm">Try adjusting your filters or create new content</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};