import { useState } from 'react';
import { 
  CheckSquare, X, Eye, EyeOff, Trash2, Download, 
  Star, Archive, Tag, FolderOpen, Layers 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories';
import { usePlanningFocuses } from '@/hooks/usePlanningFocuses';
import { useActivityDomains } from '@/hooks/useActivityDomains';

interface BulkOperationsPanelProps {
  selectedCount: number;
  onBulkAction: (action: string, itemIds: string[]) => void;
  onClearSelection: () => void;
}

export const BulkOperationsPanel = ({
  selectedCount,
  onBulkAction,
  onClearSelection
}: BulkOperationsPanelProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedValue, setSelectedValue] = useState<string>('');

  const { data: categories } = useKnowledgeCategories();
  const { data: planningFocuses } = usePlanningFocuses();
  const { data: domains } = useActivityDomains();

  const handleAction = (action: string, value?: string) => {
    if (action === 'delete') {
      setShowDeleteConfirm(true);
      return;
    }

    onBulkAction(action, []);
    if (action !== 'export') {
      onClearSelection();
    }
  };

  const handleAssignCategory = () => {
    if (!selectedValue) return;
    onBulkAction('assign_category', [selectedValue]);
    setSelectedValue('');
    onClearSelection();
  };

  const handleAssignLayer = () => {
    if (!selectedValue) return;
    onBulkAction('assign_layer', [selectedValue]);
    setSelectedValue('');
    onClearSelection();
  };

  const handleAssignDomain = () => {
    if (!selectedValue) return;
    onBulkAction('assign_domain', [selectedValue]);
    setSelectedValue('');
    onClearSelection();
  };

  const confirmDelete = () => {
    onBulkAction('delete', []);
    setShowDeleteConfirm(false);
    onClearSelection();
  };

  return (
    <>
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">
                {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearSelection}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleAction('publish')}
              >
                <Eye className="h-4 w-4 mr-1" />
                Publish
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleAction('unpublish')}
              >
                <EyeOff className="h-4 w-4 mr-1" />
                Unpublish
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleAction('feature')}
              >
                <Star className="h-4 w-4 mr-1" />
                Feature
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleAction('export')}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>

            {/* Assignment Actions */}
            <div className="flex items-center gap-1">
              <Select value={selectedValue} onValueChange={setSelectedValue}>
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue placeholder="Assign category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedValue && (
                <Button size="sm" onClick={handleAssignCategory}>
                  <FolderOpen className="h-4 w-4 mr-1" />
                  Assign
                </Button>
              )}
            </div>

            {/* Destructive Actions */}
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleAction('archive')}
                className="text-muted-foreground hover:text-foreground"
              >
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleAction('delete')}
                className="text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Secondary row for additional assignment options */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-primary/10">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Bulk assign:</span>
          </div>

          <div className="flex items-center gap-2">
            <Select>
              <SelectTrigger className="w-[140px] h-7 text-xs">
                <SelectValue placeholder="Planning layer..." />
              </SelectTrigger>
              <SelectContent>
                {planningFocuses?.map((layer) => (
                  <SelectItem key={layer.id} value={layer.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: layer.color }}
                      />
                      {layer.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-[140px] h-7 text-xs">
                <SelectValue placeholder="Domain..." />
              </SelectTrigger>
              <SelectContent>
                {domains?.map((domain) => (
                  <SelectItem key={domain.id} value={domain.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: domain.color }}
                      />
                      {domain.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Items</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} selected knowledge item{selectedCount !== 1 ? 's' : ''}? 
              This action cannot be undone and will also delete all associated use cases.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedCount} item{selectedCount !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};