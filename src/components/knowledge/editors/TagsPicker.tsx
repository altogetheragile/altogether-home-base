import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tags, Loader2 } from 'lucide-react';
import { useKnowledgeTags } from '@/hooks/useKnowledgeTags';

export const TagsPicker: React.FC = () => {
  const form = useFormContext();
  const { data: tags = [], isLoading } = useKnowledgeTags();
  
  const selectedTagIds = form.watch('tag_ids') || [];

  const toggleTag = (tagId: string) => {
    const current = selectedTagIds;
    if (current.includes(tagId)) {
      form.setValue('tag_ids', current.filter((id: string) => id !== tagId));
    } else {
      form.setValue('tag_ids', [...current, tagId]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Tags className="h-4 w-4" />
          Tags
        </CardTitle>
        <CardDescription>
          Add tags to improve discoverability
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : tags.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No tags available</p>
        ) : (
          <>
            {/* Selected tags summary */}
            {selectedTagIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4 pb-4 border-b">
                {selectedTagIds.map((tagId: string) => {
                  const tag = tags.find(t => t.id === tagId);
                  return tag ? (
                    <Badge 
                      key={tagId} 
                      variant="default"
                      className="cursor-pointer"
                      onClick={() => toggleTag(tagId)}
                    >
                      {tag.name}
                      <span className="ml-1 text-xs">×</span>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
            
            {/* Tag checklist */}
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {tags.map(tag => (
                  <div 
                    key={tag.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleTag(tag.id)}
                  >
                    <Checkbox
                      checked={selectedTagIds.includes(tag.id)}
                      onCheckedChange={() => toggleTag(tag.id)}
                    />
                    <span className="text-sm">{tag.name}</span>
                    {tag.usage_count !== undefined && tag.usage_count > 0 && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {tag.usage_count} uses
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
};
