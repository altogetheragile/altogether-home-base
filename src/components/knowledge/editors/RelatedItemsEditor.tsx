import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Link2, Plus, Trash2, Loader2, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RelatedItemsEditorProps {
  knowledgeItemId: string | undefined;
}

interface Relationship {
  id: string;
  knowledge_item_id: string;
  related_item_id: string;
  relationship_type: string;
  position: number;
  related_item?: {
    id: string;
    name: string;
    slug: string;
  };
}

const RELATIONSHIP_TYPES = [
  { value: 'pairs_with', label: 'Pairs With' },
  { value: 'precedes', label: 'Precedes' },
  { value: 'follows', label: 'Follows' },
  { value: 'alternative_to', label: 'Alternative To' },
  { value: 'prerequisite', label: 'Prerequisite' },
  { value: 'advanced', label: 'Advanced Topic' },
];

export const RelatedItemsEditor: React.FC<RelatedItemsEditorProps> = ({ knowledgeItemId }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('pairs_with');
  
  // Fetch existing relationships
  const { data: relationships = [], isLoading: loadingRelationships } = useQuery({
    queryKey: ['knowledge-item-relationships', knowledgeItemId],
    queryFn: async () => {
      if (!knowledgeItemId) return [];
      
      const { data, error } = await supabase
        .from('knowledge_item_relationships')
        .select(`
          id, knowledge_item_id, related_item_id, relationship_type, position,
          knowledge_items!knowledge_item_relationships_related_item_id_fkey (id, name, slug)
        `)
        .eq('knowledge_item_id', knowledgeItemId)
        .order('position');
      
      if (error) throw error;
      
      return (data || []).map((r: any) => ({
        ...r,
        related_item: r.knowledge_items,
      })) as Relationship[];
    },
    enabled: !!knowledgeItemId,
  });
  
  // Search for items to link
  const { data: searchResults = [], isLoading: searching } = useQuery({
    queryKey: ['knowledge-items-search', searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 2) return [];
      
      const { data, error } = await supabase
        .from('knowledge_items')
        .select('id, name, slug')
        .neq('id', knowledgeItemId || '')
        .ilike('name', `%${searchTerm}%`)
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: searchTerm.length >= 2,
  });
  
  // Add relationship mutation
  const addRelationship = useMutation({
    mutationFn: async ({ relatedItemId, type }: { relatedItemId: string; type: string }) => {
      const { error } = await supabase
        .from('knowledge_item_relationships')
        .insert({
          knowledge_item_id: knowledgeItemId,
          related_item_id: relatedItemId,
          relationship_type: type,
          position: relationships.length,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-item-relationships', knowledgeItemId] });
      setSearchTerm('');
      setSelectedItemId(null);
      toast({ title: 'Success', description: 'Related item added' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
  
  // Remove relationship mutation
  const removeRelationship = useMutation({
    mutationFn: async (relationshipId: string) => {
      const { error } = await supabase
        .from('knowledge_item_relationships')
        .delete()
        .eq('id', relationshipId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-item-relationships', knowledgeItemId] });
      toast({ title: 'Success', description: 'Related item removed' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleAddRelationship = () => {
    if (!selectedItemId) return;
    addRelationship.mutate({ relatedItemId: selectedItemId, type: selectedType });
  };

  if (!knowledgeItemId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4" />
            Related Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            Save the knowledge item first to add related items.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4" />
          Related Knowledge Items
        </CardTitle>
        <CardDescription>
          Link to other techniques, concepts, or practices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing relationships */}
        {loadingRelationships ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : relationships.length > 0 ? (
          <div className="space-y-2">
            {relationships.map((rel) => (
              <div 
                key={rel.id}
                className="flex items-center justify-between p-2 border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {RELATIONSHIP_TYPES.find(t => t.value === rel.relationship_type)?.label || rel.relationship_type}
                  </Badge>
                  <span className="font-medium text-sm">{rel.related_item?.name || 'Unknown'}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRelationship.mutate(rel.id)}
                  className="text-destructive hover:text-destructive"
                  disabled={removeRelationship.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            No related items yet
          </p>
        )}
        
        {/* Add new relationship */}
        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium">Add Related Item</p>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search knowledge items..."
              className="pl-9"
            />
          </div>
          
          {/* Search results */}
          {searchTerm.length >= 2 && (
            <ScrollArea className="h-32 border rounded-lg">
              {searching ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3">No results found</p>
              ) : (
                <div className="p-1">
                  {searchResults
                    .filter(item => !relationships.some(r => r.related_item_id === item.id))
                    .map(item => (
                      <div
                        key={item.id}
                        className={`p-2 rounded cursor-pointer text-sm ${
                          selectedItemId === item.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedItemId(item.id)}
                      >
                        {item.name}
                      </div>
                    ))}
                </div>
              )}
            </ScrollArea>
          )}
          
          {selectedItemId && (
            <div className="flex gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleAddRelationship}
                disabled={addRelationship.isPending}
              >
                {addRelationship.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
