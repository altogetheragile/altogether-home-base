import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KnowledgeItemAnalytics } from "../KnowledgeItemAnalytics";
import { useFormContext } from "react-hook-form";

export const AnalyticsSection = () => {
  const form = useFormContext();
  const knowledgeItemData = form.watch();

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pb-4">
        <CardTitle className="text-xl font-semibold">Analytics & Insights</CardTitle>
        <CardDescription>
          View performance metrics, content analysis, and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <KnowledgeItemAnalytics knowledgeItem={knowledgeItemData} />
      </CardContent>
    </Card>
  );
};