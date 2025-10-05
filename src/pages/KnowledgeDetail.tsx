import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { ArrowLeft, FileText, Download, Image as ImageIcon, Video, BookOpen, ExternalLink, Calendar, ImagePlus, Settings } from "lucide-react";
import { format } from "date-fns";
import FormattedTextDisplay from "@/components/common/FormattedTextDisplay";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { useUserRole } from "@/hooks/useUserRole";

const KnowledgeDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: item, isLoading, error } = useKnowledgeItemBySlug(slug!);
  const { data: useCases } = useKnowledgeUseCases(item?.id);
  const { data: templates } = useKnowledgeItemTemplates(item?.id || '');
  const { data: mediaAssets } = useKnowledgeItemUnifiedAssets(item?.id);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { data: userRole } = useUserRole();
  const isAdmin = userRole === 'admin';

  const imageAssets = (mediaAssets || []).filter((asset: any) => asset.type === 'image');

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
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
      
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/20">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumb>
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
          </div>
        </div>

        {/* Header */}
        <div className="border-b bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-3xl font-bold flex-1">{item.name}</h1>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex items-center gap-2"
                >
                  <Link to={`/admin/knowledge/items/edit/${item.id}`}>
                    <Settings className="h-4 w-4" />
                    Manage Images
                  </Link>
                </Button>
              )}
            </div>
            
            {item.description && (
              <p className="text-muted-foreground mb-6 max-w-4xl leading-relaxed">
                {item.description}
              </p>
            )}

            {/* Classification Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {item.knowledge_categories && (
                <Badge 
                  variant="outline" 
                  className="py-1.5 px-3"
                  style={{ 
                    backgroundColor: item.knowledge_categories.color + '15',
                    borderColor: item.knowledge_categories.color + '40',
                    color: item.knowledge_categories.color
                  }}
                >
                  Strategy & Direction
                </Badge>
              )}
              {item.planning_focuses && (
                <Badge 
                  variant="outline"
                  className="py-1.5 px-3"
                  style={{ 
                    backgroundColor: item.planning_focuses.color + '15',
                    borderColor: item.planning_focuses.color + '40',
                    color: item.planning_focuses.color
                  }}
                >
                  Strategy & Vision
                </Badge>
              )}
              {item.activity_domains && (
                <Badge 
                  variant="outline"
                  className="py-1.5 px-3"
                  style={{ 
                    backgroundColor: item.activity_domains.color + '15',
                    borderColor: item.activity_domains.color + '40',
                    color: item.activity_domains.color
                  }}
                >
                  Value Ownership
                </Badge>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                Last updated: {format(new Date(item.updated_at), 'MMMM d, yyyy')}
              </span>
              {item.source && (
                <span className="flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Source: {item.source}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-8">
              <Tabs defaultValue="background" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                  <TabsTrigger 
                    value="background" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Background
                  </TabsTrigger>
                  <TabsTrigger 
                    value="use-cases"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Use Cases
                  </TabsTrigger>
                  <TabsTrigger 
                    value="images"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Images
                    {imageAssets.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {imageAssets.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Background Tab */}
                <TabsContent value="background" className="mt-6">
                  {item.background ? (
                    <FormattedTextDisplay text={item.background} />
                  ) : (
                    <p className="text-muted-foreground">No background information available.</p>
                  )}
                </TabsContent>

                {/* Use Cases Tab */}
                <TabsContent value="use-cases" className="mt-6">
                  {useCases && useCases.length > 0 ? (
                    <div className="space-y-4">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-1">Use Cases & Applications</h3>
                        <p className="text-sm text-muted-foreground">Real-world applications and practical examples</p>
                      </div>
                      {useCases.map((useCase) => (
                        <div key={useCase.id} className="border rounded-lg p-6 space-y-4 bg-muted/20">
                          {useCase.title && (
                            <h4 className="text-base font-semibold">{useCase.title}</h4>
                          )}
                          
                          {useCase.summary && (
                            <p className="text-muted-foreground">{useCase.summary}</p>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {useCase.what && (
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                                  What
                                </div>
                                <div className="text-xs text-muted-foreground italic mb-1">
                                  {useCase.case_type === 'example' 
                                    ? 'What is it about?' 
                                    : 'Is the core activity or technique being used?'}
                                </div>
                                <p className="text-sm">{useCase.what}</p>
                              </div>
                            )}

                            {useCase.why && (
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                                  Why
                                </div>
                                <div className="text-xs text-muted-foreground italic mb-1">
                                  {useCase.case_type === 'example'
                                    ? 'Why is this approach used?'
                                    : 'Is this approach used? What problem does it solve?'}
                                </div>
                                <p className="text-sm">{useCase.why}</p>
                              </div>
                            )}

                            {useCase.where_used && (
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                                  Where
                                </div>
                                <div className="text-xs text-muted-foreground italic mb-1">
                                  {useCase.case_type === 'example'
                                    ? 'Is this located or in what context?'
                                    : 'Should this be applied? In what context or environment?'}
                                </div>
                                <p className="text-sm">{useCase.where_used}</p>
                              </div>
                            )}

                            {useCase.when_used && (
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                                  When
                                </div>
                                <div className="text-xs text-muted-foreground italic mb-1">
                                  {useCase.case_type === 'example'
                                    ? 'Did this occur or at what stage?'
                                    : 'Should this be used? At what stage or timing?'}
                                </div>
                                <p className="text-sm">{useCase.when_used}</p>
                              </div>
                            )}

                            {useCase.who && (
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                                  Who
                                </div>
                                <div className="text-xs text-muted-foreground italic mb-1">
                                  {useCase.case_type === 'example'
                                    ? 'Is involved or affected?'
                                    : 'Should be involved? What roles or stakeholders?'}
                                </div>
                                <p className="text-sm">{useCase.who}</p>
                              </div>
                            )}

                            {useCase.how && (
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                                  How
                                </div>
                                <div className="text-xs text-muted-foreground italic mb-1">
                                  {useCase.case_type === 'example'
                                    ? 'Was this implemented or executed?'
                                    : 'Should this be implemented? What are the key steps or processes?'}
                                </div>
                                <p className="text-sm">{useCase.how}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No use cases available yet.</p>
                  )}
                </TabsContent>

                {/* Images Tab */}
                <TabsContent value="images" className="mt-6">
                  {imageAssets.length === 0 ? (
                    <div className="text-center py-12">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No images available for this item
                      </p>
                      {isAdmin && (
                        <Button asChild variant="default" className="flex items-center gap-2 mx-auto">
                          <Link to={`/admin/media?attachTo=${item.id}`}>
                            <ImagePlus className="h-4 w-4" />
                            Attach Images
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {imageAssets.map((asset: any, index: number) => (
                        <div 
                          key={asset.id} 
                          className="relative aspect-video rounded-lg overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openLightbox(index)}
                        >
                          <img
                            src={asset.url}
                            alt={asset.title || asset.file_name || 'Knowledge item image'}
                            className="w-full h-full object-cover"
                          />
                          {asset.title && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                              <p className="text-white text-sm font-medium">{asset.title}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <ImageLightbox
                  images={imageAssets.map((asset: any) => ({
                    url: asset.url,
                    title: asset.title,
                    description: asset.description,
                  }))}
                  currentIndex={lightboxIndex}
                  open={lightboxOpen}
                  onOpenChange={setLightboxOpen}
                  onNavigate={setLightboxIndex}
                />
              </Tabs>
            </div>

            {/* Sidebar - Takes 1 column */}
            <div className="space-y-6">
              {/* Templates & Tools - Always visible */}
              <Card className="bg-orange-50/30 border-orange-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-orange-900">
                    <FileText className="h-4 w-4 text-orange-600" />
                    Templates & Tools
                  </CardTitle>
                  <CardDescription className="text-xs text-orange-700">
                    Ready-to-use templates and practical tools
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {templates && templates.length > 0 ? (
                    templates.map((assoc: any) => (
                      <div key={assoc.id} className="space-y-3 pb-4 border-b border-orange-200 last:border-0 last:pb-0">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-orange-900 mb-1">
                              {assoc.template?.title || 'Untitled Template'}
                            </h4>
                            {assoc.template?.description && (
                              <p className="text-xs text-orange-700 line-clamp-2">
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
                    <p className="text-sm text-orange-700/70 italic">
                      No templates available yet for this knowledge item.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="container mx-auto px-4 pb-8">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Knowledge Base
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default KnowledgeDetail;
