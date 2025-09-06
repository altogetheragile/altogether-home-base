import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Calendar, User, Link, Star, ExternalLink } from 'lucide-react';
import { KnowledgeItemFormData } from '@/schemas/knowledgeItem';
import { cn } from '@/lib/utils';

interface LivePreviewPanelProps {
  form: UseFormReturn<KnowledgeItemFormData>;
  categories?: Array<{ id: string; name: string; color: string }>;
  planningLayers?: Array<{ id: string; name: string; color: string }>;
  domains?: Array<{ id: string; name: string; color: string }>;
  className?: string;
}

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  form,
  categories = [],
  planningLayers = [],
  domains = [],
  className
}) => {
  const formValues = form.watch();
  
  const selectedCategory = categories.find(c => c.id === formValues.category_id);
  const selectedFocus = planningLayers.find(l => l.id === formValues.planning_focus_id);
  const selectedDomain = domains.find(d => d.id === formValues.domain_id);

  return (
    <div className={cn("sticky top-32 h-fit", className)}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5" />
            Live Preview
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            See how your knowledge item will appear
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title and Status */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className={cn(
                "font-semibold text-lg leading-tight",
                !formValues.name?.trim() && "text-muted-foreground italic"
              )}>
                {formValues.name?.trim() || 'Untitled Knowledge Item'}
              </h3>
              <div className="flex gap-1 flex-shrink-0">
                {formValues.is_published && (
                  <Badge variant="secondary" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Published
                  </Badge>
                )}
                {formValues.is_featured && (
                  <Badge variant="default" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
            </div>
            
            {formValues.slug && (
              <div className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                /knowledge/{formValues.slug}
              </div>
            )}
          </div>

          {/* Description */}
          {formValues.description && (
            <div className="text-sm text-muted-foreground leading-relaxed">
              {formValues.description}
            </div>
          )}

          {/* Classification Tags */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Classification</h4>
            <div className="flex flex-wrap gap-2">
              {selectedCategory && (
                <Badge
                  variant="secondary"
                  style={{ 
                    backgroundColor: `${selectedCategory.color}15`, 
                    color: selectedCategory.color,
                    borderColor: `${selectedCategory.color}30`
                  }}
                  className="text-xs"
                >
                  {selectedCategory.name}
                </Badge>
              )}
              {selectedFocus && (
                <Badge
                  variant="outline"
                  style={{ 
                    borderColor: selectedFocus.color, 
                    color: selectedFocus.color 
                  }}
                  className="text-xs"
                >
                  {selectedFocus.name}
                </Badge>
              )}
              {selectedDomain && (
                <Badge
                  variant="outline"
                  style={{ 
                    borderColor: selectedDomain.color, 
                    color: selectedDomain.color 
                  }}
                  className="text-xs"
                >
                  {selectedDomain.name}
                </Badge>
              )}
              {!selectedCategory && !selectedFocus && !selectedDomain && (
                <span className="text-xs text-muted-foreground italic">No classification</span>
              )}
            </div>
          </div>

          {/* Metadata */}
          {formData.publications?.publication_authors?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Source Information</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{formData.publications.publication_authors.map(pa => pa.authors.name).join(', ')}</span>
                </div>
              </div>
            </div>
          )}

          {formData.source && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-4 h-4 flex items-center justify-center text-xs">📚</span>
                <span>{formData.source}</span>
              </div>
            </div>
          )}

          {formData.publications?.publication_year && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formData.publications.publication_year}</span>
              </div>
            </div>
          )}

          {formData.publications?.url && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link className="h-4 w-4" />
                <a 
                  href={formData.publications.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary underline flex items-center gap-1"
                >
                  Reference Link
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Enhanced Information Preview */}
          {(formValues.learning_value_summary || 
            (formValues.common_pitfalls && formValues.common_pitfalls.length > 0) ||
            (formValues.evidence_sources && formValues.evidence_sources.length > 0)) && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Enhanced Information</h4>
              
              {formValues.learning_value_summary && (
                <div className="text-sm text-muted-foreground bg-primary/5 p-2 rounded border-l-2 border-primary">
                  <strong className="text-primary">Learning Value:</strong> {formValues.learning_value_summary}
                </div>
              )}
              
              {formValues.common_pitfalls && formValues.common_pitfalls.length > 0 && (
                <div className="text-sm">
                  <strong className="text-destructive">Pitfalls:</strong>
                  <ul className="list-disc list-inside mt-1 text-muted-foreground">
                    {formValues.common_pitfalls.slice(0, 2).map((pitfall, index) => (
                      <li key={index}>{pitfall}</li>
                    ))}
                    {formValues.common_pitfalls.length > 2 && (
                      <li className="italic">... and {formValues.common_pitfalls.length - 2} more</li>
                    )}
                  </ul>
                </div>
              )}
              
              {formValues.evidence_sources && formValues.evidence_sources.length > 0 && (
                <div className="text-sm">
                  <strong className="text-green-600">Evidence:</strong>
                  <span className="text-muted-foreground ml-1">
                    {formValues.evidence_sources.length} source(s) documented
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Content Preview */}
          {(formValues.background || formValues.source) && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Content</h4>
              {formValues.background && (
                <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
                  <strong>Background:</strong>
                  <p className="mt-1 line-clamp-3">
                    {formValues.background.length > 150 
                      ? `${formValues.background.substring(0, 150)}...` 
                      : formValues.background
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Form Completeness */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Form Status</span>
              <div className="flex items-center gap-2">
                {form.formState.isValid ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                    ✓ Valid
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                    ! Errors
                  </Badge>
                )}
                {form.formState.isDirty && (
                  <Badge variant="outline" className="text-xs">
                    Unsaved
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};