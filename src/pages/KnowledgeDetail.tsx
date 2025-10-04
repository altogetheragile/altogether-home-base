import { useParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useKnowledgeItemBySlug } from "@/hooks/useKnowledgeItems";
import { useKnowledgeUseCases } from "@/hooks/useKnowledgeUseCases";
import { useKnowledgeItemTemplates } from "@/hooks/useKnowledgeItemTemplates";
import { useKnowledgeItemUnifiedAssets } from "@/hooks/useUnifiedAssetManager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { ArrowLeft, FileText, Download, Image as ImageIcon, Video, Lightbulb, Target, Layers, BookOpen, AlertTriangle, ExternalLink, Info } from "lucide-react";
import { format } from "date-fns";
import FormattedTextDisplay from "@/components/common/FormattedTextDisplay";

const KnowledgeDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: item, isLoading, error } = useKnowledgeItemBySlug(slug!);
  const { data: useCases } = useKnowledgeUseCases(item?.id);
  const { data: templates } = useKnowledgeItemTemplates(item?.id || '');
  const { data: mediaAssets } = useKnowledgeItemUnifiedAssets(item?.id);

  const clarificationDescriptions = {
    what: "What is the core activity or technique being used?",
    why: "Why is this approach used? What problem does it solve?",
    when: "When should this be applied? At what stage or timing?",
    where: "Where is this used? In what context or environment?",
    who: "Who is involved? What roles or stakeholders?",
    how: "How is this executed? What are the steps or process?",
    howMuch: "How much effort, time, or resources are needed?"
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-32 w-full mb-8" />
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Knowledge Item Not Found</h1>
            <p className="text-muted-foreground mb-6">The item you're looking for doesn't exist.</p>
            <Button asChild>
              <Link to="/knowledge">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Knowledge Base
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/knowledge">Knowledge Base</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{item.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hero Section */}
        <div className="mb-8 rounded-lg bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-8 border">
          <h1 className="text-4xl font-bold mb-4 text-foreground">{item.name}</h1>
          {item.description && (
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">{item.description}</p>
          )}
          
          <div className="flex flex-wrap gap-3 mb-4">
            {item.knowledge_categories && (
              <HoverCard openDelay={200}>
                <HoverCardTrigger asChild>
                  <Badge 
                    variant="secondary" 
                    className="text-base py-2 px-4 cursor-pointer hover:scale-105 transition-transform border-2"
                    style={{ 
                      backgroundColor: item.knowledge_categories.color + '20', 
                      color: item.knowledge_categories.color,
                      borderColor: item.knowledge_categories.color
                    }}
                  >
                    <Layers className="w-4 h-4 mr-2" />
                    {item.knowledge_categories.name}
                    {item.knowledge_categories.description && (
                      <Info className="w-3 h-3 ml-2 opacity-60" />
                    )}
                  </Badge>
                </HoverCardTrigger>
                {item.knowledge_categories.description && (
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Layers className="w-4 h-4" style={{ color: item.knowledge_categories.color }} />
                        {item.knowledge_categories.name}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.knowledge_categories.description}
                      </p>
                    </div>
                  </HoverCardContent>
                )}
              </HoverCard>
            )}
            {item.planning_focuses && (
              <HoverCard openDelay={200}>
                <HoverCardTrigger asChild>
                  <Badge 
                    variant="secondary" 
                    className="text-base py-2 px-4 cursor-pointer hover:scale-105 transition-transform border-2"
                    style={{ 
                      backgroundColor: item.planning_focuses.color + '20', 
                      color: item.planning_focuses.color,
                      borderColor: item.planning_focuses.color
                    }}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    {item.planning_focuses.name}
                    {item.planning_focuses.description && (
                      <Info className="w-3 h-3 ml-2 opacity-60" />
                    )}
                  </Badge>
                </HoverCardTrigger>
                {item.planning_focuses.description && (
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Target className="w-4 h-4" style={{ color: item.planning_focuses.color }} />
                        {item.planning_focuses.name}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.planning_focuses.description}
                      </p>
                    </div>
                  </HoverCardContent>
                )}
              </HoverCard>
            )}
            {item.activity_domains && (
              <HoverCard openDelay={200}>
                <HoverCardTrigger asChild>
                  <Badge 
                    variant="secondary" 
                    className="text-base py-2 px-4 cursor-pointer hover:scale-105 transition-transform border-2"
                    style={{ 
                      backgroundColor: item.activity_domains.color + '20', 
                      color: item.activity_domains.color,
                      borderColor: item.activity_domains.color
                    }}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    {item.activity_domains.name}
                    {item.activity_domains.description && (
                      <Info className="w-3 h-3 ml-2 opacity-60" />
                    )}
                  </Badge>
                </HoverCardTrigger>
                {item.activity_domains.description && (
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <BookOpen className="w-4 h-4" style={{ color: item.activity_domains.color }} />
                        {item.activity_domains.name}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.activity_domains.description}
                      </p>
                    </div>
                  </HoverCardContent>
                )}
              </HoverCard>
            )}
          </div>

          <div className="text-sm text-muted-foreground flex items-center gap-4">
            <span>Last updated: {format(new Date(item.updated_at), 'MMMM d, yyyy')}</span>
            {item.source && (
              <span className="flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                Source: {item.source}
              </span>
            )}
          </div>
        </div>

        <div className="grid xl:grid-cols-4 lg:grid-cols-3 gap-6">
          <div className="xl:col-span-3 lg:col-span-2 space-y-6">
            {/* Background Section */}
            {item.background && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    Background
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormattedTextDisplay text={item.background} />
                </CardContent>
              </Card>
            )}

            {/* Resources & Media Section */}
            {(mediaAssets && mediaAssets.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    Resources & Media
                  </CardTitle>
                  <CardDescription>Visual materials and supporting documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {mediaAssets.map((asset: any) => (
                      <Card key={asset.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                              {asset.type === 'image' && <ImageIcon className="w-5 h-5 text-primary" />}
                              {asset.type === 'video' && <Video className="w-5 h-5 text-primary" />}
                              {asset.type === 'document' && <FileText className="w-5 h-5 text-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              {asset.title && <h4 className="font-semibold mb-1 truncate">{asset.title}</h4>}
                              {asset.description && (
                                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{asset.description}</p>
                              )}
                              {asset.url && (
                                <Button variant="outline" size="sm" className="w-full" asChild>
                                  <a href={asset.url} target="_blank" rel="noopener noreferrer">
                                    <Download className="w-3 h-3 mr-2" />
                                    View/Download
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Templates & Tools Section */}
            {(templates && templates.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Templates & Tools
                  </CardTitle>
                  <CardDescription>Ready-to-use templates and practical tools</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {templates.map((assoc: any) => (
                      <Card key={assoc.id} className="overflow-hidden hover:shadow-md transition-shadow border-2">
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 p-2 rounded-lg bg-secondary/50">
                                <FileText className="w-5 h-5 text-secondary-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold mb-1 line-clamp-2">{assoc.template.title}</h4>
                                {assoc.template.category && (
                                  <Badge variant="secondary" className="text-xs mb-2">
                                    {assoc.template.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {assoc.template.description && (
                              <p className="text-xs text-muted-foreground line-clamp-3">
                                {assoc.template.description}
                              </p>
                            )}
                            {assoc.template.pdf_url && (
                              <Button variant="default" size="sm" className="w-full" asChild>
                                <a href={assoc.template.pdf_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-3 h-3 mr-2" />
                                  Download Template
                                </a>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Use Cases Section */}
            {useCases && useCases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Use Cases & Applications
                  </CardTitle>
                  <CardDescription>Real-world applications and practical examples</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {useCases.map((useCase, index) => (
                    <div key={useCase.id} className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary rounded-full" />
                      <div className="pl-6 space-y-4">
                        <div>
                          {useCase.title && (
                            <h3 className="text-lg font-semibold mb-2">{useCase.title}</h3>
                          )}
                          {useCase.summary && (
                            <p className="text-muted-foreground leading-relaxed">{useCase.summary}</p>
                          )}
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                          {useCase.what && (
                            <div className="bg-muted/30 rounded-lg p-3 border">
                              <p className="text-xs font-medium text-primary mb-1">WHAT</p>
                              <p className="text-xs italic text-muted-foreground mb-2">
                                {clarificationDescriptions.what}
                              </p>
                              <p className="text-sm">{useCase.what}</p>
                            </div>
                          )}
                          {useCase.why && (
                            <div className="bg-muted/30 rounded-lg p-3 border">
                              <p className="text-xs font-medium text-primary mb-1">WHY</p>
                              <p className="text-xs italic text-muted-foreground mb-2">
                                {clarificationDescriptions.why}
                              </p>
                              <p className="text-sm">{useCase.why}</p>
                            </div>
                          )}
                          {useCase.when_used && (
                            <div className="bg-muted/30 rounded-lg p-3 border">
                              <p className="text-xs font-medium text-primary mb-1">WHEN</p>
                              <p className="text-xs italic text-muted-foreground mb-2">
                                {clarificationDescriptions.when}
                              </p>
                              <p className="text-sm">{useCase.when_used}</p>
                            </div>
                          )}
                          {useCase.where_used && (
                            <div className="bg-muted/30 rounded-lg p-3 border">
                              <p className="text-xs font-medium text-primary mb-1">WHERE</p>
                              <p className="text-xs italic text-muted-foreground mb-2">
                                {clarificationDescriptions.where}
                              </p>
                              <p className="text-sm">{useCase.where_used}</p>
                            </div>
                          )}
                          {useCase.who && (
                            <div className="bg-muted/30 rounded-lg p-3 border">
                              <p className="text-xs font-medium text-primary mb-1">WHO</p>
                              <p className="text-xs italic text-muted-foreground mb-2">
                                {clarificationDescriptions.who}
                              </p>
                              <p className="text-sm">{useCase.who}</p>
                            </div>
                          )}
                          {useCase.how && (
                            <div className="bg-muted/30 rounded-lg p-3 border">
                              <p className="text-xs font-medium text-primary mb-1">HOW</p>
                              <p className="text-xs italic text-muted-foreground mb-2">
                                {clarificationDescriptions.how}
                              </p>
                              <p className="text-sm">{useCase.how}</p>
                            </div>
                          )}
                          {useCase.how_much && (
                            <div className="bg-muted/30 rounded-lg p-3 border">
                              <p className="text-xs font-medium text-primary mb-1">HOW MUCH</p>
                              <p className="text-xs italic text-muted-foreground mb-2">
                                {clarificationDescriptions.howMuch}
                              </p>
                              <p className="text-sm">{useCase.how_much}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {index < useCases.length - 1 && <div className="mt-6 border-b" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Learning Value */}
            {item.learning_value_summary && (
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    Learning Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.learning_value_summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Common Pitfalls */}
            {item.common_pitfalls && item.common_pitfalls.length > 0 && (
              <Card className="border-l-4 border-l-destructive">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    Common Pitfalls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.common_pitfalls.map((pitfall, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0 mt-0.5" />
                        <span>{pitfall}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Evidence Sources */}
            {item.evidence_sources && item.evidence_sources.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Evidence Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.evidence_sources.map((source, index) => (
                      <li key={index} className="text-sm text-muted-foreground leading-relaxed">
                        • {source}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Related Techniques */}
            {item.related_techniques && item.related_techniques.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Related Techniques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {item.related_techniques.map((technique, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {technique}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Key Terminology */}
            {item.key_terminology && Object.keys(item.key_terminology).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Key Terminology</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3">
                    {Object.entries(item.key_terminology).map(([term, definition]) => (
                      <div key={term} className="pb-2 border-b last:border-0 last:pb-0">
                        <dt className="font-semibold text-sm mb-1">{term}</dt>
                        <dd className="text-xs text-muted-foreground leading-relaxed">{definition as string}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <Button variant="ghost" asChild>
            <Link to="/knowledge">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Knowledge Base
            </Link>
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default KnowledgeDetail;
