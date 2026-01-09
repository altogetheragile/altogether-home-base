import { useFormContext } from 'react-hook-form';
import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { KnowledgeItemFormData } from '@/schemas/knowledgeItem';

interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  description?: string | null;
  display_order?: number | null;
}

interface MultiSelectClassificationProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  fieldName: keyof Pick<KnowledgeItemFormData, 'decision_level_ids' | 'category_ids' | 'domain_ids' | 'tag_ids'>;
  items: TaxonomyItem[];
  isLoading?: boolean;
}

export const MultiSelectClassification: React.FC<MultiSelectClassificationProps> = ({
  title,
  description,
  icon,
  fieldName,
  items,
  isLoading = false,
}) => {
  const form = useFormContext<KnowledgeItemFormData>();
  const selectedIds = form.watch(fieldName) || [];
  const selectedItems = items.filter(item => selectedIds.includes(item.id));

  const handleToggle = (itemId: string, checked: boolean) => {
    const currentIds = form.getValues(fieldName) || [];
    const newIds = checked
      ? [...currentIds, itemId]
      : currentIds.filter((id: string) => id !== itemId);
    form.setValue(fieldName, newIds, { shouldDirty: true });
  };

  // Sort items by display_order if available, then by name
  const sortedItems = [...items].sort((a, b) => {
    if (a.display_order !== undefined && b.display_order !== undefined) {
      return a.display_order - b.display_order;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <Card className="shadow-sm border-border/50 hover:shadow-md transition-all duration-200 group h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-sm flex items-center gap-2 group-hover:text-primary transition-colors">
          <div className="p-1 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors shrink-0">
            {icon}
          </div>
          <span className="truncate">{title}</span>
          {selectedIds.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs shrink-0">
              {selectedIds.length} selected
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-xs line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-xs">
            No items available
          </div>
        ) : (
          <ScrollArea className="flex-1 h-[200px] -mx-2 px-2">
            <div className="space-y-1.5 pb-2">
              {sortedItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-all text-sm",
                      isSelected
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/50 hover:border-border hover:bg-muted/30"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleToggle(item.id, checked as boolean)}
                      className="mt-0.5 h-4 w-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {item.color && (
                          <div
                            className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                        )}
                        <span className={cn(
                          "font-medium text-xs leading-tight",
                          isSelected && "text-primary"
                        )}>
                          {item.name}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    )}
                  </label>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Selected Items Summary */}
        {selectedItems.length > 0 && (
          <div className="pt-2 mt-2 border-t border-border/30 shrink-0">
            <div className="flex flex-wrap gap-1">
              {selectedItems.map((item) => (
                <Badge
                  key={item.id}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0.5 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                  style={item.color ? {
                    backgroundColor: `${item.color}15`,
                    color: item.color,
                    borderColor: `${item.color}30`,
                  } : undefined}
                  onClick={() => handleToggle(item.id, false)}
                >
                  {item.name}
                  <span className="ml-0.5 opacity-60">×</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
