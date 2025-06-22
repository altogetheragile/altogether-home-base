
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Eye, EyeOff, Trash2 } from 'lucide-react';
import { exportToCSV, formatDataForExport } from '@/utils/exportUtils';

interface BulkOperationsProps {
  selectedItems: string[];
  allItems: any[];
  onSelectAll: (checked: boolean) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkUpdate?: (ids: string[], data: any) => void;
  type: 'events' | 'locations' | 'instructors';
  showPublishControls?: boolean;
}

const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedItems,
  allItems,
  onSelectAll,
  onBulkDelete,
  onBulkUpdate,
  type,
  showPublishControls = false,
}) => {
  const [bulkAction, setBulkAction] = useState<string>('');

  const handleExport = () => {
    const itemsToExport = selectedItems.length > 0 
      ? allItems.filter(item => selectedItems.includes(item.id))
      : allItems;
    
    const formattedData = formatDataForExport(itemsToExport, type);
    const filename = `${type}_${selectedItems.length > 0 ? 'selected' : 'all'}_${new Date().toISOString().split('T')[0]}`;
    exportToCSV(formattedData, filename);
  };

  const handleBulkAction = () => {
    if (!onBulkUpdate || !bulkAction || selectedItems.length === 0) return;

    switch (bulkAction) {
      case 'publish':
        onBulkUpdate(selectedItems, { is_published: true });
        break;
      case 'unpublish':
        onBulkUpdate(selectedItems, { is_published: false });
        break;
    }
    setBulkAction('');
  };

  const allSelected = selectedItems.length === allItems.length && allItems.length > 0;
  const someSelected = selectedItems.length > 0 && selectedItems.length < allItems.length;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
      {/* Select All Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected;
          }}
          onCheckedChange={onSelectAll}
        />
        <span className="text-sm font-medium">
          {selectedItems.length > 0 ? `${selectedItems.length} selected` : 'Select all'}
        </span>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Selected */}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Selected
          </Button>

          {/* Publish/Unpublish for Events */}
          {showPublishControls && onBulkUpdate && (
            <>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Bulk Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publish">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      Publish
                    </div>
                  </SelectItem>
                  <SelectItem value="unpublish">
                    <div className="flex items-center">
                      <EyeOff className="h-4 w-4 mr-2" />
                      Unpublish
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {bulkAction && (
                <Button size="sm" onClick={handleBulkAction}>
                  Apply
                </Button>
              )}
            </>
          )}

          {/* Bulk Delete */}
          {onBulkDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selectedItems.length} items?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the selected {type}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onBulkDelete(selectedItems)}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Delete {selectedItems.length} items
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

      {/* Export All (when nothing selected) */}
      {selectedItems.length === 0 && (
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      )}
    </div>
  );
};

export default BulkOperations;
