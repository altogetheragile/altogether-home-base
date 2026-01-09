import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, ListOrdered, FileText, Image as ImageIcon, 
  MessageCircle, Link2, Download
} from 'lucide-react';
import type { KnowledgeItem } from '@/hooks/useKnowledgeItems';
import {
  DecisionSummaryCard,
  UseCaseGuidanceCard,
  ItemHero,
  HowItWorksAtAGlance,
  TwoUpCards,
  AccordionSections,
  ItemMetaCard,
} from './read-view';

interface KnowledgeReadViewProps {
  item: KnowledgeItem;
  steps?: Array<{ id: string; title: string; description?: string }>;
  relatedItems?: Array<{ id: string; name: string; slug: string }>;
  useCases?: Array<{
    id: string;
    title?: string;
    summary?: string;
    what?: string;
    why?: string;
    when_used?: string;
    who?: string;
    how?: string;
  }>;
  templates?: Array<{
    id: string;
    template?: {
      title?: string;
      description?: string;
      pdf_url?: string;
    };
  }>;
  mediaAssets?: Array<{
    id: string;
    type: string;
    url: string;
    title?: string;
    description?: string;
  }>;
  commentCount?: number;
  onImageClick?: (index: number) => void;
}

export const KnowledgeReadView: React.FC<KnowledgeReadViewProps> = ({ 
  item, 
  steps,
  relatedItems,
  useCases,
  templates,
  mediaAssets,
  commentCount = 0,
  onImageClick
}) => {
  // Type-safe access to extended fields
  const itemData = item as KnowledgeItem & {
    item_type?: string;
    use_this_when?: string[];
    avoid_when?: string[];
    decisions_supported?: string[];
    what_good_looks_like?: string[];
    typical_output?: string;
    related_techniques?: string[];
    common_pitfalls?: string[];
    inspect_adapt_signals?: string[];
    maturity_indicators?: string[];
  };

  const filteredMediaAssets = (mediaAssets || []).filter(a => a.type !== 'template');
  const imageAssets = filteredMediaAssets.filter(a => a.type === 'image');

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <ItemHero item={item} />

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column (2/3 on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sticky Decision Summary Card */}
          <DecisionSummaryCard item={item} className="lg:sticky lg:top-4 z-10" />

          {/* Tabbed Content */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent flex-wrap">
              <TabsTrigger 
                value="overview" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="how-to"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                <ListOrdered className="mr-2 h-4 w-4" />
                How-To
                {steps && steps.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {steps.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="templates"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                <FileText className="mr-2 h-4 w-4" />
                Templates
                {templates && templates.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {templates.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="media"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Media
                {filteredMediaAssets.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {filteredMediaAssets.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="related"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Related
              </TabsTrigger>
              <TabsTrigger 
                value="comments"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Comments
                {commentCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {commentCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab - Use case guidance first! */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              <UseCaseGuidanceCard
                useThisWhen={itemData.use_this_when}
                avoidWhen={itemData.avoid_when}
                outcomes={itemData.what_good_looks_like}
              />

              <TwoUpCards
                decisionsSupported={itemData.decisions_supported}
                outputs={itemData.what_good_looks_like}
              />

              <HowItWorksAtAGlance
                steps={steps}
                typicalOutput={itemData.typical_output}
              />

              <AccordionSections
                background={item.background}
                commonPitfalls={itemData.common_pitfalls}
                inspectAdaptSignals={itemData.inspect_adapt_signals}
                maturityIndicators={itemData.maturity_indicators}
                relatedTechniques={itemData.related_techniques}
              />
            </TabsContent>

            {/* How-To Tab - Detailed steps */}
            <TabsContent value="how-to" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Step-by-step Guide</CardTitle>
                  <CardDescription>Detailed instructions, examples, and facilitation tips.</CardDescription>
                </CardHeader>
                <CardContent>
                  {steps && steps.length > 0 ? (
                    <div className="space-y-6">
                      {steps.map((step, index) => (
                        <div key={step.id} className="flex gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                            {index + 1}
                          </div>
                          <div className="flex-1 pt-1">
                            <h4 className="font-semibold text-lg mb-2">{step.title}</h4>
                            {step.description && (
                              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No step-by-step instructions available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="mt-6">
              <Card className="bg-orange-50/30 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-orange-900 dark:text-orange-300">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Templates & Tools
                  </CardTitle>
                  <CardDescription className="text-orange-700 dark:text-orange-400">
                    Ready-to-use templates and practical tools.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {templates && templates.length > 0 ? (
                    templates.map((assoc) => (
                      <div key={assoc.id} className="space-y-3 pb-4 border-b border-orange-200 dark:border-orange-800 last:border-0 last:pb-0">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-orange-900 dark:text-orange-300 mb-1">
                              {assoc.template?.title || 'Untitled Template'}
                            </h4>
                            {assoc.template?.description && (
                              <p className="text-xs text-orange-700 dark:text-orange-400 line-clamp-2">
                                {assoc.template.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {assoc.template?.pdf_url && (
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            asChild
                          >
                            <a 
                              href={assoc.template.pdf_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Download className="mr-2 h-3 w-3" />
                              Download Template
                            </a>
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-orange-700/70 italic text-center py-4">
                      No templates available yet for this knowledge item.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Media</CardTitle>
                  <CardDescription>Images, videos, and example canvases.</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredMediaAssets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredMediaAssets.map((asset, index) => (
                        <div 
                          key={asset.id} 
                          className="relative aspect-video rounded-lg overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => asset.type === 'image' && onImageClick?.(
                            imageAssets.findIndex(img => img.id === asset.id)
                          )}
                        >
                          {asset.type === 'image' ? (
                            <img
                              src={asset.url}
                              alt={asset.title || 'Knowledge item media'}
                              className="w-full h-full object-cover"
                            />
                          ) : asset.type === 'video' ? (
                            <video
                              src={asset.url}
                              className="w-full h-full object-cover"
                              controls
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-muted">
                              <FileText className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          {asset.title && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                              <p className="text-white text-sm font-medium">{asset.title}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No media available for this item.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Related Tab */}
            <TabsContent value="related" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Items</CardTitle>
                  <CardDescription>Common pairings and next steps.</CardDescription>
                </CardHeader>
                <CardContent>
                  {relatedItems && relatedItems.length > 0 ? (
                    <div className="grid gap-3">
                      {relatedItems.map((related) => (
                        <Link
                          key={related.id}
                          to={`/knowledge/${related.slug}`}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <Link2 className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="font-medium">{related.name}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No related items linked yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Use Cases if present */}
              {useCases && useCases.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Use Cases</CardTitle>
                    <CardDescription>Practical applications and examples.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {useCases.map((useCase) => (
                      <div key={useCase.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                        {useCase.title && (
                          <h4 className="font-semibold">{useCase.title}</h4>
                        )}
                        {useCase.summary && (
                          <p className="text-sm text-muted-foreground">{useCase.summary}</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {useCase.what && (
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-primary uppercase tracking-wider">What</div>
                              <p className="text-sm">{useCase.what}</p>
                            </div>
                          )}
                          {useCase.why && (
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-primary uppercase tracking-wider">Why</div>
                              <p className="text-sm">{useCase.why}</p>
                            </div>
                          )}
                          {useCase.when_used && (
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-primary uppercase tracking-wider">When</div>
                              <p className="text-sm">{useCase.when_used}</p>
                            </div>
                          )}
                          {useCase.who && (
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-primary uppercase tracking-wider">Who</div>
                              <p className="text-sm">{useCase.who}</p>
                            </div>
                          )}
                          {useCase.how && (
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-primary uppercase tracking-wider">How</div>
                              <p className="text-sm">{useCase.how}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Comments Tab - placeholder, actual comments managed by parent */}
            <TabsContent value="comments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Discussion</CardTitle>
                  <CardDescription>Comments and improvements.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Comments are displayed below.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Side Column (1/3 on desktop) */}
        <div className="space-y-4">
          {/* Templates Quick Access (duplicated for sidebar visibility) */}
          {templates && templates.length > 0 && (
            <Card className="bg-orange-50/30 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-orange-900 dark:text-orange-300">
                  <FileText className="h-4 w-4 text-orange-600" />
                  Templates & Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {templates.slice(0, 2).map((assoc) => (
                  <div key={assoc.id} className="space-y-2">
                    <h4 className="font-medium text-sm text-orange-900 dark:text-orange-300">
                      {assoc.template?.title || 'Template'}
                    </h4>
                    {assoc.template?.pdf_url && (
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full bg-orange-600 hover:bg-orange-700"
                        asChild
                      >
                        <a 
                          href={assoc.template.pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Download className="mr-2 h-3 w-3" />
                          Download
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
                {templates.length > 2 && (
                  <p className="text-xs text-orange-700/70 text-center">
                    + {templates.length - 2} more templates
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata Card */}
          <ItemMetaCard
            updatedAt={item.updated_at}
            source={item.source}
            viewCount={item.view_count}
          />
        </div>
      </div>
    </div>
  );
};
