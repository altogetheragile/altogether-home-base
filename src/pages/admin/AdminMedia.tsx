import { useState } from 'react';
import { Link2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MediaLibrary } from '@/components/ui/media-library';
import { AttachToKnowledgeItemDialog } from '@/components/admin/AttachToKnowledgeItemDialog';

const AdminMedia = () => {
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">
            Manage images, videos, and other media assets that can be used across the platform
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Media Assets</CardTitle>
          {selectedMediaIds.length > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setAttachDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Link2 className="h-4 w-4" />
              Attach to Knowledge Item ({selectedMediaIds.length})
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <MediaLibrary
            selectedMediaIds={selectedMediaIds}
            onSelectionChange={setSelectedMediaIds}
            multiSelect={true}
          />
        </CardContent>
      </Card>

      <AttachToKnowledgeItemDialog
        open={attachDialogOpen}
        onOpenChange={setAttachDialogOpen}
        selectedMediaIds={selectedMediaIds}
      />
    </div>
  );
};

export default AdminMedia;