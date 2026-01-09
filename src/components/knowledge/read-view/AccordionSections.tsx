import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Layers, Scale, AlertCircle, Eye, TrendingUp } from 'lucide-react';

interface AccordionSectionsProps {
  commonPitfalls?: string[];
  inspectAdaptSignals?: string[];
  maturityIndicators?: string[];
  relatedTechniques?: string[];
  background?: string;
}

export const AccordionSections: React.FC<AccordionSectionsProps> = ({
  commonPitfalls,
  inspectAdaptSignals,
  maturityIndicators,
  relatedTechniques,
  background,
}) => {
  const hasPitfalls = commonPitfalls && commonPitfalls.length > 0;
  const hasSignals = inspectAdaptSignals && inspectAdaptSignals.length > 0;
  const hasMaturity = maturityIndicators && maturityIndicators.length > 0;
  const hasRelated = relatedTechniques && relatedTechniques.length > 0;
  const hasBackground = !!background;

  if (!hasPitfalls && !hasSignals && !hasMaturity && !hasRelated && !hasBackground) {
    return null;
  }

  return (
    <Accordion type="multiple" className="w-full">
      {/* Background / Deeper context */}
      {hasBackground && (
        <AccordionItem value="background">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              Background & context
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: background }}
            />
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Variants & adaptations (related techniques) */}
      {hasRelated && (
        <AccordionItem value="variants">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <span className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-muted-foreground" />
              Variants & adaptations
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              {relatedTechniques.map((technique, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {technique}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Common failure modes */}
      {hasPitfalls && (
        <AccordionItem value="pitfalls">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              Common failure modes
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              {commonPitfalls.map((pitfall, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
                  {pitfall}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Signals to inspect & adapt */}
      {hasSignals && (
        <AccordionItem value="signals">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              Signals to inspect & adapt
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              {inspectAdaptSignals.map((signal, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Eye className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                  {signal}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Maturity indicators */}
      {hasMaturity && (
        <AccordionItem value="maturity">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Maturity indicators
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              {maturityIndicators.map((indicator, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
                  {indicator}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
};
