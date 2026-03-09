import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle, HelpCircle, Copy } from 'lucide-react';
import { type StoryAnalysisResult, type AnalysisTextItem, getItemText } from './storyExportUtils';

interface StoryAnalysisResultsProps {
  analysisResult: StoryAnalysisResult;
  analysisType: string;
  storyType: 'epic' | 'feature' | 'story';
  user: { id: string } | null;
  isSavingStories: boolean;
  onSaveAllSplitStories: () => void;
  onCreateStory: (story: { title: string; description: string; acceptanceCriteria: AnalysisTextItem[] }) => void;
  onCopyToClipboard: (content: string) => void;
}

export function StoryAnalysisResults({
  analysisResult,
  analysisType: _analysisType,
  storyType,
  user,
  isSavingStories,
  onSaveAllSplitStories,
  onCreateStory,
  onCopyToClipboard,
}: StoryAnalysisResultsProps) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Analysis Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {analysisResult.spidrAnalysis && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(analysisResult.spidrAnalysis).map(([key, items]) => (
              <div key={key} className="space-y-2">
                <h4 className="font-semibold capitalize text-sm">
                  {key === 'spike' ? 'Spike (Research)' :
                   key === 'path' ? 'Path (User Journey)' :
                   key === 'interface' ? 'Interface (UI/UX)' :
                   key === 'data' ? 'Data (Storage)' :
                   'Rules (Business Logic)'}
                </h4>
                 <div className="space-y-1">
                   {items.map((item: AnalysisTextItem, index: number) => (
                     <div key={index} className="text-sm p-2 bg-muted rounded">
                       {getItemText(item)}
                     </div>
                   ))}
                 </div>
              </div>
            ))}
          </div>
        )}

         {analysisResult.splitStories && (
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <h4 className="font-semibold">Suggested Split Stories:</h4>
               {user && (
                 <Button
                   size="sm"
                   onClick={onSaveAllSplitStories}
                   disabled={isSavingStories}
                 >
                   Save All as {storyType === 'epic' ? 'Epic + Stories' : storyType === 'feature' ? 'Feature + Stories' : 'Stories'}
                 </Button>
               )}
             </div>
             {analysisResult.splitStories.map((story, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                   <div className="flex justify-between items-start mb-2">
                     <h5 className="font-medium">{story.title}</h5>
                     <div className="flex gap-2">
                       {user ? (
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => onCreateStory(story)}
                         >
                           Create Story
                         </Button>
                       ) : (
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => onCopyToClipboard(`${story.title}\n${story.description}\n\nAcceptance Criteria:\n${story.acceptanceCriteria.map(getItemText).join('\n')}`)}
                         >
                           <Copy className="h-3 w-3 mr-1" />
                           Copy
                         </Button>
                       )}
                     </div>
                   </div>
                  <p className="text-sm text-muted-foreground mb-2">{story.description}</p>
                  {story.acceptanceCriteria.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium">Acceptance Criteria:</span>
                      {story.acceptanceCriteria.map((criteria, idx) => (
                        <div key={idx} className="text-sm pl-2 border-l-2 border-muted">
                          {getItemText(criteria)}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {analysisResult.acceptanceCriteria && (
          <div className="space-y-2">
            <h4 className="font-semibold">Acceptance Criteria:</h4>
            {analysisResult.acceptanceCriteria.map((criteria, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                <span className="text-sm">{getItemText(criteria)}</span>
              </div>
            ))}
          </div>
        )}

        {analysisResult.refinementQuestions && (
          <div className="space-y-2">
            <h4 className="font-semibold">Refinement Questions:</h4>
            {analysisResult.refinementQuestions.map((question, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded">
                <HelpCircle className="h-4 w-4 mt-0.5 text-blue-600" />
                <span className="text-sm">{getItemText(question)}</span>
              </div>
            ))}
          </div>
        )}

        {analysisResult.suggestions && (
          <div className="space-y-2">
            <h4 className="font-semibold">Suggestions:</h4>
            {analysisResult.suggestions.map((suggestion, index) => (
              <div key={index} className="p-2 bg-muted rounded text-sm">
                {getItemText(suggestion)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
