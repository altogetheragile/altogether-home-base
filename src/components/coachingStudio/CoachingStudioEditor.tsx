import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Send, Save, Sparkles, FileJson, FileText, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useProjectArtifactMutations } from '@/hooks/useProjectArtifacts';
import { useDebouncedCallback } from 'use-debounce';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import {
  CoachingSession,
  HarvestedItem,
  HarvestDestination,
  HARVEST_DESTINATIONS,
  destinationMeta,
  emptyCoachingSession,
  parseCoachingSession,
} from '@/types/coachingSession';

const TEAL = '#004D4D';
const SESSION_STRETCH = 'If this conversation went really well, what would be different afterwards?';
const newId = () => crypto.randomUUID();

const downloadText = (text: string, filename: string, mime: string): void => {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

interface CoachingStudioEditorProps {
  initialData?: CoachingSession;
  artifactId?: string;
  projectId?: string;
}

export function CoachingStudioEditor({ initialData, artifactId, projectId }: CoachingStudioEditorProps = {}) {
  const isArtifact = Boolean(artifactId && projectId);
  const [session, setSession] = useState<CoachingSession>(() =>
    initialData ? parseCoachingSession(initialData) ?? emptyCoachingSession() : emptyCoachingSession(),
  );
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [harvesting, setHarvesting] = useState(false);
  const [started, setStarted] = useState<boolean>(() => (initialData ? (parseCoachingSession(initialData)?.transcript.length ?? 0) > 0 : false));
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId') || projectId;
  const { updateArtifact } = useProjectArtifactMutations();

  const performArtifactSave = useDebouncedCallback(async (s: CoachingSession) => {
    if (!artifactId || !projectId) return;
    setSaveStatus('saving');
    try {
      await updateArtifact.mutateAsync({ id: artifactId, updates: { data: { ...s } } });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, 1500);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isArtifact) performArtifactSave(session);
  }, [session]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [session.transcript, busy]);

  const callCoach = async (conversation: CoachingSession['transcript']) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('coach-reflect', {
        body: {
          tool: 'coaching-session',
          cellTag: 'SESSION',
          question: session.topic ? `The person wants to talk about: ${session.topic}` : 'What would make this conversation useful to you today?',
          stretch: SESSION_STRETCH,
          conversation,
          mode: 'session',
        },
      });
      if (error) throw error;
      const message = data?.next_question || data?.reflection;
      if (message) setSession((s) => ({ ...s, transcript: [...s.transcript, { role: 'coach', text: message }] }));
    } catch {
      toast.error('The coach is unavailable right now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const begin = () => {
    setStarted(true);
    callCoach([]);
  };

  const send = () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...session.transcript, { role: 'user' as const, text }];
    setSession((s) => ({ ...s, transcript: next }));
    setInput('');
    callCoach(next);
  };

  const harvest = async () => {
    if (session.transcript.filter((t) => t.role === 'user').length === 0) {
      toast.info('Have a little of the conversation first, then harvest it.');
      return;
    }
    setHarvesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('coach-harvest', {
        body: { conversation: session.transcript },
      });
      if (error) throw error;
      const items: HarvestedItem[] = Array.isArray(data?.items)
        ? data.items.map((i: { text: string; destination: HarvestDestination; rationale: string }) => ({
            id: newId(),
            text: i.text,
            destination: i.destination,
            rationale: i.rationale,
            sent: false,
          }))
        : [];
      setSession((s) => ({ ...s, summary: data?.summary || s.summary, harvested: items }));
      if (items.length === 0) toast.info('Nothing obvious to harvest yet. Keep talking and try again.');
      else toast.success('Harvested. Review where each thing could go.');
    } catch {
      toast.error('The harvest is unavailable right now. Please try again.');
    } finally {
      setHarvesting(false);
    }
  };

  const setDestination = (id: string, destination: HarvestDestination) =>
    setSession((s) => ({ ...s, harvested: s.harvested.map((h) => (h.id === id ? { ...h, destination } : h)) }));
  const markSent = (id: string) =>
    setSession((s) => ({ ...s, harvested: s.harvested.map((h) => (h.id === id ? { ...h, sent: true } : h)) }));

  const sendHarvested = async (item: HarvestedItem) => {
    if (item.destination === 'note') {
      markSent(item.id);
      toast.success('Kept as a note in this session');
      return;
    }
    if (item.destination === 'backlog') {
      if (!preselectedProjectId) {
        toast.info('Save this session to a project first, then items can be sent to its backlog.');
        return;
      }
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        const { data: maxPos } = await supabase
          .from('backlog_items')
          .select('backlog_position')
          .eq('project_id', preselectedProjectId)
          .order('backlog_position', { ascending: false })
          .limit(1);
        const position = (maxPos?.[0]?.backlog_position ?? -1) + 1;
        const { error } = await supabase.from('backlog_items').insert({
          project_id: preselectedProjectId,
          title: item.text.slice(0, 200),
          source: 'From a coaching session',
          backlog_position: position,
          created_by: u?.id ?? null,
        });
        if (error) throw error;
        markSent(item.id);
        toast.success('Sent to the project backlog');
      } catch (e) {
        toast.error(`Could not send to backlog: ${e instanceof Error ? e.message : 'try again'}`);
      }
      return;
    }
    // goal, probe, benefit, persona, agreement: record it here and open the
    // destination tool so the person can place it. The item and where it went
    // stay captured in this session's harvest.
    const meta = destinationMeta(item.destination);
    if (meta.route) {
      const url = preselectedProjectId ? `${meta.route}?projectId=${preselectedProjectId}` : meta.route;
      window.open(url, '_blank');
      markSent(item.id);
      toast.success(`Opened ${meta.label}. This item is recorded in the harvest.`);
    }
  };

  const handleSaveToProject = () => {
    if (!user) {
      toast.error('Please sign in to save to a project');
      navigate('/auth');
      return;
    }
    setSaveDialogOpen(true);
  };
  const handleSaveComplete = (projId: string) => {
    toast.success('Coaching session saved to project');
    navigate(`/projects/${projId}`);
  };

  const toMarkdown = (): string => {
    const lines = ['# Coaching Session', ''];
    if (session.topic) lines.push(`Topic: ${session.topic}`, '');
    lines.push('## Conversation', '');
    session.transcript.forEach((t) => lines.push(`**${t.role === 'user' ? 'Me' : 'Coach'}:** ${t.text}`, ''));
    if (session.summary) lines.push('## Summary', '', session.summary, '');
    if (session.harvested.length) {
      lines.push('## Harvested', '');
      session.harvested.forEach((h) => lines.push(`- [${destinationMeta(h.destination).label}]${h.sent ? ' (sent)' : ''} ${h.text}`));
    }
    return lines.join('\n');
  };

  const handleExportJson = () => { downloadText(JSON.stringify(session, null, 2), 'coaching-session.json', 'application/json'); toast.success('JSON exported'); };
  const handleExportMarkdown = () => { downloadText(toMarkdown(), 'coaching-session.md', 'text/markdown'); toast.success('Markdown exported'); };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {!isArtifact && (
          <Button size="sm" onClick={handleSaveToProject}><Save className="mr-1.5 h-4 w-4" /> Save to Project</Button>
        )}
        {isArtifact && saveStatus !== 'idle' && (
          <span className="text-xs text-muted-foreground">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save failed'}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={handleExportJson}><FileJson className="mr-1.5 h-4 w-4" /> JSON</Button>
        <Button variant="outline" size="sm" onClick={handleExportMarkdown}><FileText className="mr-1.5 h-4 w-4" /> Markdown</Button>
      </div>

      <div>
        <label className="text-xs font-bold tracking-wide text-muted-foreground">WHAT WOULD YOU LIKE TO THINK ABOUT? (OPTIONAL)</label>
        <Input value={session.topic} onChange={(e) => setSession((s) => ({ ...s, topic: e.target.value }))} placeholder="A decision, a stuck conversation, a goal you are circling" className="mt-1" disabled={started} />
      </div>

      {!started ? (
        <Button onClick={begin} style={{ backgroundColor: TEAL }}>
          <Sparkles className="mr-1.5 h-4 w-4" /> Start the conversation
        </Button>
      ) : (
        <div className="rounded-lg border border-border bg-white">
          <div ref={scrollRef} className="max-h-[420px] space-y-3 overflow-y-auto p-4">
            {session.transcript.map((t, i) => (
              <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${t.role === 'user' ? 'bg-muted text-foreground' : 'text-white'}`}
                  style={t.role === 'coach' ? { backgroundColor: TEAL } : undefined}
                >
                  {t.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-lg px-3 py-2 text-sm text-white" style={{ backgroundColor: TEAL }}>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-border p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type your reply..."
              disabled={busy}
            />
            <Button onClick={send} disabled={busy || !input.trim()} size="icon"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {started && (
        <div>
          <Button variant="outline" onClick={harvest} disabled={harvesting}>
            {harvesting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
            Harvest this conversation
          </Button>
        </div>
      )}

      {(session.summary || session.harvested.length > 0) && (
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <h2 className="mb-1 text-lg font-semibold" style={{ color: TEAL }}>Harvest</h2>
          {session.summary && <p className="mb-3 text-sm text-muted-foreground">{session.summary}</p>}
          <div className="space-y-3">
            {session.harvested.map((h) => (
              <div key={h.id} className="rounded-md border border-border bg-white p-3">
                <p className="text-sm font-medium">{h.text}</p>
                {h.rationale && <p className="mt-0.5 text-xs text-muted-foreground">{h.rationale}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select
                    value={h.destination}
                    onChange={(e) => setDestination(h.id, e.target.value as HarvestDestination)}
                    disabled={h.sent}
                    className="rounded-md border border-border bg-background p-1.5 text-xs"
                  >
                    {HARVEST_DESTINATIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                  {h.sent ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-700"><Check className="h-3.5 w-3.5" /> Sent</span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => sendHarvested(h)}>
                      {h.destination === 'note' ? 'Keep' : h.destination === 'backlog' ? 'Send to backlog' : 'Open tool'}
                      {h.destination !== 'note' && <ArrowRight className="ml-1 h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SaveToProjectDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        artifactType="coaching-session"
        artifactName={session.topic ? `Coaching: ${session.topic}`.slice(0, 80) : 'Coaching session'}
        artifactDescription={`${session.transcript.length} turns, ${session.harvested.length} harvested`}
        artifactData={session}
        preselectedProjectId={preselectedProjectId || undefined}
        onSaveComplete={handleSaveComplete}
      />
    </div>
  );
}
