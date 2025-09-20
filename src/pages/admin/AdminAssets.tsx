import React from 'react';
import { UnifiedAssetLibrary } from '@/components/ui/unified-asset-library';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminAssets: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Asset Management</CardTitle>
          <CardDescription>
            Manage all your assets including images, documents, templates, and media files in one unified interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UnifiedAssetLibrary 
            showFilters={true}
            viewMode="grid"
            multiSelect={false}
            bucketName="assets"
            supportedTypes={['image', 'video', 'document', 'embed', 'archive']}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAssets;