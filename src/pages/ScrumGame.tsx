import { useScrumGame } from '@/components/scrumGame/useScrumGame';
import { ScrumIntro } from '@/components/scrumGame/ScrumIntro';
import { BacklogView } from '@/components/scrumGame/BacklogView';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

/** The Scrum Simulation. Scaffold: intro -> Sprint Planning (artifacts view).
 *  Sprint execution, review and retrospective are built out in later slices. */
export default function ScrumGame() {
  const { state, start, setPhase } = useScrumGame();

  const renderPhase = () => {
    switch (state.phase) {
      case 'intro':
        return <ScrumIntro productGoal={state.productGoal} sprintLength={state.sprintLength} onStart={start} />;
      case 'planning':
        return <BacklogView state={state} onBack={() => setPhase('intro')} />;
      default:
        return <BacklogView state={state} onBack={() => setPhase('intro')} />;
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
