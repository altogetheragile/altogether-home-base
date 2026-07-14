import { useScrumGame } from '@/components/scrumGame/useScrumGame';
import { ScrumIntro } from '@/components/scrumGame/ScrumIntro';
import { SprintPlanning } from '@/components/scrumGame/SprintPlanning';
import { SprintBoard } from '@/components/scrumGame/SprintBoard';
import { SprintReview } from '@/components/scrumGame/SprintReview';
import { SprintRetro } from '@/components/scrumGame/SprintRetro';
import { ScrumFinal } from '@/components/scrumGame/ScrumFinal';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

/** The Scrum Simulation: intro -> Sprint Planning -> Sprint execution (board +
 *  daily Run + burndown) -> Review -> Retrospective -> next Sprint. */
export default function ScrumGame() {
  const {
    state, start, setPhase, setTeam, setDod, moveStory, planSprint, assignDev, unassignDev, addToSprint,
    clearImpediment, acceptChange, declineChange, runDay, runToEnd, reviewSprint,
    nextSprint, endGame, reset,
  } = useScrumGame();

  const renderPhase = () => {
    switch (state.phase) {
      case 'intro':
        return <ScrumIntro productGoal={state.productGoal} sprintLength={state.sprintLength} onStart={start} />;
      case 'planning':
        return <SprintPlanning state={state} onCommit={planSprint} onSetTeam={setTeam} onSetDod={setDod} onMoveStory={moveStory} onBack={() => setPhase('intro')} />;
      case 'sprint':
        return <SprintBoard state={state} onAssignDev={assignDev} onUnassignDev={unassignDev} onAddToSprint={addToSprint} onClearImpediment={clearImpediment} onAcceptChange={acceptChange} onDeclineChange={declineChange} onRunDay={runDay} onRunToEnd={runToEnd} onReview={reviewSprint} />;
      case 'review':
        return <SprintReview state={state} onContinue={() => setPhase('retro')} onEnd={endGame} />;
      case 'retro':
        return <SprintRetro state={state} onChoose={nextSprint} onSetDod={setDod} onEnd={endGame} />;
      case 'final':
        return <ScrumFinal state={state} onReset={reset} />;
      default:
        return <SprintPlanning state={state} onCommit={planSprint} onSetTeam={setTeam} onSetDod={setDod} onMoveStory={moveStory} onBack={() => setPhase('intro')} />;
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Navigation />
      <main className="flex-1">{renderPhase()}</main>
      <Footer />
    </div>
  );
}
