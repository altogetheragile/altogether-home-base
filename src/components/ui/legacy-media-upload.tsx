import React from 'react';
import { MediaUpload } from './media-upload';

// Legacy wrapper for backward compatibility
// This component provides a bridge between the old MediaItem interface and the new MediaAsset system
export interface LegacyMediaItem {
  id?: string;
  type: 'image' | 'video' | 'document' | 'embed';
  title?: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  position: number;
  technique_id?: string;
}

interface LegacyMediaUploadProps {
  value: LegacyMediaItem[];
  onChange: (media: LegacyMediaItem[]) => void;
  bucketName?: string;
}

/**
 * @deprecated Use MediaLibrary component instead for new implementations
 * This component is maintained for backward compatibility only
 */
export const LegacyMediaUpload: React.FC<LegacyMediaUploadProps> = (props) => {
  console.warn('LegacyMediaUpload is deprecated. Please migrate to MediaLibrary component for better media management.');
  
  return <MediaUpload {...props} />;
};