import { useEffect } from 'react';
import { useZooGame } from '@/components/zooGame/useZooGame';
import { ZooIntro } from '@/components/zooGame/ZooIntro';
import { SprintPlanning } from '@/components/zooGame/SprintPlanning';
import { SprintBoard } from '@/components/zooGame/SprintBoard';
import { SprintReview } from '@/components/zooGame/SprintReview';
import { SprintRetro } from '@/components/zooGame/SprintRetro';
import { ZooFinal } from '@/components/zooGame/ZooFinal';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

/** Build A Zoo: the Scrum loop skinned as building a zoo, with a real customer at
 *  the Review (the visitor simulation). intro -> planning -> sprint -> review ->
 *  retro -> next Sprint. */
export default function ZooGame() {
  const { state, start, setPhase, setGoal, takeSignal, plan, estimate, reorder, pull, build, editBuild, addAnotherPbi, open, closeDay, holdDailyScrum, skipDailyScrum, nextSprint, reset } = useZooGame();

  // Each phase is its own screen; start it at the top.
  useEffect(() => { window.scrollTo(0, 0); }, [state.phase]);

  const render = () => {
    switch (state.phase) {
      case 'intro':
        return <ZooIntro productGoal={state.productGoal} onSetGoal={setGoal} onStart={start} />;
      case 'planning':
        return <SprintPlanning state={state} onPlan={plan} onEstimate={estimate} onReorder={reorder} onTakeSignal={takeSignal} />;
      case 'sprint':
        return <SprintBoard state={state} onBuild={build} onEditBuild={editBuild} onAddAnother={addAnotherPbi} onPull={pull} onOpen={open} onEndDay={closeDay} onHoldDailyScrum={holdDailyScrum} onSkipDailyScrum={skipDailyScrum} />;
      case 'review':
        return <SprintReview state={state} onTakeSignal={takeSignal} onContinue={() => setPhase('retro')} />;
      case 'retro':
        return <SprintRetro state={state} onNextSprint={nextSprint} onWrapUp={() => setPhase('final')} />;
      case 'final':
        return <ZooFinal state={state} onReset={reset} />;
      default:
        return <SprintPlanning state={state} onPlan={plan} onEstimate={estimate} onReorder={reorder} onTakeSignal={takeSignal} />;
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Navigation />
      <main className="flex-1">{render()}</main>
      <Footer />
    </div>
  );
}
