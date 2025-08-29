import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Target, CheckCircle, AlertTriangle, Lightbulb, Settings, Briefcase } from "lucide-react";
import type { KnowledgeItem } from "@/hooks/useKnowledgeItems";

interface PracticalDetailsSectionProps {
  item: KnowledgeItem;
}

export const PracticalDetailsSection = ({ item }: PracticalDetailsSectionProps) => {
  const DetailCard = ({ 
    title, 
    icon: Icon, 
    items, 
    color = "text-primary",
    bgColor = "bg-primary/5",
    borderColor = "border-primary/20"
  }: { 
    title: string; 
    icon: any; 
    items?: string[]; 
    color?: string;
    bgColor?: string;
    borderColor?: string;
  }) => {
    if (!items || items.length === 0) return null;
    
    return (
      <Card className={`${bgColor} ${borderColor} border`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className={`h-4 w-4 ${color}`} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <Badge key={index} variant="secondary" className="text-xs bg-background/50">
                {item}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const InfoCard = ({ 
    title, 
    icon: Icon, 
    content, 
    color = "text-primary" 
  }: { 
    title: string; 
    icon: any; 
    content: string; 
    color?: string;
  }) => (
    <Card className="bg-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`h-4 w-4 ${color}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed">{content}</p>
      </CardContent>
    </Card>
  );

  const hasMetadata = item.typical_participants || 
                     item.required_skills || 
                     item.success_criteria || 
                     item.common_pitfalls || 
                     item.related_practices ||
                     item.team_size_min ||
                     item.duration_min_minutes ||
                     item.planning_considerations ||
                     item.industry_context;

  if (!hasMetadata) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-secondary/10 to-muted/20">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Practical Details
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Everything you need to know to implement this technique successfully
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Team & Time Requirements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(item.team_size_min || item.team_size_max) && (
            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-sm">Team Size</span>
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {item.team_size_min === item.team_size_max 
                    ? `${item.team_size_min}`
                    : `${item.team_size_min || 1}-${item.team_size_max || "∞"}`
                  }
                </div>
                <div className="text-xs text-blue-600/80">people</div>
              </CardContent>
            </Card>
          )}
          
          {(item.duration_min_minutes || item.duration_max_minutes) && (
            <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-sm">Duration</span>
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {item.duration_min_minutes === item.duration_max_minutes
                    ? `${item.duration_min_minutes}`
                    : `${item.duration_min_minutes || 15}-${item.duration_max_minutes || "∞"}`
                  }
                </div>
                <div className="text-xs text-green-600/80">minutes</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* People & Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailCard
            title="Who Should Participate"
            icon={Users}
            items={item.typical_participants}
            color="text-blue-600"
            bgColor="bg-blue-50 dark:bg-blue-950/20"
            borderColor="border-blue-200 dark:border-blue-800/30"
          />
          
          <DetailCard
            title="Skills Needed"
            icon={Target}
            items={item.required_skills}
            color="text-purple-600"
            bgColor="bg-purple-50 dark:bg-purple-950/20"
            borderColor="border-purple-200 dark:border-purple-800/30"
          />
        </div>

        {/* Success & Challenges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailCard
            title="Success Indicators"
            icon={CheckCircle}
            items={item.success_criteria}
            color="text-green-600"
            bgColor="bg-green-50 dark:bg-green-950/20"
            borderColor="border-green-200 dark:border-green-800/30"
          />
          
          <DetailCard
            title="Common Challenges"
            icon={AlertTriangle}
            items={item.common_pitfalls}
            color="text-red-600"
            bgColor="bg-red-50 dark:bg-red-950/20"
            borderColor="border-red-200 dark:border-red-800/30"
          />
        </div>

        {/* Related Practices */}
        {item.related_practices && item.related_practices.length > 0 && (
          <DetailCard
            title="Works Well With"
            icon={Briefcase}
            items={item.related_practices}
            color="text-indigo-600"
            bgColor="bg-indigo-50 dark:bg-indigo-950/20"
            borderColor="border-indigo-200 dark:border-indigo-800/30"
          />
        )}

        {/* Planning & Context */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {item.planning_considerations && (
            <InfoCard
              title="Planning Tips"
              icon={Lightbulb}
              content={item.planning_considerations}
              color="text-amber-600"
            />
          )}

          {item.industry_context && (
            <InfoCard
              title="Industry Context"
              icon={Briefcase}
              content={item.industry_context}
              color="text-teal-600"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};