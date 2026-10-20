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
 *
 * Once answered it stays at the top of the backlog, editable. It used to vanish on
 * Save and appear nowhere else, so the one thing the backlog asked for was the one
 * thing it never showed: found dogfooding the Product Owner route, 20 October 2026.
 */
export function UpstreamIntentPrompt({ projectId }: UpstreamIntentPromptProps) {
  const [loading, setLoading] = useState(true);
  const [needed, setNeeded] = useState(false);
  const [intent, setIntent] = useState('');
  const [editing, setEditing] = useState(false);
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
        setIntent(proj.intent_statement);
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

  if (loading) return null;

  const save = async () => {
    const next = value.trim();
    if (!next) {
      // Dismissed without answering; do not nag again this session. Emptying an existing
      // intent is not a way to delete it, so editing to blank just stops editing.
      setNeeded(false);
      setEditing(false);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('projects').update({ intent_statement: next }).eq('id', projectId);
    setSaving(false);
    if (error) {
      toast.error('Could not save that. Please try again.');
      return;
    }
    toast.success('Intent captured');
    setIntent(next);
    setNeeded(false);
    setEditing(false);
  };

  if (intent && !editing) {
    return (
      <Card className="mb-6 border-primary/40 bg-primary/5">
        <CardContent className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Why this work exists</p>
            <p className="text-sm">{intent}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setValue(intent); setEditing(true); }}>Edit</Button>
        </CardContent>
      </Card>
    );
  }

  if (!needed && !editing) return null;

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
            placeholder="In a sentence, why this work exists..."
            onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
            className="flex-1"
          />
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>Save</Button>
            <Button variant="ghost" onClick={() => { setNeeded(false); setEditing(false); }}>
              {editing ? 'Cancel' : 'Skip'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
