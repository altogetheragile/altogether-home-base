import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KnowledgeItemAnalytics } from "../KnowledgeItemAnalytics";
import { useFormContext } from "react-hook-form";
import { useKnowledgeUseCases } from "@/hooks/useKnowledgeUseCases";

export const AnalyticsSection = () => {
  const form = useFormContext();
  const knowledgeItemData = form.watch();
  const knowledgeItemId = knowledgeItemData.id;
  
  // Fetch actual use cases
  const { data: useCases } = useKnowledgeUseCases(knowledgeItemId);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Analytics & Insights</h3>
        <p className="text-sm text-muted-foreground">
          View performance metrics, content analysis, and recommendations
        </p>
      </div>

      {/* Analytics Component */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detailed Analytics</CardTitle>
          <CardDescription>
            In-depth performance metrics and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KnowledgeItemAnalytics knowledgeItem={knowledgeItemData} useCases={useCases} />
        </CardContent>
      </Card>
    </div>
  );
};