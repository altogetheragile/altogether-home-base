import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Settings, Monitor, Tablet, Smartphone } from 'lucide-react';

interface PageHeaderProps {
  pageSlug: string;
  isPreview: boolean;
  deviceView: 'desktop' | 'tablet' | 'mobile';
  onPreviewToggle: () => void;
  onDeviceViewChange: (view: 'desktop' | 'tablet' | 'mobile') => void;
  onSettingsToggle: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  pageSlug,
  isPreview,
  deviceView,
  onPreviewToggle,
  onDeviceViewChange,
  onSettingsToggle,
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold">Page Editor</h1>
        <p className="text-muted-foreground">/{pageSlug}</p>
      </div>
      
      <div className="flex gap-2">
        {/* Device View Toggle */}
        {isPreview && (
          <div className="flex border rounded-md">
            <Button
              variant={deviceView === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onDeviceViewChange('desktop')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={deviceView === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onDeviceViewChange('tablet')}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={deviceView === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onDeviceViewChange('mobile')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <Button
          variant="outline"
          onClick={onPreviewToggle}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          {isPreview ? 'Edit Mode' : 'Preview'}
        </Button>
        
        <Button
          variant="outline"
          onClick={onSettingsToggle}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Page Settings
        </Button>
      </div>
    </div>
  );
};