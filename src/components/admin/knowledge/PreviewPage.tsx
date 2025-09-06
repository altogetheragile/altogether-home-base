import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, ExternalLink, AlertTriangle, BookOpen, Hash, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { KnowledgeItemFormData } from '@/schemas/knowledgeItem';

export const PreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [knowledgeItem, setKnowledgeItem] = useState<KnowledgeItemFormData | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    // Check if this is a preview from the editor
    const previewData = sessionStorage.getItem('preview-knowledge-item');
    if (previewData) {
      setKnowledgeItem(JSON.parse(previewData));
      setIsPreview(true);
      return;
    }

    // TODO: For actual published items, fetch from API
    // This would be implemented when we have the public preview functionality
  }, [id]);

  if (!knowledgeItem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Preview Header */}
      {isPreview && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Preview Mode
              </Badge>
              <span className="text-sm text-blue-600">
                This is how your knowledge item will appear to users
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.close()}
              className="border-blue-200"
            >
              Close Preview
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {!isPreview && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/knowledge/items">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Knowledge Items
                </Link>
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  {knowledgeItem.name || 'Untitled Knowledge Item'}
                </h1>
                
                {knowledgeItem.slug && (
                  <p className="text-sm text-muted-foreground font-mono">
                    /{knowledgeItem.slug}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {knowledgeItem.is_published ? (
                  <Badge variant="default" className="bg-green-100 text-green-700">Published</Badge>
                ) : (
                  <Badge variant="outline">Draft</Badge>
                )}
                {knowledgeItem.is_featured && (
                  <Badge variant="secondary">Featured</Badge>
                )}
              </div>
            </div>

            {knowledgeItem.description && (
              <p className="text-lg text-muted-foreground leading-relaxed">
                {knowledgeItem.description}
              </p>
            )}

            {/* Metadata - Remove publication data as it's not part of form data */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Created {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Background */}
          {knowledgeItem.background && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Background
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {knowledgeItem.background.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Source */}
          {knowledgeItem.source && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {knowledgeItem.source.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Learning Value Summary */}
          {knowledgeItem.learning_value_summary && (
            <Alert>
              <BookOpen className="h-4 w-4" />
              <AlertDescription className="text-base">
                <strong>Key Learning Value:</strong> {knowledgeItem.learning_value_summary}
              </AlertDescription>
            </Alert>
          )}

          {/* Enhanced Information Grid */}
          {(knowledgeItem.common_pitfalls?.length || 
            knowledgeItem.evidence_sources?.length || 
            knowledgeItem.related_techniques?.length ||
            Object.keys(knowledgeItem.key_terminology || {}).length) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Common Pitfalls */}
              {knowledgeItem.common_pitfalls && knowledgeItem.common_pitfalls.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Common Pitfalls
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {knowledgeItem.common_pitfalls.map((pitfall, index) => (
                        <li key={index} className="text-sm leading-relaxed">
                          • {pitfall}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Evidence Sources */}
              {knowledgeItem.evidence_sources && knowledgeItem.evidence_sources.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <LinkIcon className="h-4 w-4 text-blue-500" />
                      Evidence Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {knowledgeItem.evidence_sources.map((source, index) => (
                        <li key={index} className="text-sm leading-relaxed">
                          • {source}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Related Techniques */}
              {knowledgeItem.related_techniques && knowledgeItem.related_techniques.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <LinkIcon className="h-4 w-4 text-green-500" />
                      Related Techniques
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {knowledgeItem.related_techniques.map((technique, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {technique}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Key Terminology */}
              {knowledgeItem.key_terminology && Object.keys(knowledgeItem.key_terminology).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Hash className="h-4 w-4 text-purple-500" />
                      Key Terminology
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-3">
                      {Object.entries(knowledgeItem.key_terminology).map(([term, definition]) => (
                        <div key={term}>
                          <dt className="text-sm font-semibold">{term}</dt>
                          <dd className="text-sm text-muted-foreground ml-2">{definition}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>Knowledge Item Preview • {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};