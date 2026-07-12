import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';
import type { GameState, Specialism } from '@/components/flowGame/types';
import { useFlowGame } from '@/components/flowGame/useFlowGame';
import { useFlowGameSaves } from '@/components/flowGame/useFlowGameSaves';
import { GameIntro } from '@/components/flowGame/GameIntro';
import { BoardView } from '@/components/flowGame/BoardView';
import { WipLimitSetup } from '@/components/flowGame/WipLimitSetup';
import { MetricsScreen } from '@/components/flowGame/MetricsScreen';
import { SavedGamesDialog } from '@/components/flowGame/SavedGamesDialog';
import { SaveGameDialog } from '@/components/flowGame/SaveGameDialog';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

// Auto-save the in-progress game to the browser so an accidental refresh never
// loses it. Kept separate from the named Supabase saves; the draft is just the
// current game, restored on load.
const DRAFT_KEY = 'flowGame.draft.v1';

interface Draft {
  state: GameState;
  saveId: string | null;
  saveName: string;
}

function progressLabel(s: GameState): string {
  switch (s.phase) {
    case 'playing-round-1': return `Round 1, Day ${s.round?.day ?? 1}`;
    case 'playing-round-2': return `Round 2, Day ${s.round?.day ?? 1}`;
    case 'metrics-round-1': return 'Round 1 results';
    case 'wip-setup': return 'setting WIP limits';
    case 'metrics-final': return 'final results';
    default: return 'in progress';
  }
}

export default function FlowGame() {
  const {
    state,
    pullItem,
    reorderItem,
    setWip,
    setUseWip,
    setEnforceWip,
    setMaximizeWip,
    assignWorker,
    unassignWorker,
    runDay,
    nextDay,
    startRound,
    setPhase,
    setPrediction,
    setWorkflow,
    setRoster,
    loadGame,
    reset,
  } = useFlowGame();

  const { user } = useAuth();
  const navigate = useNavigate();
  const { saveGame, isSaving } = useFlowGameSaves();

  // Save/resume orchestration. saveId tracks the row this game maps to, so a
  // second save updates rather than duplicates; saveName seeds the name field.
  const [saveId, setSaveId] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');
  const [savesOpen, setSavesOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Read any auto-saved draft once, at first render (no effect => no state churn).
  const initialDraft = useMemo<Draft | null>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      const d = raw ? (JSON.parse(raw) as Draft) : null;
      if (d?.state?.phase && d.state.phase !== 'intro') return d;
    } catch { /* ignore malformed draft */ }
    return null;
  }, []);
  const [resumePrompt, setResumePrompt] = useState<Draft | null>(initialDraft);
  // Autosave is held off until any pending resume prompt is resolved, so the
  // draft is never overwritten with the fresh intro state before the user decides.
  const [ready, setReady] = useState(!initialDraft);

  // Keep the named Supabase save current with ongoing play (debounced).
  const debouncedServerSave = useDebouncedCallback((s: GameState, id: string, name: string) => {
    saveGame({ id, name, state: s }).catch(() => { /* best effort */ });
  }, 2000);

  // Auto-save the draft (and update the server save if this game maps to one).
  useEffect(() => {
    if (!ready) return;
    try {
      if (state.phase === 'intro') localStorage.removeItem(DRAFT_KEY);
      else localStorage.setItem(DRAFT_KEY, JSON.stringify({ state, saveId, saveName }));
    } catch { /* ignore quota errors */ }
    if (saveId && user && state.phase !== 'intro') debouncedServerSave(state, saveId, saveName);
  }, [ready, state, saveId, saveName, user, debouncedServerSave]);

  const resumeDraft = () => {
    if (resumePrompt) {
      loadGame(resumePrompt.state);
      setSaveId(resumePrompt.saveId ?? null);
      setSaveName(resumePrompt.saveName ?? '');
    }
    setResumePrompt(null);
    setReady(true);
  };
  const discardDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    setResumePrompt(null);
    setReady(true);
  };

  const requestSave = () => {
    if (!user) {
      toast.info('Sign in to save your game');
      navigate('/auth');
      return;
    }
    setSaveDialogOpen(true);
  };
  const handleSave = async (name: string) => {
    try {
      const id = await saveGame({ id: saveId, name, state });
      setSaveId(id);
      setSaveName(name);
      setSaveDialogOpen(false);
      toast.success('Game saved');
    } catch {
      toast.error('Could not save the game. Please try again.');
    }
  };
  const handleResume = (id: string, loaded: GameState, name: string) => {
    loadGame(loaded);
    setSaveId(id);
    setSaveName(name);
  };
  // Play Again / new game: drop the draft and detach from any named save so the
  // fresh game does not overwrite it.
  const handleReset = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    setSaveId(null);
    setSaveName('');
    reset();
  };

  const renderPhase = () => {
    switch (state.phase) {
      case 'intro':
        return (
          <GameIntro
            workflow={state.workflow}
            onSetWorkflow={setWorkflow}
            onStart={(scenario) => startRound(1, undefined, scenario)}
            canResume={!!user}
            onOpenSaves={() => setSavesOpen(true)}
          />
        );

      case 'playing-round-1':
      case 'playing-round-2':
        if (!state.round) return null;
        return (
          <BoardView
            round={state.round}
            onPullItem={pullItem}
            onReorderItem={reorderItem}
            onAssignWorker={assignWorker}
            onUnassignWorker={unassignWorker}
            onSetWip={setWip}
            onSetUseWip={setUseWip}
            onSetEnforceWip={setEnforceWip}
            onSetMaximizeWip={setMaximizeWip}
            onRunDay={runDay}
            onNextDay={nextDay}
            onSaveGame={requestSave}
            onEditTeam={setRoster}
          />
        );

      case 'metrics-round-1':
        if (!state.round1Metrics) return null;
        return (
          <MetricsScreen
            round1Metrics={state.round1Metrics}
            round2Metrics={null}
            phase={state.phase}
            stages={state.workflow.stages}
            onContinue={() => setPhase('wip-setup')}
            onPlayAgain={handleReset}
          />
        );

      case 'wip-setup':
        return (
          <WipLimitSetup
            round1CycleTime={state.round1Metrics?.averageCycleTime ?? 0}
            stages={state.workflow.stages}
            onPredict={setPrediction}
            onStart={(limits: Record<Specialism, number>) => startRound(2, limits)}
          />
        );

      case 'metrics-final':
        if (!state.round1Metrics) return null;
        return (
          <MetricsScreen
            round1Metrics={state.round1Metrics}
            round2Metrics={state.round2Metrics}
            phase={state.phase}
            stages={state.workflow.stages}
            prediction={state.prediction}
            onContinue={() => {}}
            onPlayAgain={handleReset}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Navigation />
      <main className="flex-1">{renderPhase()}</main>
      <Footer />

      {/* Resume prompt for an auto-saved game (non-dismissible: pick one). */}
      <AlertDialog open={!!resumePrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pick up where you left off?</AlertDialogTitle>
            <AlertDialogDescription>
              You have a game auto-saved in this browser ({resumePrompt ? progressLabel(resumePrompt.state) : ''}).
              Resume it, or start a new game.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={discardDraft}>Start a new game</AlertDialogCancel>
            <AlertDialogAction onClick={resumeDraft}>Resume</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SavedGamesDialog open={savesOpen} onOpenChange={setSavesOpen} onResume={handleResume} />
      <SaveGameDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        defaultName={saveName}
        isUpdate={!!saveId}
        saving={isSaving}
        onSave={handleSave}
      />
    </div>
  );
}
