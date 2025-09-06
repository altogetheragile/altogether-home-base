import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDeleteKnowledgeItem, useUpdateKnowledgeItem } from '@/hooks/useKnowledgeItems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type SortColumn = 'name' | 'views' | 'updated_at' | 'category' | 'domain' | 'planning_layer';
type SortDirection = 'asc' | 'desc';

const AdminKnowledgeItems = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [planningLayerFilter, setPlanningLayerFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch categories for filter dropdown
  const { data: categories } = useQuery({
    queryKey: ['knowledge-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch domains for filter dropdown
  const { data: domains } = useQuery({
    queryKey: ['activity-domains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_domains')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch planning layers for filter dropdown
  const { data: planningLayers } = useQuery({
    queryKey: ['planning-layers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planning_layers')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['admin-knowledge-items', searchTerm, statusFilter, categoryFilter, domainFilter, planningLayerFilter, sortColumn, sortDirection],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_items')
          .select(`
            *,
            knowledge_categories (id, name, slug, color),
            planning_layers (id, name, slug, color),
            activity_domains (id, name, slug, color),
            knowledge_use_cases (id, case_type)
          `);

      // Apply search filter
      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm.trim()}%,description.ilike.%${searchTerm.trim()}%`);
      }

      // Apply status filter
      if (statusFilter === 'published') {
        query = query.eq('is_published', true);
      } else if (statusFilter === 'draft') {
        query = query.eq('is_published', false);
      }

      // Apply category filter
      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }

      // Apply domain filter
      if (domainFilter !== 'all') {
        query = query.eq('domain_id', domainFilter);
      }

      // Apply planning layer filter
      if (planningLayerFilter !== 'all') {
        query = query.eq('planning_focus_id', planningLayerFilter);
      }

      // Apply sorting
      const ascending = sortDirection === 'asc';
      if (sortColumn === 'name') {
        query = query.order('name', { ascending });
      } else if (sortColumn === 'views') {
        query = query.order('view_count', { ascending });
      } else if (sortColumn === 'category') {
        query = query.order('knowledge_categories(name)', { ascending });
      } else if (sortColumn === 'domain') {
        query = query.order('activity_domains(name)', { ascending });
      } else if (sortColumn === 'planning_layer') {
        query = query.order('planning_layers(name)', { ascending });
      } else {
        query = query.order('updated_at', { ascending });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useDeleteKnowledgeItem();
  const updateMutation = useUpdateKnowledgeItem();

  const handleCreate = () => {
    navigate('/admin/knowledge/items/new');
  };

  const handleEdit = (item: any) => {
    navigate(`/admin/knowledge/items/${item.id}/edit`);
  };

  const handleDelete = (item: any) => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const togglePublished = (item: any) => {
    updateMutation.mutate({
      id: item.id,
      is_published: !item.is_published
    });
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Knowledge Items</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-4 flex-wrap">
          <div className="w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-48">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {domains?.map((domain) => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <Select value={planningLayerFilter} onValueChange={setPlanningLayerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by planning layer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Planning Layers</SelectItem>
                {planningLayers?.map((layer) => (
                  <SelectItem key={layer.id} value={layer.id}>
                    {layer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Title
                  {getSortIcon('name')}
                </div>
              </TableHead>
              <TableHead 
                className="w-32 cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-2">
                  Category
                  {getSortIcon('category')}
                </div>
              </TableHead>
              <TableHead 
                className="w-40 cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('domain')}
              >
                <div className="flex items-center gap-2">
                  Domains of Interest
                  {getSortIcon('domain')}
                </div>
              </TableHead>
              <TableHead 
                className="w-40 cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('planning_layer')}
              >
                <div className="flex items-center gap-2">
                  Planning Layers
                  {getSortIcon('planning_layer')}
                </div>
              </TableHead>
              <TableHead className="w-32">Completeness</TableHead>
              <TableHead className="w-24">Use Cases</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead 
                className="w-20 cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('views')}
              >
                <div className="flex items-center gap-2">
                  Views
                  {getSortIcon('views')}
                </div>
              </TableHead>
              <TableHead 
                className="w-28 cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('updated_at')}
              >
                <div className="flex items-center gap-2">
                  Updated
                  {getSortIcon('updated_at')}
                </div>
              </TableHead>
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
           <TableBody>
             {items?.map((item) => (
               <TableRow key={item.id}>
                 <TableCell>
                   <button 
                     onClick={() => handleEdit(item)}
                     className="font-medium text-left hover:text-primary underline-offset-4 hover:underline cursor-pointer"
                   >
                     {item.name}
                   </button>
                 </TableCell>
                 <TableCell>
                   {item.knowledge_categories && (
                     <span 
                       className="text-sm font-medium"
                       style={{ 
                         color: item.knowledge_categories.color 
                       }}
                     >
                       {item.knowledge_categories.name}
                     </span>
                   )}
                 </TableCell>
                 <TableCell>
                   {item.activity_domains && (
                     <span 
                       className="text-sm font-medium"
                       style={{ 
                         color: item.activity_domains.color 
                       }}
                     >
                       {item.activity_domains.name}
                     </span>
                   )}
                 </TableCell>
                 <TableCell>
                   {item.planning_layers && (
                     <span 
                       className="text-sm font-medium"
                       style={{ 
                         color: item.planning_layers.color 
                       }}
                     >
                       {item.planning_layers.name}
                     </span>
                   )}
                 </TableCell>
                  <TableCell>
                    {/* Completeness Badge */}
                    {(() => {
                      const fields = [
                        item.description,
                        item.background,
                        item.learning_value_summary,
                        item.common_pitfalls?.length > 0,
                        item.evidence_sources?.length > 0,
                        item.related_techniques?.length > 0,
                        Object.keys(item.key_terminology || {}).length > 0,
                        item.author
                      ];
                      const completedFields = fields.filter(Boolean).length;
                      const totalFields = fields.length;
                      const percentage = Math.round((completedFields / totalFields) * 100);
                      
                      let variant: "default" | "secondary" | "outline" = "secondary";
                      if (percentage >= 80) variant = "default";
                      else if (percentage >= 50) variant = "outline";
                      
                      return (
                        <Badge variant={variant} className="text-xs">
                          {percentage}%
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {item.knowledge_use_cases && item.knowledge_use_cases.length > 0 ? (
                        <>
                          <Badge variant="outline" className="text-xs">
                            {item.knowledge_use_cases.length}
                          </Badge>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                   <div className="flex items-center gap-2">
                     <Badge variant={item.is_published ? "default" : "secondary"}>
                       {item.is_published ? "Published" : "Draft"}
                     </Badge>
                     {item.is_featured && (
                       <Badge variant="outline" className="text-xs">Featured</Badge>
                     )}
                   </div>
                 </TableCell>
                 <TableCell className="text-muted-foreground text-sm">
                   {item.view_count || 0}
                 </TableCell>
                 <TableCell className="text-muted-foreground text-sm">
                   {format(new Date(item.updated_at), 'MMM d')}
                 </TableCell>
                 <TableCell>
                   <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="h-8 w-8 p-0"
                         aria-label="Open actions menu"
                       >
                         <MoreVertical className="h-4 w-4" />
                       </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                       <DropdownMenuItem onClick={() => togglePublished(item)}>
                         <div className="flex items-center gap-2">
                           {item.is_published ? (
                             <>
                               <EyeOff className="h-4 w-4" />
                               Unpublish
                             </>
                           ) : (
                             <>
                               <Eye className="h-4 w-4" />
                               Publish
                             </>
                           )}
                         </div>
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => handleEdit(item)}>
                         <div className="flex items-center gap-2">
                           <Edit className="h-4 w-4" />
                           Edit
                         </div>
                       </DropdownMenuItem>
                       <DropdownMenuItem 
                         onClick={() => handleDelete(item)}
                         className="text-destructive focus:text-destructive"
                       >
                         <div className="flex items-center gap-2">
                           <Trash2 className="h-4 w-4" />
                           Delete
                         </div>
                       </DropdownMenuItem>
                     </DropdownMenuContent>
                   </DropdownMenu>
                 </TableCell>
               </TableRow>
             ))}
             {items?.length === 0 && (
               <TableRow>
                 <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                   {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || domainFilter !== 'all' || planningLayerFilter !== 'all'
                     ? 'No items found matching your filters.' 
                     : 'No knowledge items created yet.'
                   }
                 </TableCell>
               </TableRow>
             )}
           </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminKnowledgeItems;