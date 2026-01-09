import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface ClassificationItem {
  id: string;
  name: string;
  color?: string | null;
  description?: string | null;
}

interface PrimaryClassificationPickerProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  items: ClassificationItem[];
  selectedIds: string[];
  primaryId?: string | null;
  rationale?: string;
  onSelectionChange: (ids: string[]) => void;
  onPrimaryChange: (id: string | null) => void;
  onRationaleChange?: (rationale: string) => void;
  isLoading?: boolean;
}

export const PrimaryClassificationPicker: React.FC<PrimaryClassificationPickerProps> = ({
  title,
  description,
  icon: Icon,
  items,
  selectedIds,
  primaryId,
  rationale,
  onSelectionChange,
  onPrimaryChange,
  onRationaleChange,
  isLoading,
}) => {
  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      // Remove from selection
      const newIds = selectedIds.filter(i => i !== id);
      onSelectionChange(newIds);
      // If removing primary, clear it
      if (primaryId === id) {
        onPrimaryChange(newIds[0] || null);
      }
    } else {
      // Add to selection
      const newIds = [...selectedIds, id];
      onSelectionChange(newIds);
      // If this is the first item, make it primary
      if (newIds.length === 1) {
        onPrimaryChange(id);
      }
    }
  };

  const handlePrimaryChange = (id: string) => {
    // Ensure the item is selected
    if (!selectedIds.includes(id)) {
      onSelectionChange([...selectedIds, id]);
    }
    onPrimaryChange(id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Selection */}
        {selectedIds.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Primary:</Label>
            <RadioGroup 
              value={primaryId || ''} 
              onValueChange={handlePrimaryChange}
              className="flex flex-wrap gap-2"
            >
              {items
                .filter(item => selectedIds.includes(item.id))
                .map(item => (
                  <div key={item.id} className="flex items-center gap-1.5">
                    <RadioGroupItem value={item.id} id={`primary-${item.id}`} />
                    <Label 
                      htmlFor={`primary-${item.id}`}
                      className="text-sm cursor-pointer"
                    >
                      <Badge
                        variant="outline"
                        style={item.color ? {
                          backgroundColor: item.color + '15',
                          borderColor: item.color + '40',
                          color: item.color,
                        } : undefined}
                      >
                        {item.name}
                      </Badge>
                    </Label>
                  </div>
                ))}
            </RadioGroup>
          </div>
        )}

        {/* Rationale (only show if items selected) */}
        {selectedIds.length > 0 && onRationaleChange && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Rationale (why this is the primary choice):
            </Label>
            <Textarea
              value={rationale || ''}
              onChange={(e) => onRationaleChange(e.target.value)}
              placeholder="Explain why this classification was chosen as primary..."
              className="text-sm resize-none"
              rows={2}
            />
          </div>
        )}

        {/* All Items Checklist */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            {selectedIds.length > 0 ? 'Secondary selections:' : 'Select classifications:'}
          </Label>
          <ScrollArea className="h-[160px] border rounded-md">
            <div className="p-2 space-y-1">
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isPrimary = primaryId === item.id;
                
                return (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors
                      ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'}
                      ${isPrimary ? 'ring-1 ring-primary/30' : ''}
                    `}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {item.color && (
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                      <span className="text-sm truncate">{item.name}</span>
                      {isPrimary && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          Primary
                        </Badge>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
