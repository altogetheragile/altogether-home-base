import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KnowledgeItemAnalytics } from "../KnowledgeItemAnalytics";
import { useFormContext } from "react-hook-form";
import { Plus, ArrowRight } from "lucide-react";

export const AnalyticsSection = () => {
  const form = useFormContext();
  const knowledgeItemData = form.watch();
  
  // Count use cases (this would come from the actual use cases data in a real implementation)
  const useCaseCount = 0; // Placeholder - would be replaced with actual count
  const hasCommonPitfalls = knowledgeItemData.common_pitfalls?.length > 0;
  const hasEvidenceSources = knowledgeItemData.evidence_sources?.length > 0;
  const hasLearningValue = !!knowledgeItemData.learning_value_summary;

  const handleAddUseCase = () => {
    // Navigate to use cases section
    const useCasesStep = 4; // Assuming use cases is step 5 (index 4)
    // This would be handled by the parent component
    console.log('Navigate to use cases section');
  };

  const handleGoToEnhanced = () => {
    // Navigate to enhanced section
    const enhancedStep = 3; // Assuming enhanced is step 4 (index 3)
    console.log('Navigate to enhanced section');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Analytics & Insights</h3>
        <p className="text-sm text-muted-foreground">
          View performance metrics, content analysis, and recommendations
        </p>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Use Cases Quick Action */}
        <Card className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Use Cases</CardTitle>
              <Badge variant={useCaseCount > 0 ? "default" : "outline"}>
                {useCaseCount}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {useCaseCount === 0 
                ? "No use cases defined yet. Add practical examples to help users understand when to apply this knowledge."
                : `${useCaseCount} use case${useCaseCount === 1 ? '' : 's'} defined.`
              }
            </p>
            {useCaseCount === 0 && (
              <Button 
                size="sm" 
                onClick={handleAddUseCase}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Use Case
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Content Quick Action */}
        <Card className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Enhanced Content</CardTitle>
              <Badge variant={hasLearningValue ? "default" : "outline"}>
                {[hasLearningValue, hasCommonPitfalls, hasEvidenceSources].filter(Boolean).length}/3
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Learning Value</span>
                <Badge variant={hasLearningValue ? "secondary" : "outline"} className="text-xs">
                  {hasLearningValue ? "✓" : "○"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Common Pitfalls</span>
                <Badge variant={hasCommonPitfalls ? "secondary" : "outline"} className="text-xs">
                  {hasCommonPitfalls ? "✓" : "○"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Evidence Sources</span>
                <Badge variant={hasEvidenceSources ? "secondary" : "outline"} className="text-xs">
                  {hasEvidenceSources ? "✓" : "○"}
                </Badge>
              </div>
            </div>
            {(!hasLearningValue || !hasCommonPitfalls || !hasEvidenceSources) && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleGoToEnhanced}
                className="w-full mt-3"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Complete Enhanced Fields
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Content Completeness */}
        <Card className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Completeness</CardTitle>
              <Badge variant="secondary">
                {Math.round((
                  [
                    !!knowledgeItemData.name,
                    !!knowledgeItemData.description,
                    !!knowledgeItemData.background,
                    !!knowledgeItemData.author,
                    hasLearningValue,
                    useCaseCount > 0
                  ].filter(Boolean).length / 6
                ) * 100)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-xs">
              <div className={`flex justify-between ${knowledgeItemData.name ? 'text-green-600' : 'text-muted-foreground'}`}>
                <span>Title</span>
                <span>{knowledgeItemData.name ? '✓' : '○'}</span>
              </div>
              <div className={`flex justify-between ${knowledgeItemData.description ? 'text-green-600' : 'text-muted-foreground'}`}>
                <span>Description</span>
                <span>{knowledgeItemData.description ? '✓' : '○'}</span>
              </div>
              <div className={`flex justify-between ${knowledgeItemData.background ? 'text-green-600' : 'text-muted-foreground'}`}>
                <span>Background</span>
                <span>{knowledgeItemData.background ? '✓' : '○'}</span>
              </div>
              <div className={`flex justify-between ${knowledgeItemData.author ? 'text-green-600' : 'text-muted-foreground'}`}>
                <span>Author</span>
                <span>{knowledgeItemData.author ? '✓' : '○'}</span>
              </div>
              <div className={`flex justify-between ${hasLearningValue ? 'text-green-600' : 'text-muted-foreground'}`}>
                <span>Learning Value</span>
                <span>{hasLearningValue ? '✓' : '○'}</span>
              </div>
              <div className={`flex justify-between ${useCaseCount > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                <span>Use Cases</span>
                <span>{useCaseCount > 0 ? '✓' : '○'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Original Analytics Component */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detailed Analytics</CardTitle>
          <CardDescription>
            In-depth performance metrics and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KnowledgeItemAnalytics knowledgeItem={knowledgeItemData} />
        </CardContent>
      </Card>
    </div>
  );
};