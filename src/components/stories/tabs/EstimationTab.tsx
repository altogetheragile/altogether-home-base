import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { UnifiedStoryData, UnifiedStoryMode, FIBONACCI_POINTS } from '@/types/story';
import { cn } from '@/lib/utils';
import { useActiveScheme } from '@/components/backlog/SchemeContext';

interface EstimationTabProps {
  data: UnifiedStoryData;
  onChange: (updates: Partial<UnifiedStoryData>) => void;
  mode: UnifiedStoryMode;
}

export function EstimationTab({ data, onChange, mode }: EstimationTabProps) {
  const scheme = useActiveScheme();
  const setScore = (key: string, value: number | null) => {
    const next = { ...(data.priority_data || {}) };
    if (value === null) delete next[key];
    else next[key] = value;
    onChange({ priority_data: next });
  };
  const wsjfScore = scheme.score ? scheme.score(data.priority_data || {}) : null;
  return (
    <div className="space-y-6">
      {/* Story Points (Fibonacci) */}
      {mode !== 'epic' && (
        <div className="space-y-2">
          <Label>Story Points</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={data.story_points === undefined || data.story_points === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange({ story_points: null })}
              className="min-w-[48px]"
            >
              -
            </Button>
            {FIBONACCI_POINTS.map((points) => (
              <Button
                key={points}
                type="button"
                variant={data.story_points === points ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange({ story_points: points })}
                className="min-w-[48px]"
              >
                {points}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Use Fibonacci sequence for relative sizing
          </p>
        </div>
      )}

      {/* Priority (scheme-aware) */}
      <div className="space-y-2">
        <Label>Priority <span className="font-normal text-muted-foreground">({scheme.name})</span></Label>
        {scheme.type === 'ordinal' ? (
          <div className="flex flex-wrap gap-2">
            {scheme.options!.map((p) => (
              <Button
                key={p.value}
                type="button"
                variant={data.priority === p.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange({ priority: p.value })}
                className={cn('min-w-[80px]', data.priority === p.value && p.color)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {scheme.fields!.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label htmlFor={`wsjf-${f.key}`} className="text-sm">{f.label}</Label>
                  <Input
                    id={`wsjf-${f.key}`}
                    type="number"
                    min="0"
                    value={data.priority_data?.[f.key] ?? ''}
                    onChange={(e) => setScore(f.key, e.target.value ? Number(e.target.value) : null)}
                    placeholder="1-10"
                  />
                  <p className="text-[11px] text-muted-foreground">{f.help}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
              <span className="text-sm font-medium">WSJF score</span>
              <span className="text-lg font-bold text-primary">{wsjfScore === null ? '-' : wsjfScore.toFixed(2)}</span>
            </div>
          </div>
        )}
        <p className="text-xs italic text-muted-foreground">{scheme.stretch}</p>
      </div>

      {/* Estimated Value & Effort */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimated_value">Business Value (1-100)</Label>
          <Input
            id="estimated_value"
            type="number"
            min="0"
            max="100"
            value={data.estimated_value ?? ''}
            onChange={(e) => onChange({ 
              estimated_value: e.target.value ? Number(e.target.value) : null 
            })}
            placeholder="e.g., 80"
          />
          <p className="text-xs text-muted-foreground">
            Relative business importance
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_effort">Effort Score (1-100)</Label>
          <Input
            id="estimated_effort"
            type="number"
            min="0"
            max="100"
            value={data.estimated_effort ?? ''}
            onChange={(e) => onChange({ 
              estimated_effort: e.target.value ? Number(e.target.value) : null 
            })}
            placeholder="e.g., 40"
          />
          <p className="text-xs text-muted-foreground">
            Implementation complexity
          </p>
        </div>
      </div>

      {/* Confidence Level */}
      {mode !== 'epic' && (
        <div className="space-y-2">
          <Label>Confidence Level</Label>
          <Select
            value={data.confidence_level?.toString() || 'none'}
            onValueChange={(value) => onChange({ 
              confidence_level: value === 'none' ? null : Number(value) 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select confidence..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              <SelectItem value="1">1 - Very Low (Wild guess)</SelectItem>
              <SelectItem value="2">2 - Low (Rough estimate)</SelectItem>
              <SelectItem value="3">3 - Medium (Reasonable confidence)</SelectItem>
              <SelectItem value="4">4 - High (Well understood)</SelectItem>
              <SelectItem value="5">5 - Very High (Fully defined)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            How confident are you in these estimates?
          </p>
        </div>
      )}

      {/* Value/Effort Summary */}
      {data.estimated_value && data.estimated_effort && data.estimated_effort > 0 && (
        <div className="p-4 rounded-lg bg-muted/50 border">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Value/Effort Ratio</span>
            <span className="text-lg font-bold text-primary">
              {(data.estimated_value / data.estimated_effort).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Higher ratio = better ROI prioritization
          </p>
        </div>
      )}
    </div>
  );
}
