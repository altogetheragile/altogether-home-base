import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Target, Calendar, MapPin, Lightbulb, Cog, DollarSign, Sparkles, Building } from "lucide-react";
import type { KnowledgeItem } from "@/hooks/useKnowledgeItems";

interface AtAGlanceSectionProps {
  item: KnowledgeItem;
}

export const AtAGlanceSection = ({ item }: AtAGlanceSectionProps) => {
  const hasGenericData = item.generic_who || item.generic_what || item.generic_when || item.generic_where || item.generic_why || item.generic_how;
  const hasExampleData = item.example_who || item.example_what || item.example_when || item.example_where || item.example_why || item.example_how;

  if (!hasGenericData && !hasExampleData) {
    return null;
  }

  const KeyInsightCard = ({ 
    icon: Icon, 
    title, 
    genericValue, 
    exampleValue, 
    iconColor = "text-primary" 
  }: { 
    icon: any; 
    title: string; 
    genericValue?: string; 
    exampleValue?: string; 
    iconColor?: string;
  }) => {
    if (!genericValue && !exampleValue) return null;
    
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className={`h-4 w-4 ${iconColor}`} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {genericValue && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs font-medium text-muted-foreground mb-1">In General</div>
              <div className="text-sm leading-relaxed">{genericValue}</div>
            </div>
          )}
          {exampleValue && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="text-xs font-medium text-primary mb-1">In Practice</div>
              <div className="text-sm leading-relaxed">{exampleValue}</div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          At a Glance
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Essential information about this technique - from theory to practice
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="essentials" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="essentials">Essentials</TabsTrigger>
            <TabsTrigger value="context">Context</TabsTrigger>
            <TabsTrigger value="application">Application</TabsTrigger>
          </TabsList>
          
          <TabsContent value="essentials" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <KeyInsightCard
                icon={Users}
                title="Who Uses This"
                genericValue={item.generic_who}
                exampleValue={item.example_who}
                iconColor="text-blue-600"
              />
              
              <KeyInsightCard
                icon={Target}
                title="What It Does"
                genericValue={item.generic_what}
                exampleValue={item.example_what}
                iconColor="text-green-600"
              />
              
              <KeyInsightCard
                icon={Lightbulb}
                title="Why Use It"
                genericValue={item.generic_why}
                exampleValue={item.example_why}
                iconColor="text-amber-600"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="context" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KeyInsightCard
                icon={Calendar}
                title="When to Use"
                genericValue={item.generic_when}
                exampleValue={item.example_when}
                iconColor="text-purple-600"
              />
              
              <KeyInsightCard
                icon={MapPin}
                title="Where It Works"
                genericValue={item.generic_where}
                exampleValue={item.example_where}
                iconColor="text-red-600"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="application" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KeyInsightCard
                icon={Cog}
                title="How It Works"
                genericValue={item.generic_how}
                exampleValue={item.example_how}
                iconColor="text-indigo-600"
              />
              
              {(item.generic_how_much || item.example_how_much) && (
                <KeyInsightCard
                  icon={DollarSign}
                  title="Investment Required"
                  genericValue={item.generic_how_much}
                  exampleValue={item.example_how_much}
                  iconColor="text-emerald-600"
                />
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Summary Comparison */}
        {(item.generic_summary || item.example_summary || item.example_use_case) && (
          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              Real-World Insights
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {item.example_summary && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="text-xs font-medium text-primary mb-2">Success Story</div>
                    <p className="text-sm leading-relaxed">{item.example_summary}</p>
                  </CardContent>
                </Card>
              )}
              
              {item.example_use_case && (
                <Card className="bg-secondary/20 border-secondary/30">
                  <CardContent className="p-4">
                    <div className="text-xs font-medium text-secondary-foreground mb-2">Use Case</div>
                    <p className="text-sm leading-relaxed">{item.example_use_case}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};