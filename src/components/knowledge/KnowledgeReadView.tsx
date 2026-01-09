import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, Target, Users, Lightbulb, CheckCircle2, 
  AlertTriangle, ArrowRight, ListOrdered, Quote
} from 'lucide-react';
import type { KnowledgeItem } from '@/hooks/useKnowledgeItems';
import { ITEM_TYPES } from '@/schemas/knowledgeItem';

interface KnowledgeReadViewProps {
  item: KnowledgeItem;
  steps?: Array<{ id: string; title: string; description?: string }>;
  relatedItems?: Array<{ id: string; name: string; slug: string }>;
}

// Find primary classification from an array (first with is_primary, or first item)
const getPrimary = <T extends { id: string; is_primary?: boolean }>(items: T[]): T | undefined => {
  return items.find(i => i.is_primary) || items[0];
};

// Get display label for item type
const getItemTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    technique: 'Technique',
    framework: 'Framework',
    template: 'Template',
    concept: 'Concept',
    practice: 'Practice',
    pattern: 'Pattern',
    tool: 'Tool',
  };
  return labels[type] || 'Technique';
};

export const KnowledgeReadView: React.FC<KnowledgeReadViewProps> = ({ 
  item, 
  steps,
  relatedItems 
}) => {
  // Get primary classifications
  const primaryCategory = getPrimary(item.categories || []);
  const primaryDecisionLevel = getPrimary(item.decision_levels || []);
  const primaryDomain = getPrimary(item.domains || []);

  // Type-safe access to new fields with fallbacks
  const itemData = item as KnowledgeItem & {
    item_type?: string;
    use_this_when?: string[];
    avoid_when?: string[];
    decisions_supported?: string[];
    what_good_looks_like?: string[];
    typical_output?: string;
    related_techniques?: string[];
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        {/* Type Badge */}
        <Badge variant="secondary" className="text-xs font-medium">
          {getItemTypeLabel(itemData.item_type || 'technique')}
        </Badge>
        
        {/* Title */}
        <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
        
        {/* Short Summary / Description */}
        {item.description && (
          <p className="text-lg text-muted-foreground leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      <Separator />

      {/* Section 1: When should I use this? */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">When should I use this?</h2>
        </div>

        {/* Primary Category as main use-case */}
        {primaryCategory && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-muted-foreground">Primary use-case:</span>
            <Badge 
              variant="outline"
              className="py-1 px-3"
              style={{ 
                backgroundColor: primaryCategory.color + '15',
                borderColor: primaryCategory.color + '40',
                color: primaryCategory.color || undefined
              }}
            >
              {primaryCategory.name}
            </Badge>
          </div>
        )}

        {/* Use this when */}
        {itemData.use_this_when && itemData.use_this_when.length > 0 && (
          <Card className="border-green-200 bg-green-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Use this when:
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {itemData.use_this_when.map((condition, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-green-900">
                    <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{condition}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Avoid using when */}
        {itemData.avoid_when && itemData.avoid_when.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Avoid using when:
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {itemData.avoid_when.map((condition, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-amber-900">
                    <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{condition}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Section 2: Where does this apply? (Decision Levels) */}
      {(item.decision_levels?.length ?? 0) > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Where does this apply?</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Decision Levels:</span>
            <div className="flex flex-wrap gap-2">
              {item.decision_levels?.map((level) => (
                <Badge 
                  key={level.id}
                  variant={level.id === primaryDecisionLevel?.id ? 'default' : 'outline'}
                  className="py-1 px-3"
                  style={level.id !== primaryDecisionLevel?.id ? { 
                    backgroundColor: level.color + '15',
                    borderColor: level.color + '40',
                    color: level.color || undefined
                  } : undefined}
                >
                  {level.name}
                  {level.id === primaryDecisionLevel?.id && (
                    <span className="ml-1 text-xs opacity-75">(primary)</span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 3: Who is typically involved? (Domains) */}
      {(item.domains?.length ?? 0) > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Who is typically involved?</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Domains of Interest:</span>
            <div className="flex flex-wrap gap-2">
              {item.domains?.map((domain) => (
                <Badge 
                  key={domain.id}
                  variant="outline"
                  className="py-1 px-3"
                  style={{ 
                    backgroundColor: domain.color + '15',
                    borderColor: domain.color + '40',
                    color: domain.color || undefined
                  }}
                >
                  {domain.name}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 4: What decisions does this support? */}
      {itemData.decisions_supported && itemData.decisions_supported.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">What decisions does this support?</h2>
          </div>
          
          <ul className="space-y-2 pl-2">
            {itemData.decisions_supported.map((decision, idx) => (
              <li key={idx} className="flex items-start gap-3 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 mt-1 flex-shrink-0 text-primary" />
                <span>{decision}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Section 5: How it works (at a glance) */}
      {steps && steps.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">How it works (at a glance)</h2>
          </div>
          
          <ol className="space-y-3 pl-2">
            {steps.slice(0, 5).map((step, idx) => (
              <li key={step.id} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {idx + 1}
                </span>
                <span className="pt-0.5">{step.title}</span>
              </li>
            ))}
          </ol>

          {/* Typical output */}
          {itemData.typical_output && (
            <Card className="border-muted bg-muted/20 mt-4">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <Quote className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Typical output: </span>
                    <span className="text-sm">{itemData.typical_output}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Section 6: What good looks like */}
      {itemData.what_good_looks_like && itemData.what_good_looks_like.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">What good looks like</h2>
          </div>
          
          <ul className="space-y-2 pl-2">
            {itemData.what_good_looks_like.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-3 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 mt-1 flex-shrink-0 text-green-600" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Section 7: Related techniques */}
      {itemData.related_techniques && itemData.related_techniques.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Related techniques</h2>
          
          <div className="flex flex-wrap gap-2">
            {itemData.related_techniques.map((technique, idx) => (
              <Badge key={idx} variant="outline" className="py-1 px-3">
                {technique}
              </Badge>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
