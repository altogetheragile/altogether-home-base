
import React, { useRef, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, Download } from 'lucide-react';
import { exportToCSV } from '@/utils/exportUtils';

interface BulkOperationsProps {
  selectedItems: string[];
  allItems: any[];
  onSelectAll: (checked: boolean) => void;
  type: 'events' | 'instructors' | 'locations' | 'templates';
}

const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedItems,
  allItems,
  onSelectAll,
  type
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      if (selectedItems.length === 0) {
        checkboxRef.current.checked = false;
        checkboxRef.current.indeterminate = false;
      } else if (selectedItems.length === allItems.length) {
        checkboxRef.current.checked = true;
        checkboxRef.current.indeterminate = false;
      } else {
        checkboxRef.current.checked = false;
        checkboxRef.current.indeterminate = true;
      }
    }
  }, [selectedItems, allItems]);

  const handleExport = () => {
    const selectedData = allItems.filter(item => selectedItems.includes(item.id));
    exportToCSV(selectedData, `${type}-export`);
  };

  const handleBulkDelete = () => {
    // In real app, this would call mutation
    console.log(`Delete ${selectedItems.length} ${type}`);
  };

  if (allItems.length === 0) return null;

  return (
    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center space-x-4">
        <input
          ref={checkboxRef}
          type="checkbox"
          onChange={(e) => onSelectAll(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <span className="text-sm text-gray-700">
          {selectedItems.length > 0 
            ? `${selectedItems.length} selected` 
            : `Select all ${allItems.length} ${type}`}
        </span>
      </div>

      {selectedItems.length > 0 && (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
};

export default BulkOperations;
