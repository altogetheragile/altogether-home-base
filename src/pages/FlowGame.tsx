import type { Specialism } from '@/components/flowGame/types';
import { useFlowGame } from '@/components/flowGame/useFlowGame';
import { GameIntro } from '@/components/flowGame/GameIntro';
import { BoardView } from '@/components/flowGame/BoardView';
import { WipLimitSetup } from '@/components/flowGame/WipLimitSetup';
import { MetricsScreen } from '@/components/flowGame/MetricsScreen';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function FlowGame() {
  const {
    state,
    assignWorker,
    unassignWorker,
    runDay,
    nextDay,
    startRound,
    setPhase,
    reset,
  } = useFlowGame();

  const renderPhase = () => {
    switch (state.phase) {
      case 'intro':
        return <GameIntro onStart={() => startRound(1)} />;

      case 'playing-round-1':
      case 'playing-round-2':
        if (!state.round) return null;
        return (
          <BoardView
            round={state.round}
            onAssignWorker={assignWorker}
            onUnassignWorker={unassignWorker}
            onRunDay={runDay}
            onNextDay={nextDay}
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
            onContinue={() => {}}
            onPlayAgain={reset}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">{renderPhase()}</main>
      <Footer />
    </div>
  );
}
