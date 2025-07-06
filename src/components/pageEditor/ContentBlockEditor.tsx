import React, { useState, useEffect } from 'react';
import { ContentBlock } from '@/types/page';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContentFieldsRenderer } from './ContentFieldsRenderer';
import { StyleFieldsRenderer } from './StyleFieldsRenderer';

interface ContentBlockEditorProps {
  block: ContentBlock | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (blockData: Partial<ContentBlock>) => void;
}

export const ContentBlockEditor: React.FC<ContentBlockEditorProps> = ({
  block,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<ContentBlock>>({});
  const [activeTab, setActiveTab] = useState<'content' | 'style'>('content');

  useEffect(() => {
    if (block) {
      setFormData(block);
    } else {
      setFormData({
        type: 'text',
        content: {},
        is_visible: true,
      });
    }
  }, [block]);

  const handleContentChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...(prev.content || {}),
        [key]: value,
      },
    }));
  };

  const handleStyleChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...(prev.content || {}),
        styles: {
          ...(prev.content?.styles || {}),
          [key]: value,
        },
      },
    }));
  };

  const resetToDefault = () => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...(prev.content || {}),
        styles: {},
      },
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const styles = formData.content?.styles || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {block ? 'Edit Content Block' : 'Add Content Block'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'content' | 'style')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-6">
            <div>
              <Label htmlFor="block-type">Block Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: ContentBlock['type']) => 
                  setFormData(prev => ({ ...prev, type: value, content: {} }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">Hero Section</SelectItem>
                  <SelectItem value="section">Section</SelectItem>
                  <SelectItem value="text">Text Block</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ContentFieldsRenderer
              blockType={formData.type || 'text'}
              content={formData.content || {}}
              onContentChange={handleContentChange}
            />

            <div className="flex items-center space-x-2">
              <Switch
                id="visibility"
                checked={formData.is_visible}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_visible: checked }))
                }
              />
              <Label htmlFor="visibility">Visible on page</Label>
            </div>
          </TabsContent>
          
          <TabsContent value="style" className="space-y-6">
            <StyleFieldsRenderer
              styles={styles}
              onStyleChange={handleStyleChange}
              onResetToDefault={resetToDefault}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {block ? 'Update' : 'Add'} Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};