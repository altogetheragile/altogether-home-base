import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface UpstreamIntentPromptProps {
  projectId: string;
}

/**
 * One-question-upstream (VISION_TO_VALUE.md section 2): when a user lands in the
 * backlog for a project that has no intent_statement yet, ask exactly one
 * upstream question and store the answer on projects.intent_statement. Never
 * forces the user back to the start; it is dismissable.
 *
 * The Impact Map goal is the same "why", so when the project has one we pre-fill
 * the field with it (the person still edits/saves/skips) rather than ask them to
 * retype it.
 */
export function UpstreamIntentPrompt({ projectId }: UpstreamIntentPromptProps) {
  const [loading, setLoading] = useState(true);
  const [needed, setNeeded] = useState(false);
  const [value, setValue] = useState('');
  const [fromMap, setFromMap] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: proj } = await supabase
        .from('projects')
        .select('intent_statement')
        .eq('id', projectId)
        .single();
      if (!active) return;
      if (proj?.intent_statement) {
        setNeeded(false);
        setLoading(false);
        return;
      }
      // No intent yet: offer the linked Impact Map's goal (the WHY) as a starting point.
      const { data: maps } = await supabase
        .from('project_artifacts')
        .select('data, updated_at')
        .eq('project_id', projectId)
        .eq('artifact_type', 'impact-map')
        .order('updated_at', { ascending: false });
      if (!active) return;
      const goal = (maps || [])
        .map((m) => (m.data as { goal?: string } | null)?.goal)
        .find((g) => typeof g === 'string' && g.trim() !== '');
      if (goal) {
        setValue(goal.trim());
        setFromMap(true);
      }
      setNeeded(true);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [projectId]);

  if (loading || !needed) return null;

  const save = async () => {
    const intent = value.trim();
    if (!intent) {
      setNeeded(false); // dismissed without answering; do not nag again this session
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('projects').update({ intent_statement: intent }).eq('id', projectId);
    setSaving(false);
    if (error) {
      toast.error('Could not save that. Please try again.');
      return;
    }
    toast.success('Intent captured');
    setNeeded(false);
  };

  return (
    <Card className="mb-6 border-primary/40 bg-primary/5">
      <CardContent className="py-4">
        <p className="mb-2 text-sm font-medium">Before we prioritise: in a sentence, why does this work exist?</p>
        {fromMap && (
          <p className="mb-2 text-xs text-muted-foreground">Pre-filled from your Impact Map goal. Edit it if you like, or save as is.</p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="In a sentence, the goal this backlog serves..."
            onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
            className="flex-1"
          />
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>Save</Button>
            <Button variant="ghost" onClick={() => setNeeded(false)}>Skip</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
