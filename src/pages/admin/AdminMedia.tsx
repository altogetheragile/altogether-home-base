import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaLibrary } from '@/components/ui/media-library';

const AdminMedia = () => {
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);

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
        <CardHeader>
          <CardTitle>Media Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <MediaLibrary
            selectedMediaIds={selectedMediaIds}
            onSelectionChange={setSelectedMediaIds}
            multiSelect={true}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMedia;