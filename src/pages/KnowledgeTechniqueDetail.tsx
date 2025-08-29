import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Play, FileText, Image, ChevronLeft, ChevronRight, Download, Maximize2, Sparkles, BookOpen } from "lucide-react";
import { useKnowledgeItemBySlug } from "@/hooks/useKnowledgeItems";
import { AtAGlanceSection } from "@/components/knowledge/AtAGlanceSection";
import { PracticalDetailsSection } from "@/components/knowledge/PracticalDetailsSection";
import { EnhancedTechniqueHeader } from "@/components/knowledge/EnhancedTechniqueHeader";
import { EnhancedRelatedTechniques } from "@/components/knowledge/EnhancedRelatedTechniques";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import Navigation from "@/components/Navigation";
import { FeedbackWidget } from "@/components/knowledge/FeedbackWidget";
import { CommentsSection } from "@/components/knowledge/CommentsSection";
import BMCGeneratorDialog from "@/components/bmc/BMCGeneratorDialog";
import { useState } from "react";
import { useViewTracking } from "@/hooks/useViewTracking";

const KnowledgeTechniqueDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: technique, isLoading, error } = useKnowledgeItemBySlug(slug!);
  
  // Track view when technique is loaded
  useViewTracking(technique?.id || '');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [imageSize, setImageSize] = useState([600]); // Default image height in pixels

  // Filter media to get images and videos
  const mediaItems = technique?.knowledge_media?.filter(media => 
    media.type === 'image' || media.type === 'video'
  ) || [];

  const currentMedia = mediaItems[currentMediaIndex];

  const nextMedia = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-2/3 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full mb-6" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !technique) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Technique Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The technique you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/knowledge">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Knowledge Base
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const renderMediaItem = (media: any) => {
    const iconMap = {
      image: Image,
      video: Play,
      document: FileText,
      embed: ExternalLink
    };
    
    const Icon = iconMap[media.type as keyof typeof iconMap] || FileText;
    
    return (
      <Card key={media.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <h4 className="font-medium">{media.title || `${media.type} attachment`}</h4>
              {media.description && (
                <p className="text-sm text-muted-foreground">{media.description}</p>
              )}
            </div>
            <Button size="sm" variant="outline" asChild>
              <a href={media.url} target="_blank" rel="noopener noreferrer">
                View
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Breadcrumb */}
      <div className="border-b bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10">
            <Link to="/knowledge">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Knowledge Base
            </Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Enhanced Header */}
          <EnhancedTechniqueHeader item={technique} />

          {/* AI Generator for Business Model Canvas */}
          {technique.slug === 'business-model-canvas' && (
            <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  AI Business Model Canvas Generator
                </CardTitle>
                <CardDescription className="text-base">
                  Generate a customized Business Model Canvas for your company using AI. 
                  Simply provide some basic information and get a complete BMC tailored to your business.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BMCGeneratorDialog />
              </CardContent>
            </Card>
          )}

          {/* Media Gallery */}
          {mediaItems.length > 0 && (
              <div className="mb-8">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Media Gallery</h3>
                    <div className="flex items-center gap-3">
                      {currentMedia?.type === 'image' && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Size:</span>
                          <Slider
                            value={imageSize}
                            onValueChange={setImageSize}
                            max={800}
                            min={300}
                            step={50}
                            className="w-20"
                          />
                          <span className="w-12 text-xs">{imageSize[0]}px</span>
                        </div>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Maximize2 className="h-4 w-4 mr-1" />
                            Fullscreen
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-screen-lg w-full h-[90vh] p-2">
                          <div className="w-full h-full flex items-center justify-center">
                            {currentMedia?.type === 'image' ? (
                              <img 
                                src={currentMedia.url} 
                                alt={currentMedia.title || technique.name}
                                className="max-w-full max-h-full object-contain rounded-lg"
                              />
                            ) : currentMedia?.type === 'video' ? (
                              <div className="w-full h-full rounded-lg overflow-hidden">
                                {currentMedia.url.includes('youtube.com') || currentMedia.url.includes('youtu.be') ? (
                                  <iframe
                                    src={currentMedia.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                ) : (
                                  <video 
                                    controls 
                                    className="w-full h-full"
                                    poster={currentMedia.thumbnail_url}
                                  >
                                    <source src={currentMedia.url} />
                                    Your browser does not support the video tag.
                                  </video>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </DialogContent>
                      </Dialog>
                      {currentMedia && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={currentMedia.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="relative w-full">
                    {currentMedia?.type === 'image' ? (
                      <div className="flex justify-center">
                        <img 
                          src={currentMedia.url} 
                          alt={currentMedia.title || technique.name}
                          style={{ height: `${imageSize[0]}px` }}
                          className="w-auto max-w-full rounded-lg shadow-lg object-contain border"
                        />
                      </div>
                    ) : currentMedia?.type === 'video' ? (
                      <div className="relative w-full rounded-lg overflow-hidden shadow-lg">
                        {currentMedia.url.includes('youtube.com') || currentMedia.url.includes('youtu.be') ? (
                          <iframe
                            src={currentMedia.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                            className="w-full aspect-video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video 
                            controls 
                            className="w-full max-h-[600px]"
                            poster={currentMedia.thumbnail_url}
                          >
                            <source src={currentMedia.url} />
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </div>
                    ) : null}
                    
                    {/* Navigation arrows */}
                    {mediaItems.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm shadow-lg"
                          onClick={prevMedia}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm shadow-lg"
                          onClick={nextMedia}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {/* Media info */}
                  {(currentMedia?.title || currentMedia?.description) && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      {currentMedia.title && (
                        <h4 className="font-medium text-foreground">{currentMedia.title}</h4>
                      )}
                      {currentMedia.description && (
                        <p className="text-sm text-muted-foreground mt-1">{currentMedia.description}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Thumbnail navigation */}
                  {mediaItems.length > 1 && (
                    <div className="mt-4">
                      <div className="flex justify-center gap-2 overflow-x-auto pb-2">
                        {mediaItems.map((media, index) => (
                          <button
                            key={media.id}
                            onClick={() => setCurrentMediaIndex(index)}
                            className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all hover:scale-105 ${
                              index === currentMediaIndex 
                                ? 'border-primary shadow-md ring-2 ring-primary/20' 
                                : 'border-border opacity-60 hover:opacity-100'
                            }`}
                          >
                            {media.type === 'image' ? (
                              <img 
                                src={media.thumbnail_url || media.url} 
                                alt={media.title || `Media ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Play className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      <p className="text-center text-xs text-muted-foreground mt-2">
                        {currentMediaIndex + 1} of {mediaItems.length}
                      </p>
                    </div>
                  )}
                </Card>
            </div>
          )}

          {/* Comprehensive Overview Section */}
          {technique.description && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Overview
                </CardTitle>
                <CardDescription>
                  A comprehensive understanding of this technique
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose prose-gray max-w-none">
                  <p className="text-foreground leading-relaxed text-lg whitespace-pre-wrap">
                    {technique.description}
                  </p>
                </div>
                {technique.purpose && technique.purpose !== technique.description && (
                  <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h4 className="font-semibold text-primary mb-2">Purpose</h4>
                    <p className="text-foreground leading-relaxed">{technique.purpose}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* At a Glance Section - Enhanced W5H */}
          <AtAGlanceSection item={technique} />

          {/* Practical Details Section - Enhanced Metadata */}
          <PracticalDetailsSection item={technique} />

          {/* Media Attachments */}
          {technique.knowledge_media && technique.knowledge_media.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Additional Resources
                </CardTitle>
                <CardDescription>
                  Supplementary materials and references
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {technique.knowledge_media.map(renderMediaItem)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Examples */}
          {technique.knowledge_examples && technique.knowledge_examples.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-600" />
                  Success Stories
                </CardTitle>
                <CardDescription>
                  Real-world applications and their outcomes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {technique.knowledge_examples.map((example) => (
                    <Card key={example.id} className="bg-muted/30">
                      <CardHeader>
                        <CardTitle className="text-lg text-green-700 dark:text-green-300">
                          {example.title}
                        </CardTitle>
                        {example.context && (
                          <CardDescription className="text-base">{example.context}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground mb-6 leading-relaxed whitespace-pre-wrap">
                          {example.description}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {example.industry && (
                            <div className="p-3 bg-background rounded-lg">
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Industry</span>
                              <p className="text-sm font-semibold text-foreground mt-1">{example.industry}</p>
                            </div>
                          )}
                          {example.company_size && (
                            <div className="p-3 bg-background rounded-lg">
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Company Size</span>
                              <p className="text-sm font-semibold text-foreground mt-1">{example.company_size}</p>
                            </div>
                          )}
                          {example.outcome && (
                            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                              <span className="text-xs font-medium text-primary uppercase tracking-wide">Outcome</span>
                              <p className="text-sm font-semibold text-foreground mt-1">{example.outcome}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Related Techniques */}
          <EnhancedRelatedTechniques techniqueId={technique.id} />

          {/* Comments Section with Enhanced Design */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Share Your Experience</CardTitle>
              <CardDescription>
                Help others learn by sharing how you've used this technique or ask questions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <CommentsSection techniqueId={technique.id} />
            </CardContent>
          </Card>

          {/* Feedback Widget */}
          <FeedbackWidget techniqueId={technique.id} />
        </div>
      </div>
    </div>
  );
};

export default KnowledgeTechniqueDetail;