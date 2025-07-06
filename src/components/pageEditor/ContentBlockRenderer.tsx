import React from 'react';
import { ContentBlock } from '@/types/page';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HeroBlock } from './components/HeroBlock';
import { SectionBlock } from './components/SectionBlock';
import { TextBlock } from './components/TextBlock';
import { ImageBlock } from './components/ImageBlock';
import { VideoBlock } from './components/VideoBlock';

interface ContentBlockRendererProps {
  block: ContentBlock;
  isEditing?: boolean;
  onEdit?: (block: ContentBlock) => void;
  onDelete?: (blockId: string) => void;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
}

export const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({
  block,
  isEditing = false,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const renderContent = () => {
    console.log('Styles for block:', block.id, block.content?.styles); // Debug log
    
    switch (block.type) {
      case 'hero':
        return <HeroBlock block={block} />;
      case 'section':
        return <SectionBlock block={block} />;
      case 'text':
        return <TextBlock block={block} />;
      case 'image':
        return <ImageBlock block={block} />;
      case 'video':
        return <VideoBlock block={block} />;
      default:
        return (
          <div className="py-4 px-6 bg-muted rounded-lg">
            <p className="text-muted-foreground">Unknown content type: {block.type}</p>
          </div>
        );
    }
  };

  if (!isEditing) {
    return <div className={!block.is_visible ? 'opacity-50' : ''}>{renderContent()}</div>;
  }

  return (
    <Card className={`relative group ${!block.is_visible ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        {renderContent()}
        
        {/* Edit Controls */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1 bg-background border rounded-md p-1 shadow-md">
            {onMoveUp && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMoveUp(block.id)}
                className="h-6 w-6 p-0"
                title="Move up"
              >
                ↑
              </Button>
            )}
            {onMoveDown && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMoveDown(block.id)}
                className="h-6 w-6 p-0"
                title="Move down"
              >
                ↓
              </Button>
            )}
            {onEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(block)}
                className="h-6 w-6 p-0"
                title="Edit"
              >
                ✏️
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(block.id)}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                title="Delete"
              >
                🗑️
              </Button>
            )}
          </div>
        </div>

        {/* Block Info */}
        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-background border rounded px-2 py-1 text-xs text-muted-foreground">
            {block.type} #{block.position}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};