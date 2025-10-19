import React, { useState } from 'react';
import { UserStory } from '@/hooks/useUserStories';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DefinitionChecklistCard } from './DefinitionChecklistCard';
import { ConfidenceLevelBadge } from './ConfidenceLevelBadge';
import { 
  User, 
  Target, 
  DollarSign, 
  AlertTriangle, 
  Code, 
  Palette,
  Link as LinkIcon,
  Shield,
  Tag,
  Calendar,
  MapPin
} from 'lucide-react';

interface StoryMetadataPanelProps {
  story: UserStory;
  onUpdate?: (updates: Partial<UserStory>) => void;
  readonly?: boolean;
}

export function StoryMetadataPanel({ story, onUpdate, readonly = false }: StoryMetadataPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const handleDoRToggle = (index: number) => {
    if (readonly || !onUpdate || !story.definition_of_ready) return;
    
    const items = [...story.definition_of_ready.items];
    items[index] = { ...items[index], checked: !items[index].checked };
    
    onUpdate({
      definition_of_ready: { items }
    });
  };

  const handleDoDToggle = (index: number) => {
    if (readonly || !onUpdate || !story.definition_of_done) return;
    
    const items = [...story.definition_of_done.items];
    items[index] = { ...items[index], checked: !items[index].checked };
    
    onUpdate({
      definition_of_done: { items }
    });
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Core Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {story.user_persona && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>User Persona</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">{story.user_persona}</p>
                </div>
              )}

              {story.problem_statement && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span>Problem Statement</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">{story.problem_statement}</p>
                </div>
              )}

              {story.business_value && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>Business Value</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">{story.business_value}</p>
                </div>
              )}

              {story.customer_journey_stage && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Customer Journey Stage</span>
                  </div>
                  <Badge variant="secondary">{story.customer_journey_stage}</Badge>
                </div>
              )}

              {story.confidence_level && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>Confidence Level</span>
                  </div>
                  <div className="ml-6">
                    <ConfidenceLevelBadge level={story.confidence_level} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {story.tags && story.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {story.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {story.assumptions_risks && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Assumptions & Risks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {story.assumptions_risks}
                </p>
              </CardContent>
            </Card>
          )}

          {story.dependencies && story.dependencies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Dependencies</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {story.dependencies.map((dep, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{dep}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {story.non_functional_requirements && story.non_functional_requirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Non-Functional Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {story.non_functional_requirements.map((req, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {story.evidence_links && story.evidence_links.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Evidence & Research Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {story.evidence_links.map((link, index) => (
                    <li key={index}>
                      <a 
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Readiness Tab */}
        <TabsContent value="readiness" className="space-y-4">
          {story.definition_of_ready && (
            <DefinitionChecklistCard
              title="Definition of Ready"
              description="Criteria that must be met before work begins"
              items={story.definition_of_ready.items}
              onToggle={handleDoRToggle}
              readonly={readonly}
            />
          )}

          {story.definition_of_done && (
            <DefinitionChecklistCard
              title="Definition of Done"
              description="Criteria that must be met for story completion"
              items={story.definition_of_done.items}
              onToggle={handleDoDToggle}
              readonly={readonly}
            />
          )}
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical" className="space-y-4">
          {story.technical_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Technical Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                  {story.technical_notes}
                </p>
              </CardContent>
            </Card>
          )}

          {story.design_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Design Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {story.design_notes}
                </p>
              </CardContent>
            </Card>
          )}

          {story.ui_mockup_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">UI Mockup</CardTitle>
              </CardHeader>
              <CardContent>
                <a 
                  href={story.ui_mockup_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View Mockup →
                </a>
              </CardContent>
            </Card>
          )}

          {story.sprint && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Sprint Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">{story.sprint}</Badge>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
