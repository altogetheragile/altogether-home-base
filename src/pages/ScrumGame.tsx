import { useScrumGame } from '@/components/scrumGame/useScrumGame';
import { ScrumIntro } from '@/components/scrumGame/ScrumIntro';
import { SprintPlanning } from '@/components/scrumGame/SprintPlanning';
import { SprintView } from '@/components/scrumGame/SprintView';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

/** The Scrum Simulation. intro -> Sprint Planning -> Sprint (execution scaffold).
 *  Review and Retrospective are built out in later slices. */
export default function ScrumGame() {
  const { state, start, setPhase, planSprint } = useScrumGame();

  const renderPhase = () => {
    switch (state.phase) {
      case 'intro':
        return <ScrumIntro productGoal={state.productGoal} sprintLength={state.sprintLength} onStart={start} />;
      case 'planning':
        return <SprintPlanning state={state} onCommit={planSprint} onBack={() => setPhase('intro')} />;
      case 'sprint':
        return <SprintView state={state} onBack={() => setPhase('planning')} />;
      default:
        return <SprintPlanning state={state} onCommit={planSprint} onBack={() => setPhase('intro')} />;
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
