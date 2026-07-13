import { useScrumGame } from '@/components/scrumGame/useScrumGame';
import { ScrumIntro } from '@/components/scrumGame/ScrumIntro';
import { SprintPlanning } from '@/components/scrumGame/SprintPlanning';
import { SprintBoard } from '@/components/scrumGame/SprintBoard';
import { SprintReview } from '@/components/scrumGame/SprintReview';
import { SprintRetro } from '@/components/scrumGame/SprintRetro';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

/** The Scrum Simulation: intro -> Sprint Planning -> Sprint execution (board +
 *  daily Run + burndown) -> Review -> Retrospective -> next Sprint. */
export default function ScrumGame() {
  const { state, start, setPhase, setTeam, planSprint, assignDev, unassignDev, addToSprint, clearImpediment, runDay, runToEnd, reviewSprint, nextSprint } = useScrumGame();

  const renderPhase = () => {
    switch (state.phase) {
      case 'intro':
        return <ScrumIntro productGoal={state.productGoal} sprintLength={state.sprintLength} onStart={start} />;
      case 'planning':
        return <SprintPlanning state={state} onCommit={planSprint} onSetTeam={setTeam} onBack={() => setPhase('intro')} />;
      case 'sprint':
        return <SprintBoard state={state} onAssignDev={assignDev} onUnassignDev={unassignDev} onAddToSprint={addToSprint} onClearImpediment={clearImpediment} onRunDay={runDay} onRunToEnd={runToEnd} onReview={reviewSprint} />;
      case 'review':
        return <SprintReview state={state} onContinue={() => setPhase('retro')} />;
      case 'retro':
        return <SprintRetro state={state} onChoose={nextSprint} />;
      default:
        return <SprintPlanning state={state} onCommit={planSprint} onSetTeam={setTeam} onBack={() => setPhase('intro')} />;
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
