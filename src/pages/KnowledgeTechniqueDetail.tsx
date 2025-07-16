import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, User, Tag, ExternalLink, Play, FileText, Image, ChevronLeft, ChevronRight, Clock, Eye, Download, Maximize2 } from "lucide-react";
import { useKnowledgeTechniqueBySlug } from "@/hooks/useKnowledgeTechniques";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import Navigation from "@/components/Navigation";
import { FeedbackWidget } from "@/components/knowledge/FeedbackWidget";
import { RelatedTechniques } from "@/components/knowledge/RelatedTechniques";
import { DifficultyBadge } from "@/components/knowledge/DifficultyBadge";
import { ReadingProgress } from "@/components/knowledge/ReadingProgress";
import { BookmarkButton } from "@/components/knowledge/BookmarkButton";
import { CommentsSection } from "@/components/knowledge/CommentsSection";
import { useState } from "react";
import { useViewTracking } from "@/hooks/useViewTracking";

const KnowledgeTechniqueDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: technique, isLoading, error } = useKnowledgeTechniqueBySlug(slug!);
  
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
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/knowledge">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Knowledge Base
              </Link>
            </Button>
            
            <div className="flex items-center gap-2">
              <BookmarkButton techniqueId={technique.id} showLabel />
              <ReadingProgress techniqueId={technique.id} />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Main Content */}
          <div>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  {technique.name}
                </h1>
                {technique.knowledge_categories && (
                  <Badge 
                    variant="secondary" 
                    style={{ 
                      backgroundColor: `${technique.knowledge_categories.color}20`, 
                      color: technique.knowledge_categories.color 
                    }}
                    className="ml-4"
                  >
                    {technique.knowledge_categories.name}
                  </Badge>
                )}
              </div>
              
              {(technique.summary || technique.purpose) && (
                <p className="text-xl text-muted-foreground mb-4">
                  {technique.summary || technique.purpose}
                </p>
              )}

              {/* Meta information badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <DifficultyBadge difficulty={technique.difficulty_level} />
                {technique.estimated_reading_time && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {technique.estimated_reading_time} min read
                  </Badge>
                )}
                {technique.content_type && technique.content_type !== 'technique' && (
                  <Badge variant="secondary">
                    {technique.content_type}
                  </Badge>
                )}
              </div>

              {technique.knowledge_tags && technique.knowledge_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {technique.knowledge_tags.map((tag) => (
                    <Badge key={tag.id} variant="outline">
                      <Tag className="mr-1 h-3 w-3" />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(technique.created_at).toLocaleDateString()}
                </div>
                {technique.originator && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {technique.originator}
                  </div>
                )}
              </div>
            </div>

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

            {/* Detailed Content Sections */}
            <div className="space-y-8">
              {/* Summary Section */}
              {technique.summary && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <span className="text-green-600">✅</span> Summary
                  </h2>
                  <p className="text-foreground leading-relaxed">
                    {technique.summary}
                  </p>
                </Card>
              )}

              {/* Description Section */}
              {technique.description && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <span className="text-blue-600">📖</span> Description
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {technique.description}
                    </p>
                  </div>
                </Card>
              )}

              {/* Purpose Section */}
              {technique.purpose && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <span className="text-purple-600">🎯</span> Purpose
                  </h2>
                  <p className="text-foreground leading-relaxed">
                    {technique.purpose}
                  </p>
                </Card>
              )}
            </div>

            {/* Media Attachments */}
            {technique.knowledge_media && technique.knowledge_media.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Resources</h2>
                <div className="space-y-4">
                  {technique.knowledge_media.map(renderMediaItem)}
                </div>
              </div>
            )}

            {/* Examples */}
            {technique.knowledge_examples && technique.knowledge_examples.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Real-World Examples</h2>
                <div className="space-y-6">
                  {technique.knowledge_examples.map((example) => (
                    <Card key={example.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{example.title}</CardTitle>
                        {example.context && (
                          <CardDescription>{example.context}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground mb-4 whitespace-pre-wrap">
                          {example.description}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {example.industry && (
                            <div>
                              <span className="font-medium text-muted-foreground">Industry:</span>
                              <p className="text-foreground">{example.industry}</p>
                            </div>
                          )}
                          {example.company_size && (
                            <div>
                              <span className="font-medium text-muted-foreground">Company Size:</span>
                              <p className="text-foreground">{example.company_size}</p>
                            </div>
                          )}
                          {example.outcome && (
                            <div>
                              <span className="font-medium text-muted-foreground">Outcome:</span>
                              <p className="text-foreground">{example.outcome}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="mb-8">
              <CommentsSection techniqueId={technique.id} />
            </div>

            {/* Related Techniques */}
            <div className="mb-8">
              <RelatedTechniques techniqueId={technique.id} />
            </div>

            {/* Feedback Widget */}
            <div className="mb-8">
              <FeedbackWidget techniqueId={technique.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeTechniqueDetail;