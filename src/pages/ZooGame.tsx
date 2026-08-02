import { useEffect } from 'react';
import { useZooGame } from '@/components/zooGame/useZooGame';
import { ZooIntro } from '@/components/zooGame/ZooIntro';
import { SprintPlanning } from '@/components/zooGame/SprintPlanning';
import { SprintBoard } from '@/components/zooGame/SprintBoard';
import { SprintReview } from '@/components/zooGame/SprintReview';
import { SprintRetro } from '@/components/zooGame/SprintRetro';
import { ZooFinal } from '@/components/zooGame/ZooFinal';
import { ZooShell } from '@/components/zooGame/ZooShell';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

/** Build A Zoo: the Scrum loop skinned as building a zoo, with a real customer at
 *  the Review (the visitor simulation). intro -> planning -> sprint -> review ->
 *  retro -> next Sprint. */
export default function ZooGame() {
  const { state, start, setPhase, setGoal, setSprintGoal, takeSignal, plan, estimate, createPbi, refinePbi, reorder, pull, build, editBuild, addAnotherPbi, open, moveZone, createZone, renameZone, reorderZone, closeDay, holdDailyScrum, skipDailyScrum, beginDay, nextSprint, reset } = useZooGame();

  const arrange = { onMoveZone: moveZone, onAddZone: createZone, onRenameZone: renameZone, onReorder: reorderZone };

  // Each phase is its own screen; start it at the top.
  useEffect(() => { window.scrollTo(0, 0); }, [state.phase]);

  const render = () => {
    switch (state.phase) {
      case 'intro':
        return <ZooIntro productGoal={state.productGoal} onSetGoal={setGoal} onStart={start} />;
      case 'planning':
        return <ZooShell state={state} arrange={arrange}><SprintPlanning state={state} onPlan={plan} onEstimate={estimate} onAddPbi={createPbi} onRefinePbi={refinePbi} onReorder={reorder} onSetSprintGoal={setSprintGoal} onTakeSignal={takeSignal} /></ZooShell>;
      case 'sprint':
        return <ZooShell state={state} arrange={arrange}><SprintBoard state={state} onBuild={build} onEditBuild={editBuild} onAddAnother={addAnotherPbi} onAddPbi={createPbi} onRefinePbi={refinePbi} onPull={pull} onOpen={open} onEndDay={closeDay} onHoldDailyScrum={holdDailyScrum} onSkipDailyScrum={skipDailyScrum} onStartDay={beginDay} /></ZooShell>;
      case 'review':
        return <ZooShell state={state} arrange={arrange}><SprintReview state={state} onTakeSignal={takeSignal} onContinue={() => setPhase('retro')} /></ZooShell>;
      case 'retro':
        return <ZooShell state={state} arrange={arrange}><SprintRetro state={state} onNextSprint={nextSprint} onWrapUp={() => setPhase('final')} /></ZooShell>;
      case 'final':
        return <ZooFinal state={state} onReset={reset} />;
      default:
        return <ZooShell state={state} arrange={arrange}><SprintPlanning state={state} onPlan={plan} onEstimate={estimate} onAddPbi={createPbi} onRefinePbi={refinePbi} onReorder={reorder} onSetSprintGoal={setSprintGoal} onTakeSignal={takeSignal} /></ZooShell>;
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
