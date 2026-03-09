import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HelpCircle } from 'lucide-react';

type StoryType = 'epic' | 'feature' | 'story';
type AnalysisType = 'user-story-generation' | 'spidr' | 'split' | 'acceptance_criteria' | 'refine';

interface Project {
  id: string;
  name: string;
}

interface StoryAdvancedOptionsProps {
  storyType: StoryType;
  onStoryTypeChange: (value: StoryType) => void;
  analysisType: AnalysisType;
  onAnalysisTypeChange: (value: AnalysisType) => void;
  saveToCanvas: boolean;
  onSaveToCanvasChange: (value: boolean) => void;
  selectedProjectId: string;
  onSelectedProjectIdChange: (value: string) => void;
  projectIdLocked: boolean;
  projects: Project[] | undefined;
  user: { id: string } | null;
}

export function StoryAdvancedOptions({
  storyType,
  onStoryTypeChange,
  analysisType,
  onAnalysisTypeChange,
  saveToCanvas,
  onSaveToCanvasChange,
  selectedProjectId,
  onSelectedProjectIdChange,
  projectIdLocked,
  projects,
  user,
}: StoryAdvancedOptionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
       <div className="space-y-2">
         <div className="flex items-center gap-2">
           <Label htmlFor="storyType">Story Type</Label>
           <Popover>
             <PopoverTrigger asChild>
               <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground" />
             </PopoverTrigger>
             <PopoverContent className="w-80" side="top">
               <div className="space-y-3">
                 <h4 className="font-medium">Story Types</h4>
                 <div className="space-y-2 text-sm">
                   <div>
                     <strong>User Story:</strong> Small, user-focused requirement that can be completed in 1-3 days. Best for specific features.
                   </div>
                   <div>
                     <strong>Feature:</strong> Larger functional component containing multiple user stories (1-2 weeks). Groups related functionality.
                   </div>
                   <div>
                     <strong>Epic:</strong> High-level initiative spanning multiple features (1-3 months). Represents major product areas.
                   </div>
                 </div>
               </div>
             </PopoverContent>
           </Popover>
         </div>
        <Select value={storyType} onValueChange={(value: StoryType) => onStoryTypeChange(value)}>
          <SelectTrigger id="storyType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="story">User Story</SelectItem>
            <SelectItem value="feature">Feature</SelectItem>
            <SelectItem value="epic">Epic</SelectItem>
          </SelectContent>
        </Select>
      </div>

       <div className="space-y-2">
         <div className="flex items-center gap-2">
           <Label htmlFor="analysisType">Analysis Type</Label>
           <Popover>
             <PopoverTrigger asChild>
               <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground" />
             </PopoverTrigger>
             <PopoverContent className="w-96" side="top">
               <div className="space-y-3">
                 <h4 className="font-medium">Analysis Types</h4>
                 <div className="space-y-3 text-sm">
                   <div>
                     <strong>Generate User Story:</strong> Create a complete user story from scratch with title, description, and acceptance criteria. Use when starting with just an idea.
                   </div>
                   <div>
                     <strong>Enhanced Criteria:</strong> Generate additional, detailed acceptance criteria for an existing story. Use when you already have a story but need more specific requirements.
                   </div>
                   <div>
                     <strong>Story Refinement:</strong> Get questions and suggestions to improve story clarity and completeness. Use when your story feels incomplete or unclear.
                   </div>
                   <div>
                     <strong>SPIDR Analysis:</strong> Break down using SPIDR framework - Spike (research needed), Path (user journey), Interface (UI/UX), Data (storage), Rules (business logic). Use for complex stories.
                   </div>
                   <div>
                     <strong>Split Stories:</strong> Break large stories into smaller, manageable pieces. Use when stories are too big (8+ story points) or span multiple areas.
                   </div>
                 </div>
               </div>
             </PopoverContent>
           </Popover>
         </div>
        <Select value={analysisType} onValueChange={(value: AnalysisType) => onAnalysisTypeChange(value)}>
          <SelectTrigger id="analysisType">
            <SelectValue />
          </SelectTrigger>
           <SelectContent>
             <SelectItem value="user-story-generation">Generate User Story (Default)</SelectItem>
             <SelectItem value="acceptance_criteria">Enhanced Criteria</SelectItem>
             <SelectItem value="refine">Story Refinement</SelectItem>
             <SelectItem value="spidr">SPIDR Analysis</SelectItem>
             <SelectItem value="split">Split Into Smaller Stories</SelectItem>
           </SelectContent>
        </Select>
      </div>

      {user && (
        <div className="md:col-span-2 space-y-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="saveToCanvas"
              checked={saveToCanvas}
              onChange={(e) => onSaveToCanvasChange(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="saveToCanvas" className="text-sm font-medium">
              Save to Project Canvas
            </Label>
          </div>

          {saveToCanvas && (
            <div className="space-y-2">
              <Label htmlFor="projectSelect">Select Project</Label>
              <Select
                value={selectedProjectId}
                onValueChange={onSelectedProjectIdChange}
                disabled={projectIdLocked}
              >
                <SelectTrigger id="projectSelect">
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
