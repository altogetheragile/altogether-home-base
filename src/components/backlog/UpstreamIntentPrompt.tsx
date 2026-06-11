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
 */
export function UpstreamIntentPrompt({ projectId }: UpstreamIntentPromptProps) {
  const [loading, setLoading] = useState(true);
  const [needed, setNeeded] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('projects')
        .select('intent_statement')
        .eq('id', projectId)
        .single();
      if (!active) return;
      setNeeded(!data?.intent_statement);
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
