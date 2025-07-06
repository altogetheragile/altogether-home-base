import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface PageSidebarProps {
  isVisible: boolean;
  pageInfo: {
    contentBlocksCount: number;
    isPublished: boolean;
    lastUpdated: string;
  };
  onAddBlock: () => void;
}

export const PageSidebar: React.FC<PageSidebarProps> = ({
  isVisible,
  pageInfo,
  onAddBlock,
}) => {
  if (!isVisible) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Content</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onAddBlock}
            className="w-full flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Block
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong>Blocks:</strong> {pageInfo.contentBlocksCount}
          </div>
          <div>
            <strong>Published:</strong> {pageInfo.isPublished ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Last Updated:</strong> {pageInfo.lastUpdated}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};