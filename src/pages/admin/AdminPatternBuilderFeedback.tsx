import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, MessageSquare, RefreshCw } from 'lucide-react';
import { usePatternBuilderRuns } from '@/hooks/usePatternBuilderRuns';

const fmt = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
};

const AdminPatternBuilderFeedback = () => {
  const { data: runs, isLoading, isError, refetch, isFetching } = usePatternBuilderRuns();
  const [onlyRated, setOnlyRated] = useState(false);

  const stats = useMemo(() => {
    const all = runs || [];
    const fb = all.flatMap((r) => r.feedback);
    return {
      runs: all.length,
      rated: all.filter((r) => r.feedback.length > 0).length,
      up: fb.filter((f) => f.rating === 'up').length,
      down: fb.filter((f) => f.rating === 'down').length,
      revised: all.filter((r) => r.was_revised).length,
    };
  }, [runs]);

  const visible = useMemo(
    () => (onlyRated ? (runs || []).filter((r) => r.feedback.length > 0) : runs || []),
    [runs, onlyRated],
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pattern Builder Feedback</h1>
          <p className="text-sm text-muted-foreground">
            Generated patterns, their self-review outcome, and user ratings.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Runs', value: stats.runs },
          { label: 'With feedback', value: stats.rated },
          { label: '👍 Helpful', value: stats.up },
          { label: '👎 Not quite', value: stats.down },
          { label: 'Self-revised', value: stats.revised },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={onlyRated ? 'default' : 'outline'}
          size="sm"
          onClick={() => setOnlyRated((v) => !v)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          {onlyRated ? 'Showing rated only' : 'Show rated only'}
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {isError && <p className="text-destructive">Failed to load feedback. Check admin access.</p>}
      {!isLoading && visible.length === 0 && (
        <p className="text-muted-foreground">No runs yet.</p>
      )}

      <div className="space-y-4">
        {visible.map((run) => (
          <Card key={run.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base font-semibold leading-snug">
                  {run.scenario}
                </CardTitle>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{fmt(run.created_at)}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {run.primary_horizon && <Badge variant="secondary">{run.primary_horizon}</Badge>}
                <Badge variant="outline">{run.result?.steps?.length ?? 0} steps</Badge>
                {run.assessment?.verdict && (
                  <Badge variant={run.assessment.verdict === 'revise' ? 'default' : 'outline'}>
                    critic: {run.assessment.verdict}
                  </Badge>
                )}
                {run.was_revised && <Badge variant="default">self-revised</Badge>}
                {run.feedback.map((f) => (
                  <Badge key={f.id} variant={f.rating === 'up' ? 'secondary' : 'destructive'} className="gap-1">
                    {f.rating === 'up' ? <ThumbsUp className="h-3 w-3" /> : <ThumbsDown className="h-3 w-3" />}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {run.assessment?.summary && (
                <p className="text-xs text-muted-foreground italic">
                  Review: {run.assessment.summary}
                  {run.assessment.repairNote ? ` (${run.assessment.repairNote})` : ''}
                </p>
              )}
              {run.feedback.some((f) => f.comment) && (
                <div className="space-y-1.5">
                  {run.feedback.filter((f) => f.comment).map((f) => (
                    <div key={f.id} className="flex items-start gap-2 text-sm">
                      {f.rating === 'up' ? (
                        <ThumbsUp className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      ) : (
                        <ThumbsDown className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      )}
                      <span>{f.comment}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminPatternBuilderFeedback;
