import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Target, Calendar, MapPin, Lightbulb, Cog, DollarSign, FileText, Briefcase } from "lucide-react";
import type { KnowledgeItem } from "@/hooks/useKnowledgeItems";

interface W5HSectionProps {
  item: KnowledgeItem;
}

export const W5HSection = ({ item }: W5HSectionProps) => {
  const hasGenericData = item.generic_who || item.generic_what || item.generic_when || item.generic_where || item.generic_why || item.generic_how;
  const hasExampleData = item.example_who || item.example_what || item.example_when || item.example_where || item.example_why || item.example_how;

  if (!hasGenericData && !hasExampleData) {
    return null;
  }

  const W5HItem = ({ 
    icon: Icon, 
    label, 
    genericValue, 
    exampleValue, 
    color = "text-primary" 
  }: { 
    icon: any; 
    label: string; 
    genericValue?: string; 
    exampleValue?: string; 
    color?: string;
  }) => {
    if (!genericValue && !exampleValue) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <h4 className="font-semibold text-sm">{label}</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {genericValue && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-xs font-medium text-muted-foreground mb-1">Generic Approach</div>
              <div className="text-sm">{genericValue}</div>
            </div>
          )}
          {exampleValue && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
              <div className="text-xs font-medium text-primary mb-1">Real Example</div>
              <div className="text-sm">{exampleValue}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          W5H Framework Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comparison">Compare</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 mt-6">
            <W5HItem
              icon={Users}
              label="Who"
              genericValue={item.generic_who}
              exampleValue={item.example_who}
              color="text-blue-600"
            />
            
            <W5HItem
              icon={Target}
              label="What"
              genericValue={item.generic_what}
              exampleValue={item.example_what}
              color="text-green-600"
            />
            
            <W5HItem
              icon={Lightbulb}
              label="Why"
              genericValue={item.generic_why}
              exampleValue={item.example_why}
              color="text-yellow-600"
            />
          </TabsContent>
          
          <TabsContent value="details" className="space-y-6 mt-6">
            <W5HItem
              icon={Calendar}
              label="When"
              genericValue={item.generic_when}
              exampleValue={item.example_when}
              color="text-purple-600"
            />
            
            <W5HItem
              icon={MapPin}
              label="Where"
              genericValue={item.generic_where}
              exampleValue={item.example_where}
              color="text-red-600"
            />
            
            <W5HItem
              icon={Cog}
              label="How"
              genericValue={item.generic_how}
              exampleValue={item.example_how}
              color="text-indigo-600"
            />
            
            <W5HItem
              icon={DollarSign}
              label="How Much"
              genericValue={item.generic_how_much}
              exampleValue={item.example_how_much}
              color="text-emerald-600"
            />
          </TabsContent>
          
          <TabsContent value="comparison" className="space-y-6 mt-6">
            {(item.generic_summary || item.example_summary) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {item.generic_summary && (
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Generic Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{item.generic_summary}</p>
                    </CardContent>
                  </Card>
                )}
                
                {item.example_summary && (
                  <Card className="bg-primary/5 border-primary/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        Example Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{item.example_summary}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
            {item.example_use_case && (
              <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Use Case Example
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{item.example_use_case}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};