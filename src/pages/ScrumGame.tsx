import { useEffect } from 'react';
import { useScrumGame } from '@/components/scrumGame/useScrumGame';
import { ScrumIntro } from '@/components/scrumGame/ScrumIntro';
import { RefinementScreen } from '@/components/scrumGame/RefinementScreen';
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
    state, start, setPhase, setTeam, setDod, moveStory, splitStory, planSprint, assignDev, unassignDev, addToSprint,
    clearImpediment, acceptChange, declineChange, chooseEvent, runDay, runToEnd, reviewSprint,
    nextSprint, endGame, reset,
  } = useScrumGame();

  // Each phase is its own screen, so start it at the top - otherwise moving from a
  // long screen (Refinement, Planning) into the next lands mid-page, scrolled down.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.phase]);

  const renderPhase = () => {
    switch (state.phase) {
      case 'intro':
        return <ScrumIntro productGoal={state.productGoal} onStart={start} />;
      case 'refine':
        return <RefinementScreen state={state} onMoveStory={moveStory} onSplitStory={splitStory} onPlan={() => setPhase('planning')} onBack={state.sprints.length === 0 ? () => setPhase('intro') : undefined} />;
      case 'planning':
        return <SprintPlanning state={state} onCommit={planSprint} onSetTeam={setTeam} onSetDod={setDod} onMoveStory={moveStory} onBack={state.sprints.length === 0 ? () => setPhase('refine') : undefined} />;
      case 'sprint':
        return <SprintBoard state={state} onAssignDev={assignDev} onUnassignDev={unassignDev} onAddToSprint={addToSprint} onSplitStory={splitStory} onClearImpediment={clearImpediment} onAcceptChange={acceptChange} onDeclineChange={declineChange} onChooseEvent={chooseEvent} onRunDay={runDay} onRunToEnd={runToEnd} onReview={reviewSprint} />;
      case 'review':
        return <SprintReview state={state} onContinue={() => setPhase('retro')} onEnd={endGame} />;
      case 'retro':
        return <SprintRetro state={state} onChoose={nextSprint} onSetDod={setDod} onEnd={endGame} />;
      case 'final':
        return <ScrumFinal state={state} onReset={reset} />;
      default:
        return <SprintPlanning state={state} onCommit={planSprint} onSetTeam={setTeam} onSetDod={setDod} onMoveStory={moveStory} onBack={state.sprints.length === 0 ? () => setPhase('refine') : undefined} />;
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
