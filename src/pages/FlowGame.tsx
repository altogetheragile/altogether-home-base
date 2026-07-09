import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { GameState, Specialism } from '@/components/flowGame/types';
import { useFlowGame } from '@/components/flowGame/useFlowGame';
import { useFlowGameSaves } from '@/components/flowGame/useFlowGameSaves';
import { GameIntro } from '@/components/flowGame/GameIntro';
import { BoardView } from '@/components/flowGame/BoardView';
import { WipLimitSetup } from '@/components/flowGame/WipLimitSetup';
import { MetricsScreen } from '@/components/flowGame/MetricsScreen';
import { SavedGamesDialog } from '@/components/flowGame/SavedGamesDialog';
import { SaveGameDialog } from '@/components/flowGame/SaveGameDialog';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function FlowGame() {
  const {
    state,
    pullItem,
    reorderItem,
    setWip,
    setEnforceWip,
    setMaximizeWip,
    assignWorker,
    unassignWorker,
    runDay,
    nextDay,
    startRound,
    setPhase,
    setPrediction,
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

  const renderPhase = () => {
    switch (state.phase) {
      case 'intro':
        return (
          <GameIntro
            onStart={(warmStart) => startRound(1, undefined, warmStart)}
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
            onSetEnforceWip={setEnforceWip}
            onSetMaximizeWip={setMaximizeWip}
            onRunDay={runDay}
            onNextDay={nextDay}
            onSaveGame={requestSave}
          />
        );

      case 'metrics-round-1':
        if (!state.round1Metrics) return null;
        return (
          <MetricsScreen
            round1Metrics={state.round1Metrics}
            round2Metrics={null}
            phase={state.phase}
            onContinue={() => setPhase('wip-setup')}
            onPlayAgain={reset}
          />
        );

      case 'wip-setup':
        return (
          <WipLimitSetup
            round1CycleTime={state.round1Metrics?.averageCycleTime ?? 0}
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
            prediction={state.prediction}
            onContinue={() => {}}
            onPlayAgain={reset}
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
