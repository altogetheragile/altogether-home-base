import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calculator, Activity } from 'lucide-react';
import { UnifiedStoryData, UnifiedStoryMode } from '@/types/story';
import { UserStoryTab } from './tabs/UserStoryTab';
import { EstimationTab } from './tabs/EstimationTab';
import { TrackingTab } from './tabs/TrackingTab';

export interface UnifiedStoryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: Partial<UnifiedStoryData>;
  onSave: (data: UnifiedStoryData) => void;
  mode?: UnifiedStoryMode;
  isLoading?: boolean;
  title?: string;
}

const defaultData: UnifiedStoryData = {
  title: '',
  description: null,
  acceptance_criteria: [],
  story_points: null,
  priority: 'medium',
  estimated_value: null,
  estimated_effort: null,
  confidence_level: null,
  status: 'idea',
  sprint: null,
  target_release: null,
  tags: [],
  source: 'enhancement',
  user_persona: null,
  business_value: null,
  epic_id: null,
  user_story_id: null,
};

export function UnifiedStoryEditDialog({
  open,
  onOpenChange,
  data,
  onSave,
  mode = 'backlog',
  isLoading = false,
  title: customTitle,
}: UnifiedStoryEditDialogProps) {
  const [formData, setFormData] = useState<UnifiedStoryData>({ ...defaultData, ...data });
  const [activeTab, setActiveTab] = useState('story');

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      setFormData({ 
        ...defaultData, 
        ...data,
        status: data?.status || (mode === 'backlog' ? 'idea' : 'draft'),
      });
      setActiveTab('story');
    }
  }, [open, data, mode]);

  const handleChange = (updates: Partial<UnifiedStoryData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    if (!formData.title?.trim()) {
      return;
    }
    
    // Clean up data before saving
    const cleanedData: UnifiedStoryData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      acceptance_criteria: formData.acceptance_criteria?.filter(c => c.trim()) || null,
      tags: formData.tags?.filter(t => t.trim()) || null,
    };
    
    onSave(cleanedData);
  };

  const dialogTitle = customTitle || (
    mode === 'epic' 
      ? (data?.id ? 'Edit Epic' : 'New Epic')
      : mode === 'story'
        ? (data?.id ? 'Edit User Story' : 'New User Story')
        : (data?.id ? 'Edit Backlog Item' : 'New Backlog Item')
  );

  const isValid = formData.title?.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="story" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">User Story</span>
            </TabsTrigger>
            <TabsTrigger value="estimation" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Estimation</span>
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Tracking</span>
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto mt-4 pr-1 max-h-[calc(90vh-220px)]">
            <TabsContent value="story" className="mt-0">
              <UserStoryTab data={formData} onChange={handleChange} mode={mode} />
            </TabsContent>

            <TabsContent value="estimation" className="mt-0">
              <EstimationTab data={formData} onChange={handleChange} mode={mode} />
            </TabsContent>

            <TabsContent value="tracking" className="mt-0">
              <TrackingTab data={formData} onChange={handleChange} mode={mode} />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
