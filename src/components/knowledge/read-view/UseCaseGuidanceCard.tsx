import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';

interface UseCaseGuidanceCardProps {
  useThisWhen?: string[];
  avoidWhen?: string[];
  outcomes?: string[];
}

export const UseCaseGuidanceCard: React.FC<UseCaseGuidanceCardProps> = ({
  useThisWhen,
  avoidWhen,
  outcomes,
}) => {
  const hasUseWhen = useThisWhen && useThisWhen.length > 0;
  const hasAvoidWhen = avoidWhen && avoidWhen.length > 0;
  const hasOutcomes = outcomes && outcomes.length > 0;

  if (!hasUseWhen && !hasAvoidWhen && !hasOutcomes) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Use this when…
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Use this when - Green styling */}
        {hasUseWhen && (
          <div className="rounded-lg border border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800/50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-400 mb-3">
              <CheckCircle2 className="h-4 w-4" />
              Triggers & situations
            </div>
            <ul className="space-y-2">
              {useThisWhen.map((condition, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-green-900 dark:text-green-300">
                  <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-500" />
                  <span>{condition}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Avoid when - Amber styling */}
        {hasAvoidWhen && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-400 mb-3">
              <AlertTriangle className="h-4 w-4" />
              Avoid using when
            </div>
            <ul className="space-y-2">
              {avoidWhen.map((condition, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-300">
                  <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-500" />
                  <span>{condition}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Outcomes - Blue styling */}
        {hasOutcomes && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800/50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-400 mb-3">
              <Sparkles className="h-4 w-4" />
              Expected outcomes
            </div>
            <ul className="space-y-2">
              {outcomes.map((outcome, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-blue-900 dark:text-blue-300">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-500" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
