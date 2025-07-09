import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, User, Tag, ExternalLink, Play, FileText, Image } from "lucide-react";
import { useKnowledgeTechniqueBySlug } from "@/hooks/useKnowledgeTechniques";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const KnowledgeTechniqueDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: technique, isLoading, error } = useKnowledgeTechniqueBySlug(slug!);

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
      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/knowledge">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Knowledge Base
            </Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
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
              
              {technique.purpose && (
                <p className="text-xl text-muted-foreground mb-4">{technique.purpose}</p>
              )}

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

            {/* Description */}
            {technique.description && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Overview</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {technique.description}
                  </p>
                </div>
              </div>
            )}

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
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Quick Info */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {technique.knowledge_categories && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Category</span>
                      <p className="text-foreground">{technique.knowledge_categories.name}</p>
                    </div>
                  )}
                  
                  {technique.originator && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Originator</span>
                      <p className="text-foreground">{technique.originator}</p>
                    </div>
                  )}

                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={technique.is_complete ? "default" : "secondary"}>
                        {technique.is_complete ? "Complete" : "In Progress"}
                      </Badge>
                      {technique.is_featured && (
                        <Badge variant="outline">Featured</Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Views</span>
                    <p className="text-foreground">{technique.view_count}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Share */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Share This Technique</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeTechniqueDetail;