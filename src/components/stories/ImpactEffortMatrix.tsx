import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

interface ImpactEffortMatrixProps {
  impact?: number;
  effort?: number;
  onImpactChange?: (value: number) => void;
  onEffortChange?: (value: number) => void;
  readonly?: boolean;
}

export function ImpactEffortMatrix({
  impact = 5,
  effort = 5,
  onImpactChange,
  onEffortChange,
  readonly = false
}: ImpactEffortMatrixProps) {
  const getQuadrant = () => {
    if (impact >= 5 && effort <= 5) return 'Quick Win';
    if (impact >= 5 && effort > 5) return 'Major Project';
    if (impact < 5 && effort <= 5) return 'Fill-In';
    return 'Time Sink';
  };

  const getQuadrantColor = () => {
    const quadrant = getQuadrant();
    if (quadrant === 'Quick Win') return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400';
    if (quadrant === 'Major Project') return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400';
    if (quadrant === 'Fill-In') return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400';
  };

  const getPriorityRecommendation = () => {
    const quadrant = getQuadrant();
    if (quadrant === 'Quick Win') return 'High Priority - Do First';
    if (quadrant === 'Major Project') return 'Medium Priority - Plan Carefully';
    if (quadrant === 'Fill-In') return 'Low Priority - Do When Possible';
    return 'Avoid - Reconsider Approach';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Impact vs Effort Analysis</CardTitle>
        <CardDescription className="text-xs">
          Helps prioritize work based on value and complexity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Matrix */}
        <div className="relative w-full h-48 border-2 rounded-lg overflow-hidden">
          {/* Quadrant backgrounds */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            <div className="border-r border-b bg-yellow-50/50 dark:bg-yellow-950/10" />
            <div className="border-b bg-green-50/50 dark:bg-green-950/10" />
            <div className="border-r bg-red-50/50 dark:bg-red-950/10" />
            <div className="bg-blue-50/50 dark:bg-blue-950/10" />
          </div>

          {/* Axis labels */}
          <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-muted-foreground pb-1">
            Effort →
          </div>
          <div className="absolute top-0 left-0 bottom-0 flex items-center text-xs text-muted-foreground -rotate-90 origin-left pl-1">
            Impact →
          </div>

          {/* Quadrant labels */}
          <div className="absolute top-2 left-2 text-xs font-medium text-muted-foreground">
            Fill-In
          </div>
          <div className="absolute top-2 right-2 text-xs font-medium text-muted-foreground">
            Quick Win
          </div>
          <div className="absolute bottom-6 left-2 text-xs font-medium text-muted-foreground">
            Time Sink
          </div>
          <div className="absolute bottom-6 right-2 text-xs font-medium text-muted-foreground">
            Major
          </div>

          {/* Current position marker */}
          <div
            className="absolute w-3 h-3 bg-primary rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-10 animate-pulse"
            style={{
              left: `${(effort / 10) * 100}%`,
              bottom: `${(impact / 10) * 100}%`
            }}
          />
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Impact</label>
              <span className="text-sm text-muted-foreground">{impact}/10</span>
            </div>
            <Slider
              value={[impact]}
              onValueChange={(values) => onImpactChange?.(values[0])}
              min={1}
              max={10}
              step={1}
              disabled={readonly}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Effort</label>
              <span className="text-sm text-muted-foreground">{effort}/10</span>
            </div>
            <Slider
              value={[effort]}
              onValueChange={(values) => onEffortChange?.(values[0])}
              min={1}
              max={10}
              step={1}
              disabled={readonly}
              className="w-full"
            />
          </div>
        </div>

        {/* Result Display */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Quadrant:</span>
            <Badge className={getQuadrantColor()}>
              {getQuadrant()}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {getPriorityRecommendation()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
