import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListOrdered, Quote, Clock, Users, FileInput } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface HowItWorksAtAGlanceProps {
  steps?: Step[];
  typicalOutput?: string;
  inputs?: string[];
  timebox?: string;
  participants?: string;
}

export const HowItWorksAtAGlance: React.FC<HowItWorksAtAGlanceProps> = ({
  steps,
  typicalOutput,
  inputs,
  timebox,
  participants,
}) => {
  const hasSteps = steps && steps.length > 0;
  const hasOutput = !!typicalOutput;
  const hasParameters = !!inputs?.length || !!timebox || !!participants;

  if (!hasSteps && !hasOutput && !hasParameters) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ListOrdered className="h-5 w-5 text-primary" />
          How it works (at a glance)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Steps - max 5, compact display */}
        {hasSteps && (
          <div className="space-y-3">
            {steps.slice(0, 5).map((step, idx) => (
              <div key={step.id} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {idx + 1}
                </span>
                <div className="flex-1 pt-0.5">
                  <span className="font-medium">{step.title}</span>
                  {step.description && (
                    <span className="text-muted-foreground"> — {step.description}</span>
                  )}
                </div>
              </div>
            ))}
            {steps.length > 5 && (
              <p className="text-sm text-muted-foreground pl-10">
                + {steps.length - 5} more steps...
              </p>
            )}
          </div>
        )}

        {/* Parameters row - Inputs, Timebox, Participants */}
        {hasParameters && (
          <div className="flex flex-wrap gap-3 pt-2 border-t">
            {inputs && inputs.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1.5 py-1.5 px-3">
                <FileInput className="h-3.5 w-3.5" />
                <span className="font-normal">Inputs: {inputs.length}</span>
              </Badge>
            )}
            {timebox && (
              <Badge variant="secondary" className="flex items-center gap-1.5 py-1.5 px-3">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-normal">{timebox}</span>
              </Badge>
            )}
            {participants && (
              <Badge variant="secondary" className="flex items-center gap-1.5 py-1.5 px-3">
                <Users className="h-3.5 w-3.5" />
                <span className="font-normal">{participants}</span>
              </Badge>
            )}
          </div>
        )}

        {/* Typical output */}
        {hasOutput && (
          <div className="rounded-lg bg-muted/50 p-4 border">
            <div className="flex items-start gap-2">
              <Quote className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-muted-foreground">Typical output: </span>
                <span className="text-sm">{typicalOutput}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
