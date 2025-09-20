import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { UnifiedAssetLibrary } from './unified-asset-library';
import { useUnifiedAssets } from '@/hooks/useUnifiedAssetManager';
import { 
  Image, 
  Video, 
  FileText, 
  Link, 
  Archive,
  Plus,
  X
} from 'lucide-react';

export interface AssetSelectorProps {
  selectedAssetIds: string[];
  onSelectionChange: (assetIds: string[]) => void;
  multiSelect?: boolean;
  label?: string;
  placeholder?: string;
  supportedTypes?: ('image' | 'video' | 'document' | 'embed' | 'archive')[];
  templatesOnly?: boolean;
  mediaOnly?: boolean;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  selectedAssetIds,
  onSelectionChange,
  multiSelect = true,
  label = "Select Assets",
  placeholder = "No assets selected",
  supportedTypes,
  templatesOnly = false,
  mediaOnly = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: allAssets } = useUnifiedAssets({ templatesOnly, mediaOnly });

  const selectedAssets = allAssets?.filter(asset => 
    selectedAssetIds.includes(asset.id)
  ) || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-3 w-3" />;
      case 'video': return <Video className="h-3 w-3" />;
      case 'document': return <FileText className="h-3 w-3" />;
      case 'embed': return <Link className="h-3 w-3" />;
      case 'archive': return <Archive className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  const handleRemoveAsset = (assetId: string) => {
    onSelectionChange(selectedAssetIds.filter(id => id !== assetId));
  };

  const handleLibrarySelectionChange = (assetIds: string[]) => {
    onSelectionChange(assetIds);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      
      <div className="space-y-2">
        {/* Selected Assets Display */}
        {selectedAssets.length > 0 ? (
          <div className="space-y-2">
            {selectedAssets.map((asset) => (
              <Card key={asset.id} className="p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getTypeIcon(asset.type)}
                    <span className="truncate text-sm">
                      {asset.title || asset.original_filename || 'Untitled'}
                    </span>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {asset.type}
                      </Badge>
                      {asset.is_template && (
                        <Badge variant="secondary" className="text-xs">
                          Template
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAsset(asset.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-2">
            {placeholder}
          </div>
        )}

        {/* Asset Library Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {selectedAssets.length > 0 ? 'Manage Assets' : 'Select Assets'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {templatesOnly ? 'Select Templates' : mediaOnly ? 'Select Media' : 'Select Assets'}
              </DialogTitle>
            </DialogHeader>
            <UnifiedAssetLibrary
              selectedAssetIds={selectedAssetIds}
              onSelectionChange={handleLibrarySelectionChange}
              multiSelect={multiSelect}
              supportedTypes={supportedTypes}
              showTemplatesOnly={templatesOnly}
              showFilters={true}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsOpen(false)}>
                Done ({selectedAssetIds.length} selected)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};