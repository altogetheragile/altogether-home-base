import { useParams, Link } from "react-router-dom";
import { useKnowledgeItemBySlug } from "@/hooks/useKnowledgeItems";
import { useKnowledgeUseCases } from "@/hooks/useKnowledgeUseCases";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ArrowLeft, Eye, Calendar, Target, Lightbulb, AlertTriangle, ExternalLink, BookOpen } from "lucide-react";
import { format } from "date-fns";
import FormattedTextDisplay from "@/components/common/FormattedTextDisplay";

const KnowledgeDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: item, isLoading, error } = useKnowledgeItemBySlug(slug!);
  const { data: useCases } = useKnowledgeUseCases(item?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-96" />
            <Skeleton className="h-64 w-full" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Technique Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The technique you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/knowledge">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Knowledge Base
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
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

          {/* Header */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-wrap gap-2">
              {item.knowledge_categories && (
                <Badge variant="secondary" style={{
                  backgroundColor: `${item.knowledge_categories.color}15`,
                  color: item.knowledge_categories.color
                }}>
                  {item.knowledge_categories.name}
                </Badge>
              )}
              {item.activity_domains && (
                <Badge variant="outline" style={{
                  borderColor: item.activity_domains.color,
                  color: item.activity_domains.color
                }}>
                  {item.activity_domains.name}
                </Badge>
              )}
              {item.planning_focuses && (
                <Badge variant="outline" style={{
                  borderColor: item.planning_focuses.color,
                  color: item.planning_focuses.color
                }}>
                  {item.planning_focuses.name}
                </Badge>
              )}
              {item.is_featured && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Featured
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {item.name}
            </h1>

            {item.description && (
              <p className="text-lg text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {item.view_count > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{item.view_count} views</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Updated {format(new Date(item.updated_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Background */}
              {item.background && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Background
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormattedTextDisplay text={item.background} />
                  </CardContent>
                </Card>
              )}

              {/* Use Cases */}
              {useCases && useCases.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Use Cases
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {useCases.map((useCase, index) => (
                      <div key={useCase.id}>
                        {index > 0 && <Separator className="mb-6" />}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{useCase.case_type}</Badge>
                            {useCase.title && <span className="font-medium">{useCase.title}</span>}
                          </div>
                          
                          {useCase.summary && (
                            <p className="text-muted-foreground">{useCase.summary}</p>
                          )}

                          <div className="grid gap-3 md:grid-cols-2">
                            {useCase.what && (
                              <div>
                                <h5 className="font-medium text-sm text-foreground mb-1">What</h5>
                                <p className="text-sm text-muted-foreground">{useCase.what}</p>
                              </div>
                            )}
                            {useCase.why && (
                              <div>
                                <h5 className="font-medium text-sm text-foreground mb-1">Why</h5>
                                <p className="text-sm text-muted-foreground">{useCase.why}</p>
                              </div>
                            )}
                            {useCase.when_used && (
                              <div>
                                <h5 className="font-medium text-sm text-foreground mb-1">When</h5>
                                <p className="text-sm text-muted-foreground">{useCase.when_used}</p>
                              </div>
                            )}
                            {useCase.where_used && (
                              <div>
                                <h5 className="font-medium text-sm text-foreground mb-1">Where</h5>
                                <p className="text-sm text-muted-foreground">{useCase.where_used}</p>
                              </div>
                            )}
                            {useCase.who && (
                              <div>
                                <h5 className="font-medium text-sm text-foreground mb-1">Who</h5>
                                <p className="text-sm text-muted-foreground">{useCase.who}</p>
                              </div>
                            )}
                            {useCase.how && (
                              <div>
                                <h5 className="font-medium text-sm text-foreground mb-1">How</h5>
                                <p className="text-sm text-muted-foreground">{useCase.how}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Enhanced Info */}
              {(item.common_pitfalls?.length > 0 || item.evidence_sources?.length > 0 || 
                item.related_techniques?.length > 0 || item.learning_value_summary) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Additional Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {item.learning_value_summary && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Learning Value</h5>
                        <p className="text-sm text-muted-foreground">{item.learning_value_summary}</p>
                      </div>
                    )}

                    {item.common_pitfalls && item.common_pitfalls.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          Common Pitfalls
                        </h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {item.common_pitfalls.map((pitfall, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-destructive mt-1">•</span>
                              <span>{pitfall}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.evidence_sources && item.evidence_sources.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Evidence Sources</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {item.evidence_sources.map((source, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <ExternalLink className="h-3 w-3 mt-1" />
                              <span>{source}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.related_techniques && item.related_techniques.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Related Techniques</h5>
                        <div className="flex flex-wrap gap-1">
                          {item.related_techniques.map((technique, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {technique}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Key Terminology */}
              {item.key_terminology && Object.keys(item.key_terminology).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Key Terminology</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(item.key_terminology as Record<string, string>).map(([term, definition]) => (
                      <div key={term}>
                        <h5 className="font-medium text-sm">{term}</h5>
                        <p className="text-sm text-muted-foreground">{definition}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Source */}
              {item.source && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.source}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-12 pt-8 border-t">
            <Link to="/knowledge">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Knowledge Base
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default KnowledgeDetail;