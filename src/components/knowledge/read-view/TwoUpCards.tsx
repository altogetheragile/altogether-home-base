import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, FileOutput, CheckCircle2 } from 'lucide-react';

interface TwoUpCardsProps {
  decisionsSupported?: string[];
  outputs?: string[];
}

export const TwoUpCards: React.FC<TwoUpCardsProps> = ({
  decisionsSupported,
  outputs,
}) => {
  const hasDecisions = decisionsSupported && decisionsSupported.length > 0;
  const hasOutputs = outputs && outputs.length > 0;

  if (!hasDecisions && !hasOutputs) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Decisions Supported */}
      {hasDecisions && (
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Lightbulb className="h-4 w-4 text-primary" />
              Decisions supported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {decisionsSupported.map((decision, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                  <span>{decision}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Typical Outputs */}
      {hasOutputs && (
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <FileOutput className="h-4 w-4 text-primary" />
              Typical outputs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {outputs.map((output, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>{output}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
