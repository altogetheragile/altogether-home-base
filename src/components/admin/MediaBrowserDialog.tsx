import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMediaAssets } from '@/hooks/useMediaAssets';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Image as ImageIcon, Video, ExternalLink, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaBrowserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string, mediaId: string) => void;
  filterType?: 'image' | 'video' | 'all';
}

export const MediaBrowserDialog = ({ 
  open, 
  onOpenChange, 
  onSelect,
  filterType = 'all'
}: MediaBrowserDialogProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: mediaAssets, isLoading } = useMediaAssets();

  const filteredAssets = (mediaAssets || []).filter((asset: any) => {
    const matchesType = filterType === 'all' || asset.type === filterType;
    const matchesSearch = !searchQuery || 
      asset.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleSelect = () => {
    if (selectedId) {
      const selected = filteredAssets.find((a: any) => a.id === selectedId);
      if (selected) {
        onSelect(selected.url, selected.id);
        onOpenChange(false);
        setSelectedId(null);
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Browse Media Library</DialogTitle>
          <DialogDescription>
            Select an asset from your media library to insert
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading media assets...
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No media assets found. Upload some assets first.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-1">
                {filteredAssets.map((asset: any) => (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedId(asset.id)}
                    className={cn(
                      "relative group rounded-lg overflow-hidden border-2 transition-all hover:shadow-md",
                      selectedId === asset.id 
                        ? "border-primary shadow-lg" 
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    {selectedId === asset.id && (
                      <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    
                    {asset.type === 'image' ? (
                      <div className="aspect-video bg-muted relative">
                        <img
                          src={asset.thumbnail_url || asset.url}
                          alt={asset.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        {getTypeIcon(asset.type)}
                      </div>
                    )}
                    
                    <div className="p-2 bg-background">
                      <p className="text-xs font-medium truncate">
                        {asset.title || 'Untitled'}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        {getTypeIcon(asset.type)}
                        <span className="capitalize">{asset.type}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSelect} disabled={!selectedId}>
              Insert Selected
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
